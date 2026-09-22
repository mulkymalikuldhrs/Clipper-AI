/* Smoke test the running preview: landing + auth render without fatal console errors. */
import { chromium } from "playwright";

const URL = process.env.SMOKE_URL ?? "http://127.0.0.1:5173";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
const errors: string[] = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text().slice(0, 200));
});
page.on("pageerror", (e) => errors.push("PAGEERROR: " + String(e).slice(0, 200)));

await page.goto(URL, { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
await page.waitForTimeout(1500);
const heroText = await page.evaluate(() => document.body?.innerText?.slice(0, 400) ?? "");
await page.screenshot({ path: "research/smoke-landing.png" });

await page.goto(URL + "/auth", { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
await page.waitForTimeout(1200);
const authText = await page.evaluate(() => document.body?.innerText?.slice(0, 300) ?? "");
await page.screenshot({ path: "research/smoke-auth.png" });

console.log("=== LANDING TEXT ===");
console.log(heroText.slice(0, 300));
console.log("=== AUTH TEXT ===");
console.log(authText.slice(0, 200));
console.log("=== CONSOLE ERRORS ===");
console.log(errors.length ? errors.slice(0, 10).join("\n") : "(none)");
await browser.close();
