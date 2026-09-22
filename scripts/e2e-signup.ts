/* E2E v2: sign up, wait for dashboard, seed demo from Bridge page, verify data modules. */
import { chromium } from "playwright";

const URL = process.env.SMOKE_URL ?? "http://127.0.0.1:5173";
const EMAIL = `tester+${Date.now()}@superclipper.app`;
const PASS = "test12345";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
const errors: string[] = [];
page.on("pageerror", (e) => errors.push("PAGEERROR: " + String(e).slice(0, 180)));
page.on("console", (m) => {
  if (m.type() === "error" && !m.text().includes("Failed to load resource")) {
    errors.push(m.text().slice(0, 150));
  }
});

await page.goto(URL + "/auth", { waitUntil: "networkidle" });
await page.click("text=Daftar");
await page.fill("#name", "Tester");
await page.fill("#email", EMAIL);
await page.fill("#password", PASS);
await page.click('button[type="submit"]');
await page.waitForURL("**/app", { timeout: 45000 });
await page.waitForTimeout(3500);

// Go to Bridge and seed demo explicitly.
await page.click('a[href="/app/bridge"]');
await page.waitForTimeout(1200);
await page.click("text=Isi Data Demo");
await page.waitForTimeout(6000);
const bridgeText = await page.evaluate(() => document.body?.innerText?.slice(0, 700) ?? "");
await page.screenshot({ path: "research/e2e-bridge.png" });

// Dashboard after seed.
await page.click('a[href="/app"]');
await page.waitForTimeout(3500);
const dash = await page.evaluate(() => document.body?.innerText?.slice(0, 1200) ?? "");
await page.screenshot({ path: "research/e2e-dashboard2.png" });

console.log("=== BRIDGE TEXT ===");
console.log(bridgeText);
console.log("=== DASHBOARD TEXT ===");
console.log(dash);
console.log("=== ERRORS ===");
console.log(errors.length ? errors.slice(0, 10).join("\n") : "(none)");
await browser.close();
