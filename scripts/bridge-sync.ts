/**
 * Super Clipper — bridge-sync: mirrors YOUR OWN konten.com dashboard into your
 * Super Clipper workspace. Run locally: bun scripts/bridge-sync.ts
 *
 * Env (via .env.local — never commit):
 *   KONTEN_EMAIL / KONTEN_PASSWORD   OR   KONTEN_COOKIES_JSON (stringified cookie array)
 *   SUPERCLIPPER_URL   = <Convex HTTP actions URL>/ingest
 *   INGEST_TOKEN       = token registered as Convex env INGEST_TOKEN
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = "https://konten.com";
const EMAIL = process.env.KONTEN_EMAIL ?? "";
const PASSWORD = process.env.KONTEN_PASSWORD ?? "";
const COOKIES_RAW = process.env.KONTEN_COOKIES_JSON ?? "";
const PUSH_URL = process.env.SUPERCLIPPER_URL ?? "";
const TOKEN = process.env.INGEST_TOKEN ?? "";

if (!PUSH_URL || !TOKEN) {
  console.error("Set SUPERCLIPPER_URL dan INGEST_TOKEN di .env.local (lihat halaman Bridge).");
  process.exit(1);
}
if (!EMAIL && !COOKIES_RAW) {
  console.error("Set KONTEN_EMAIL/KONTEN_PASSWORD atau KONTEN_COOKIES_JSON di .env.local.");
  process.exit(1);
}

const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

type Snapshot = Record<string, unknown>;

async function inPageFetch(page: import("playwright").Page, path: string): Promise<unknown> {
  return page.evaluate(async (p) => {
    try {
      const r = await fetch(p, { credentials: "include" });
      if (!r.ok) return { __status: r.status };
      return await r.json();
    } catch (e) {
      return { __error: String(e).slice(0, 120) };
    }
  }, path);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, userAgent: UA });

  if (COOKIES_RAW) {
    const cookies = JSON.parse(COOKIES_RAW);
    await ctx.addCookies(cookies);
    console.log("[bridge] mode cookies:", cookies.length, "cookies");
  }

  const page = await ctx.newPage();
  page.setDefaultTimeout(25000);

  if (!COOKIES_RAW) {
    console.log("[bridge] login…");
    await page.goto(BASE + "/login", { waitUntil: "domcontentloaded" });
    await page
      .locator('input[type="email"], input[name*="email" i]')
      .first()
      .fill(EMAIL);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(4500);
    if (page.url().includes("login")) {
      console.error("[bridge] login gagal — cek kredensial.");
      await browser.close();
      process.exit(2);
    }
    console.log("[bridge] login ok ->", page.url());
  } else {
    await page.goto(BASE + "/clipper-dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3500);
    if (page.url().includes("login")) {
      console.error("[bridge] cookies kedaluwarsa — perbarui KONTEN_COOKIES_JSON.");
      await browser.close();
      process.exit(2);
    }
  }

  // Profile email (needed by ingest to attach data to the right workspace)
  const profile: { email?: string } = ((await inPageFetch(page, "/api/me/profile")) as any)?.profile ?? {};
  let email = profile.email ?? EMAIL;
  if (!email) {
    const u = (await inPageFetch(page, "/auth/v1/user")) as { email?: string };
    email = u?.email ?? "";
  }
  if (!email) {
    console.error("[bridge] tidak bisa menentukan email akun.");
    await browser.close();
    process.exit(3);
  }

  const snap: Snapshot = { profile };
  snap.featureFlags = await inPageFetch(page, "/api/feature-flags");
  snap.earningsSummary = await inPageFetch(page, "/api/earnings/summary");
  snap.timeseries = await inPageFetch(page, "/api/clipper/views-timeseries?range=1M");
  snap.wallet = await inPageFetch(page, "/api/wallet");
  snap.tier = await inPageFetch(page, "/api/tier");
  snap.joined = await inPageFetch(page, "/api/campaigns/joined-details");
  const participate = (await inPageFetch(page, "/api/campaigns/participate")) as { campaignIds?: string[] };
  const joinedIds = new Set([
    ...(((snap.joined as { campaigns?: { id?: string }[] })?.campaigns ?? []).map((c) => c.id ?? "")),
    ...(participate?.campaignIds ?? []),
  ]);

  // Campaign list. The API rejected `limit`/`offset` on 2026-09-22 (HTTP 400),
  // so try the known query shapes and use the first that returns campaigns.
  const LIST_QUERIES = [
    "/api/campaigns?status=active",
    "/api/campaigns?status=active&limit=50",
    "/api/campaigns",
  ];
  let campaigns: Record<string, unknown>[] = [];
  for (const q of LIST_QUERIES) {
    const batch = (await inPageFetch(page, q)) as { campaigns?: Record<string, unknown>[] };
    const list = batch?.campaigns ?? [];
    if (list.length > 0) {
      campaigns = list;
      console.log(`[bridge] daftar campaign dari ${q}: ${list.length}`);
      break;
    }
    console.log(`[bridge] ${q} tidak mengembalikan campaign — coba bentuk lain.`);
  }

  // Detail per campaign: `brief_detail` (materi, narasi, CTA, elemen wajib,
  // do & don't, target audiens) HANYA ada di endpoint detail. Tanpa langkah ini
  // Brief Autopilot tidak punya bahan untuk menyusun rencana produksi.
  let detailed = 0;
  const enriched: Record<string, unknown>[] = [];
  for (const c of campaigns) {
    const slug = (c as { slug?: string }).slug;
    if (!slug) {
      enriched.push(c);
      continue;
    }
    const detail = (await inPageFetch(page, `/api/campaigns/${slug}`)) as {
      campaign?: Record<string, unknown>;
    };
    const full = detail?.campaign;
    enriched.push(full ? { ...c, ...full } : c);
    if (full?.brief_detail) detailed++;
    await page.waitForTimeout(200); // be polite
  }
  snap.campaigns = enriched;
  snap.detailFetched = detailed;
  console.log(`[bridge] brief_detail diambil untuk ${detailed}/${campaigns.length} campaign`);

  // Catatan: endpoint /api/campaigns/:id/closure mengembalikan 404 sejak
  // 2026-09-22, jadi sisa budget dihitung dari budget/spent (lihat scoreCampaign).

  // Earnings rows
  const earnings = (await inPageFetch(page, "/api/earnings")) as { earnings?: Record<string, unknown>[] };
  snap.earningsRows = earnings?.earnings ?? [];

  // Politeness delay, then push
  const emailSafe = email;
  const res = await fetch(PUSH_URL, {
    method: "POST",
    headers: { "content-type": "application/json", "x-sc-token": TOKEN },
    body: JSON.stringify({ email: emailSafe, source: "bridge", snapshot: snap }),
  });
  const out = (await res.json()) as { ok?: boolean; error?: string; campaigns?: number };
  if (!res.ok || out?.error) {
    console.error("[bridge] push gagal:", res.status, out);
    await browser.close();
    process.exit(4);
  }
  console.log(`[bridge] push ok: ${out.campaigns} campaign untuk ${emailSafe.replace(/(.{2}).*(@.*)/, "$1***$2")}`);

  // Persist cookies for next-run cookie mode (local only)
  try {
    const cookies = await ctx.cookies();
    mkdirSync(".bridge", { recursive: true });
    const { writeFileSync } = await import("node:fs");
    writeFileSync(".bridge/konten-cookies.json", JSON.stringify(cookies, null, 1));
    console.log("[bridge] cookies disimpan lokal ke .bridge/konten-cookies.json");
  } catch {
    /* ignore */
  }

  await browser.close();
}

main().catch((e) => {
  console.error("[bridge] fatal:", e);
  process.exit(1);
});
