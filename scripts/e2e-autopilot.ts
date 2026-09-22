/* E2E: create autopilot plan for joined IBU campaign and verify plan content. */
import { chromium } from "playwright";

const URL = process.env.SMOKE_URL ?? "http://127.0.0.1:5173";
const EMAIL = `tester+${Date.now()}@superclipper.app`;
const PASS = "test12345";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
const errors: string[] = [];
page.on("pageerror", (e) => errors.push("PAGEERROR: " + String(e).slice(0, 180)));

await page.goto(URL + "/auth", { waitUntil: "networkidle" });
await page.click("text=Daftar");
await page.fill("#name", "Tester");
await page.fill("#email", EMAIL);
await page.fill("#password", PASS);
await page.click('button[type="submit"]');
await page.waitForURL("**/app", { timeout: 45000 });
await page.waitForTimeout(6000); // auto-seed window

// Autopilot
await page.click('a[href="/app/autopilot"]');
await page.waitForTimeout(2000);
const body1 = await page.evaluate(() => document.body?.innerText?.slice(0, 400) ?? "");
// click campaign tab then create plan
const createBtn = page.locator("text=Susun Rencana Sekarang");
if (await createBtn.count()) {
  await createBtn.first().click();
  await page.waitForTimeout(3000);
} else {
  // plan may already exist; open first campaign tab
  await page.locator("button").filter({ hasText: "IBU" }).first().click().catch(() => {});
  await page.waitForTimeout(2000);
}
const plan = await page.evaluate(() => document.body?.innerText?.slice(0, 1600) ?? "");
await page.screenshot({ path: "research/e2e-autopilot.png", fullPage: false });

console.log("=== AUTOPILOT (sebelum) ===");
console.log(body1);
console.log("=== PLAN ===");
console.log(plan);
console.log("=== ERRORS ===");
console.log(errors.length ? errors.slice(0, 8).join("\n") : "(none)");
await browser.close();
