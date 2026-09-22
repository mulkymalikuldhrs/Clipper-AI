/**
 * Super Clipper — full campaign extractor (research tool).
 *
 * Logs in with KONTEN_EMAIL / KONTEN_PASSWORD, lists every campaign the account
 * can see, then fetches the FULL detail (including `brief_detail`: materi,
 * narasi, CTA, do & don'ts, target audience, hashtags), the top-clips
 * leaderboard and the budget-closure status for each one.
 *
 * Output is written to research/konten-campaigns.json (gitignored) so the demo
 * seed + brief parser can be validated against real, complete briefs.
 *
 * Never prints credentials. Run: bun scripts/crawl-campaigns.ts
 */
import { chromium } from "playwright";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const BASE = "https://konten.com";
const EMAIL = process.env.KONTEN_EMAIL ?? "";
const PASSWORD = process.env.KONTEN_PASSWORD ?? "";
if (!EMAIL || !PASSWORD) {
  console.error("Missing KONTEN_EMAIL/KONTEN_PASSWORD in env — aborting.");
  process.exit(1);
}

const STATUSES = [
  "/api/campaigns?status=active&limit=50",
  "/api/campaigns?status=active",
  "/api/campaigns?limit=50",
  "/api/campaigns",
  "/api/campaigns?status=active&page=1&limit=20",
  "/api/campaigns?status=all&limit=50",
];

type Json = Record<string, unknown>;
const out: {
  capturedAt: string;
  counts: Record<string, number>;
  campaigns: Json[];
  errors: string[];
} = { capturedAt: new Date().toISOString(), counts: {}, campaigns: [], errors: [] };

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1366, height: 900 },
  userAgent:
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
});
const page = await ctx.newPage();

// --- login ---
await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
await page.locator('input[type="email"], input[name*="email" i]').first().fill(EMAIL);
await page.locator('input[type="password"]').first().fill(PASSWORD);
await page.locator('button[type="submit"], button:has-text("Masuk"), button:has-text("Login")').first().click();
await page.waitForTimeout(4500);
const loggedIn = !page.url().includes("login");
console.log("login ->", page.url(), loggedIn ? "(ok)" : "(FAILED)");
if (!loggedIn) {
  console.error("Login failed — cek KONTEN_EMAIL/KONTEN_PASSWORD.");
  await browser.close();
  process.exit(1);
}

// --- collect campaign list (defensive: API query contract has drifted before) ---
const seen = new Map<string, Json>();
for (const q of STATUSES) {
  const res = await page.evaluate(async (u: string) => {
    const r = await fetch(u, { credentials: "include" });
    return { status: r.status, body: await r.json().catch(() => null) };
  }, q);
  const list = (res.body as { campaigns?: Json[] } | null)?.campaigns ?? [];
  console.log(`[list] ${q} http=${res.status} campaigns=${list.length}`);
  out.counts[q] = list.length;
  for (const c of list) {
    const slug = String(c.slug ?? "");
    if (slug && !seen.has(slug)) seen.set(slug, c);
  }
  if (list.length > 0) break; // first shape that works wins
}

// Fallback / top-up: every campaign slug the deep crawler already discovered.
const PROGRESS = "research/.crawl-progress.json";
if (existsSync(PROGRESS)) {
  try {
    const prog = JSON.parse(readFileSync(PROGRESS, "utf8")) as { discovered?: string[]; pages?: { path: string }[] };
    const paths = [...(prog.discovered ?? []), ...(prog.pages ?? []).map((p) => p.path)];
    for (const path of paths) {
      const m = /^\/clipper-campaigns\/([a-z0-9-]+)$/.exec(path);
      if (m && !seen.has(m[1])) seen.set(m[1], { slug: m[1] });
    }
  } catch {
    /* ignore */
  }
}
console.log(`[queue] ${seen.size} campaigns akan diambil detailnya`);

// --- full detail per campaign ---
let i = 0;
for (const [slug, listRow] of seen) {
  i++;
  const id = String(listRow.id ?? "");
  try {
    const data = await page.evaluate(
      async ({ s, cid }: { s: string; cid: string }) => {
        const get = async (u: string) => {
          const r = await fetch(u, { credentials: "include" });
          return { status: r.status, body: await r.json().catch(() => null) };
        };
        const detail = await get(`/api/campaigns/${s}`);
        const top = await get(`/api/campaigns/${s}/top-clips`);
        const closure = cid ? await get(`/api/campaigns/${cid}/closure`) : { status: 0, body: null };
        return { detail, top, closure };
      },
      { s: slug, cid: id }
    );
    const campaign = (data.detail.body as { campaign?: Json } | null)?.campaign ?? null;
    if (!campaign) {
      out.errors.push(`${slug}: detail http=${data.detail.status} tanpa campaign`);
      console.log(`[skip] ${slug} (${data.detail.status})`);
      continue;
    }
    const bd = (campaign.brief_detail ?? {}) as Json;
    out.campaigns.push({
      slug,
      id: campaign.id,
      title: campaign.title,
      brand: campaign.brand,
      category: campaign.category,
      platform: campaign.platform,
      status: campaign.status,
      campaign_type: campaign.campaign_type,
      rate_per_million: campaign.rate_per_million,
      cpm_tiktok: campaign.cpm_tiktok,
      cpm_instagram: campaign.cpm_instagram,
      cpm_youtube: campaign.cpm_youtube,
      budget: campaign.budget,
      spent: campaign.spent,
      clippers: campaign.clippers,
      total_clips: campaign.total_clips,
      total_views: campaign.total_views,
      min_views: campaign.min_views,
      min_video_duration: campaign.min_video_duration,
      max_videos_per_clipper: campaign.max_videos_per_clipper,
      deadline: campaign.deadline,
      hashtags: campaign.hashtags,
      tier_access: campaign.tier_access,
      min_tier: campaign.min_tier,
      brief_goal: campaign.brief_goal,
      brief_dos: campaign.brief_dos,
      brief_donts: campaign.brief_donts,
      brief_narrative: campaign.brief_narrative,
      brief_caption: campaign.brief_caption,
      brief_social_tags: campaign.brief_social_tags,
      brief_detail: bd,
      top_clips: (data.top.body as { clips?: Json[] } | null)?.clips ?? data.top.body,
      closure: data.closure.body,
      detailStatus: data.detail.status,
      topStatus: data.top.status,
      closureStatus: data.closure.status,
    });
    console.log(
      `[ok ${i}/${seen.size}] ${slug} materi=${(bd.materi as unknown[] | undefined)?.length ?? 0} do=${(bd.bolehDilakukan as unknown[] | undefined)?.length ?? 0} dont=${(bd.dilarangDilakukan as unknown[] | undefined)?.length ?? 0}`
    );
  } catch (e) {
    out.errors.push(`${slug}: ${String(e).slice(0, 200)}`);
    console.log(`[err] ${slug}: ${String(e).slice(0, 160)}`);
  }
  await page.waitForTimeout(150);
}

writeFileSync("research/konten-campaigns.json", JSON.stringify(out, null, 1));
console.log(
  `[done] campaigns=${out.campaigns.length} errors=${out.errors.length} -> research/konten-campaigns.json`
);
await browser.close();
