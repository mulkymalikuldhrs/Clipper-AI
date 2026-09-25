/**
 * Clipper AI — konten.com live crawler (research tool, deep mode).
 *
 * Logs in with credentials from env (KONTEN_EMAIL / KONTEN_PASSWORD), then
 * BREADTH-FIRST-CRAWLS every reachable internal clipper page (sidebar routes,
 * campaign detail pages, sub-pages discovered from links), recording DOM
 * structure + every XHR/JSON response. Saves screenshots to
 * research/konten-snapshots/ and a map + endpoint index to research/konten-map.json.
 *
 * Never prints credentials. Output lives under research/ which is gitignored.
 * Run: bun scripts/konten-crawler.ts
 */
import { chromium } from "playwright";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const BASE = "https://konten.com";
const OUT = path.resolve("research");
const SHOTS = path.join(OUT, "konten-snapshots");
mkdirSync(SHOTS, { recursive: true });

const EMAIL = process.env.KONTEN_EMAIL ?? "";
const PASSWORD = process.env.KONTEN_PASSWORD ?? "";
if (!EMAIL || !PASSWORD) {
  console.error("Missing KONTEN_EMAIL/KONTEN_PASSWORD in env — aborting.");
  process.exit(1);
}

// Seed routes that every clipper account exposes (verified in the 22 Sep crawl).
const SEED_PAGES = [
  "/",
  "/clipper",
  "/clipper-dashboard",
  "/clipper-campaigns",
  "/campaigns",
  "/clipper-analytic",
  "/clipper-earnings",
  "/clipper-tier",
  "/profile",
  "/settings",
  "/dashboard",
];

// Account-scoped routes worth probing explicitly even if no link points to them.
const PROBE_PAGES = [
  "/clipper-withdraw",
  "/clipper-wallet",
  "/withdraw",
  "/clipper-payment",
  "/clipper-payment-methods",
  "/clipper-kyc",
  "/kyc",
  "/clipper-videos",
  "/clipper-submissions",
  "/tracked-videos",
  "/clipper-affiliate",
  "/affiliate",
  "/clipper-banding",
  "/banding",
  "/notifications",
  "/clipper-notifications",
  "/clipper-leaderboard",
  "/leaderboard",
  "/referral",
  "/clipper-referral",
  "/invite",
  "/clipper-invite",
  "/help",
  "/support",
  "/clipper-guide",
  "/faq",
];

const SKIP = /\/login|\/register|\/logout|\/auth\/|signout|sign-out/i;

const MAX_PAGES = Number(process.env.CRAWL_MAX_PAGES ?? 250);
const CONCURRENCY = 1; // polite: one at a time
// Terminal commands are capped, so bound each pass and remember progress so
// repeated runs continue where the last one stopped (research/.crawl-progress.json).
const BUDGET_MS = Number(process.env.CRAWL_BUDGET_MS ?? 150_000);
const START = Date.now();
const PROGRESS = path.join(OUT, ".crawl-progress.json");
const overBudget = () => Date.now() - START > BUDGET_MS;

type JsonHit = { page: string; url: string; method: string; status: number; body: string };
type PageMap = {
  path: string;
  finalUrl: string;
  title: string;
  headings: string[];
  buttons: string[];
  links: string[];
  textSample: string;
  shot: string;
  jsonHits: number;
  error?: string;
  status?: number;
};

const jsonHits: JsonHit[] = [];
const seenJson = new Set<string>();
let currentPage = "";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1366, height: 900 },
    userAgent:
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  });

  ctx.on("response", async (res) => {
    try {
      const ct = res.headers()["content-type"] ?? "";
      if (!ct.includes("json")) return;
      const url = res.url();
      const key = `${res.request().method()} ${url}`;
      if (seenJson.has(key)) return;
      seenJson.add(key);
      let body = "";
      try {
        body = (await res.text()).slice(0, 4000);
      } catch {
        body = "<unreadable>";
      }
      jsonHits.push({
        page: currentPage,
        url,
        method: res.request().method(),
        status: res.status(),
        body,
      });
    } catch {
      /* ignore */
    }
  });

  const page = await ctx.newPage();
  page.setDefaultTimeout(20000);

  const maps: PageMap[] = [];
  const visited = new Set<string>();
  const discovered = new Set<string>();
  // Cumulative endpoint index, merged across passes so nothing is lost when a
  // bounded pass ends early.
  const endpointIndex: Record<string, { methods: string[]; statuses: number[]; seenOn: string[] }> = {};
  const fresh = process.argv.includes("--fresh");
  const merge = process.argv.includes("--merge"); // re-crawl all, but accumulate
  if (!fresh && existsSync(PROGRESS)) {
    try {
      const prev = JSON.parse(readFileSync(PROGRESS, "utf8")) as {
        pages?: PageMap[];
        discovered?: string[];
        endpoints?: typeof endpointIndex;
      };
      if (!merge) {
        for (const m of prev.pages ?? []) {
          visited.add(m.path);
          maps.push(m);
        }
      }
      for (const p of prev.discovered ?? []) discovered.add(p);
      Object.assign(endpointIndex, prev.endpoints ?? {});
      console.log(
        `[${merge ? "merge" : "resume"}] ${maps.length} pages cached, ${Object.keys(endpointIndex).length} endpoints cached`
      );
    } catch {
      /* start clean */
    }
  }

  const normalize = (href: string): string | null => {
    try {
      const u = href.startsWith("http") ? new URL(href) : new URL(href, BASE);
      if (u.host !== "konten.com") return null;
      let p = u.pathname.replace(/\/+$/, "") || "/";
      if (SKIP.test(p)) return null;
      if (/\.(png|jpe?g|svg|ico|css|js|json|woff2?|mp4|webm)$/i.test(p)) return null;
      return p;
    } catch {
      return null;
    }
  };

  const snapPage = async (p: string): Promise<PageMap> => {
    currentPage = p;
    visited.add(p);
    const name = p.replace(/\//g, "_").replace(/^_/, "") || "root";
    const shot = `${name}.png`;
    const entry: PageMap = {
      path: p,
      finalUrl: "",
      title: "",
      headings: [],
      buttons: [],
      links: [],
      textSample: "",
      shot,
      jsonHits: 0,
    };
    try {
      const resp = await page.goto(BASE + p, { waitUntil: "domcontentloaded", timeout: 25000 });
      entry.status = resp?.status();
      entry.finalUrl = page.url();

      // If we got bounced to /login, mark it — tells us the route is gated/does not exist.
      if (entry.finalUrl.includes("/login")) {
        entry.error = "redirected-to-login";
        maps.push(entry);
        return entry;
      }

      entry.title = await page.title();
      try {
        await page.waitForLoadState("networkidle", { timeout: 2500 });
      } catch {
        /* SPA keeps polling — fine */
      }
      // reveal a little lazy content + sidebar groups (keep it quick: budgeted pass)
      await page.mouse.wheel(0, 2400).catch(() => {});
      await page.waitForTimeout(500);

      entry.headings = await page.$$eval("h1, h2, h3, h4", (els) =>
        els.slice(0, 60).map((e) => (e.textContent ?? "").trim()).filter(Boolean)
      );
      entry.buttons = await page.$$eval("button, a[role=button]", (els) =>
        Array.from(
          new Set(
            els
              .slice(0, 80)
              .map((e) => (e.textContent ?? "").trim())
              .filter((t) => t && t.length < 80)
          )
        )
      );
      const rawLinks = await page.$$eval("a[href]", (els) =>
        els.map((e) => (e as HTMLAnchorElement).getAttribute("href") ?? "")
      );
      entry.links = Array.from(new Set(rawLinks.filter(Boolean))).slice(0, 120);
      entry.textSample = ((await page.evaluate(() => document.body?.innerText ?? "")) as string)
        .replace(/\s{3,}/g, "\n")
        .slice(0, 5000);
      entry.jsonHits = jsonHits.filter((j) => j.page === p).length;

      // Queue every internal link we have not visited/probed yet (BFS).
      for (const href of entry.links) {
        const np = normalize(href);
        if (!np || visited.has(np) || discovered.has(np)) continue;
        discovered.add(np);
      }

      await page.screenshot({ path: path.join(SHOTS, shot), fullPage: false });
      console.log(`[ok] ${p} -> ${entry.finalUrl} (json:${entry.jsonHits})`);
    } catch (e) {
      entry.error = String(e).slice(0, 300);
      console.log(`[err] ${p}: ${entry.error}`);
      try {
        await page.screenshot({ path: path.join(SHOTS, shot) });
      } catch {
        /* ignore */
      }
    }
    // Upsert by path so re-crawls replace rather than duplicate.
    const at = maps.findIndex((m) => m.path === p);
    if (at >= 0) maps[at] = entry;
    else maps.push(entry);
    return entry;
  };

  // --- 1) Log in ---
  currentPage = "/login";
  let loginStatus = "unknown";
  try {
    await page.goto(BASE + "/login", { waitUntil: "domcontentloaded", timeout: 25000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SHOTS, "login.png") });
    const emailInput = page
      .locator('input[type="email"], input[name*="email" i], input[autocomplete*="email" i]')
      .first();
    const passInput = page.locator('input[type="password"]').first();
    await emailInput.waitFor({ state: "visible", timeout: 10000 });
    await emailInput.fill(EMAIL);
    await passInput.fill(PASSWORD);
    await page.screenshot({ path: path.join(SHOTS, "login_filled.png") });
    const submit = page
      .locator('button[type="submit"], button:has-text("Login"), button:has-text("Masuk")')
      .first();
    await Promise.race([submit.click(), page.keyboard.press("Enter")]);
    await page.waitForTimeout(4500);
    const stillLogin = page.url().includes("login");
    loginStatus = stillLogin ? `still-on-login (${page.url()})` : `ok -> ${page.url()}`;
    await page.screenshot({ path: path.join(SHOTS, "after_login.png") });
    console.log(`[login] ${loginStatus}`);
  } catch (e) {
    loginStatus = `error: ${String(e).slice(0, 200)}`;
    console.log(`[login-err] ${loginStatus}`);
  }

  // --- 2) BFS seed + probe routes ---
  // Seed the queue with: unvisited seed/probe routes AND every link discovered
  // by earlier passes. Previously discovered links were only drained *inside*
  // the loop, so once all seeds/probes were visited the crawl stopped early
  // with campaign detail + briefing pages still unexplored.
  const queue: string[] = [];
  const enqueue = (p: string) => {
    if (!visited.has(p) && !queue.includes(p)) queue.push(p);
  };
  for (const p of [...SEED_PAGES, ...PROBE_PAGES]) enqueue(p);
  for (const d of discovered) enqueue(d);

  while (queue.length > 0 && visited.size < MAX_PAGES) {
    if (overBudget()) {
      console.log(`[budget] reached after ${visited.size} pages — re-run to continue.`);
      break;
    }
    const next = queue.shift()!;
    if (visited.has(next)) continue;
    await snapPage(next);
    // snapPage() added new internal links to `discovered`; drain them into the queue.
    for (const d of discovered) {
      if (!visited.has(d) && !queue.includes(d)) queue.push(d);
    }
    await page.waitForTimeout(300 * CONCURRENCY); // polite pacing
  }

  // --- 3) Persist ---
  const cookies = await ctx.cookies();
  writeFileSync(path.join(OUT, "konten-cookies.json"), JSON.stringify(cookies, null, 2));

  const storage = await page.evaluate(() => {
    const o: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) ?? "";
      const v = localStorage.getItem(k) ?? "";
      o[k] = v.length > 400 ? v.slice(0, 400) + "…" : v;
    }
    return o;
  });

  // Merge this pass's JSON traffic into the cumulative endpoint index.
  for (const h of jsonHits) {
    let key = h.url;
    try {
      const u = new URL(h.url);
      key = u.pathname + (u.search ? "?" + u.searchParams.toString() : "");
    } catch {
      /* keep raw */
    }
    const rec = (endpointIndex[key] ??= { methods: [], statuses: [], seenOn: [] });
    if (!rec.methods.includes(h.method)) rec.methods.push(h.method);
    if (!rec.statuses.includes(h.status)) rec.statuses.push(h.status);
    if (!rec.seenOn.includes(h.page)) rec.seenOn.push(h.page);
  }

  // Persist cumulative state so the next pass resumes/merges instead of redoing work.
  writeFileSync(
    PROGRESS,
    JSON.stringify(
      { pages: maps, discovered: Array.from(discovered), endpoints: endpointIndex, updatedAt: Date.now() },
      null,
      1
    )
  );

  writeFileSync(
    path.join(OUT, "konten-map.json"),
    JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        loginStatus,
        pagesCrawledThisPass: maps.map((m) => m.path),
        visitedPages: Array.from(visited),
        discoveredButUncrawled: Array.from(discovered).filter((d) => !visited.has(d)),
        localStorageKeys: Object.keys(storage),
        storage,
        pages: maps,
        endpointIndex,
        jsonHits: jsonHits.slice(0, 400),
      },
      null,
      2
    )
  );
  writeFileSync(
    path.join(OUT, "konten-endpoints.json"),
    JSON.stringify(endpointIndex, null, 2)
  );
  console.log(
    `[done] pages=${maps.length} jsonHits=${jsonHits.length} endpoints=${Object.keys(endpointIndex).length} login=${loginStatus}`
  );
  await browser.close();
}

main().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
