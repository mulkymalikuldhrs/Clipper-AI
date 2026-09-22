/* Targeted crawl: login + fetch campaign detail APIs with full bodies. */
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = "https://konten.com";
const EMAIL = process.env.KONTEN_EMAIL ?? "";
const PASSWORD = process.env.KONTEN_PASSWORD ?? "";
if (!EMAIL || !PASSWORD) {
  console.error("Missing credentials env");
  process.exit(1);
}

const SLUGS = [
  "ibu-bagaimana-aku-tanpamu-trailer-soundtrack-film-copy",
  "david-noah-copy",
  "bevan",
  "podcast-wondermoms-community-vol-2-copy",
  "growlab-beyond-the-podcast-1",
  "owner-artha-ldt",
];

const out: Record<string, unknown> = {};

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1366, height: 900 },
  userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
});
const page = await ctx.newPage();
await page.goto(BASE + "/login", { waitUntil: "domcontentloaded" });
await page.locator('input[type="email"], input[name*="email" i]').first().fill(EMAIL);
await page.locator('input[type="password"]').first().fill(PASSWORD);
await page.locator('button[type="submit"]').first().click();
await page.waitForTimeout(4000);
console.log("login ->", page.url());

for (const slug of SLUGS) {
  try {
    const data = await page.evaluate(async (s) => {
      const r = await fetch(`/api/campaigns/${s}`, { credentials: "include" });
      return { status: r.status, body: await r.json() };
    }, slug);
    out[slug] = data;
    console.log(`[ok] ${slug} status=${data.status}`);
  } catch (e) {
    console.log(`[err] ${slug}: ${String(e).slice(0, 120)}`);
  }
}

writeFileSync("research/konten-details.json", JSON.stringify(out, null, 1));
console.log("saved research/konten-details.json");
await browser.close();
