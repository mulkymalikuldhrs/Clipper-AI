#!/usr/bin/env bun
/** Built-in read-only browser inspection. No clicks, forms, downloads, or stealth behavior. */
import { chromium } from "playwright";
import { isAllowedBrowserUrl } from "../src/lib/operatorRuntime";

const args = process.argv.slice(2);
const url = args[0];
const engineIndex = args.indexOf("--engine");
const engine = engineIndex >= 0 ? args[engineIndex + 1] ?? "playwright" : "playwright";

if (!url || !isAllowedBrowserUrl(url)) {
  console.error("Usage: bun scripts/sc-browser.ts <allowlisted-url> [--engine playwright]");
  console.error("Only operator-owned allowlisted read-only pages are accepted.");
  process.exit(2);
}
if (engine !== "playwright") {
  console.error(`Browser engine ${engine} is not installed or verified. Use the built-in Playwright runner; do not enable anti-detection or anti-bot bypass.`);
  process.exit(2);
}

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
  const title = await page.title();
  const text = (await page.locator("body").innerText({ timeout: 10_000 })).replace(/\s+/g, " ").trim().slice(0, 2_000);
  console.log(JSON.stringify({ ok: true, engine, url, title, text }, null, 2));
} finally {
  await browser.close();
}
