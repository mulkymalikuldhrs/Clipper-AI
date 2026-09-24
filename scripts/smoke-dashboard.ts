/**
 * Smoke test — renders the public pages and every authenticated route in a real
 * browser and reports page errors, console errors, empty renders, and overflow.
 *
 * Usage: bun scripts/smoke-dashboard.ts        (expects the dev preview on :5173)
 * Output: research/shots/*.png + a text report on stdout.
 */
import { chromium } from "playwright";
import { mkdirSync, utimesSync } from "node:fs";

const BASE = process.env.SMOKE_URL ?? "http://127.0.0.1:5173";
const OUT = "research/shots";

/** Public routes, checked in the signed-out state before signup. */
const PUBLIC: [string, string][] = [
  ["landing", "/"],
  ["auth", "/auth"],
];

const ROUTES: [string, string][] = [
  ["dashboard", "/app"],
  ["scanner", "/app/scanner"],
  ["autopilot", "/app/autopilot"],
  ["analytics", "/app/analytics"],
  ["earnings", "/app/earnings"],
  ["bridge", "/app/bridge"],
  ["organism", "/app/organism"],
];

const EMAIL = `smoke+${Date.now()}@superclipper.app`;
const PASS = "test12345";

mkdirSync(OUT, { recursive: true });

// Vite picks up writes from the workspace sync layer by mtime; bumping it before the
// run guarantees a browser sees the current source instead of a cached transform.
for (const f of [
  "src/components/shared.tsx",
  "src/components/layout/DashboardLayout.tsx",
  "src/App.tsx",
  "src/pages/Landing.tsx",
  "src/pages/Auth.tsx",
  "src/components/auth/RequireAuth.tsx",
  "src/pages/dashboard/DashboardHome.tsx",
  "src/pages/dashboard/Scanner.tsx",
  "src/pages/dashboard/Autopilot.tsx",
  "src/pages/dashboard/CampaignDetail.tsx",
  "src/pages/dashboard/Analytics.tsx",
  "src/pages/dashboard/Earnings.tsx",
  "src/pages/dashboard/Bridge.tsx",
  "src/pages/dashboard/Organism.tsx",
]) {
  const now = new Date();
  try {
    utimesSync(f, now, now);
  } catch {
    /* file name mismatch is not fatal */
  }
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
const problems: string[] = [];
page.on("pageerror", (e) => problems.push(`pageerror: ${String(e).slice(0, 200)}`));
page.on("console", (m) => {
  if (m.type() === "error") problems.push(`console: ${m.text().slice(0, 200)}`);
});

type Row = {
  route: string;
  chars: number;
  problems: number;
  overflow: number;
  offenders: string[];
  chain: string[];
  top: string;
};

const report: Row[] = [];
const publicReport: Row[] = [];

const mainText = (p: import("playwright").Page) =>
  p.evaluate(
    () => (document.querySelector("main") as HTMLElement | null)?.innerText?.trim() ?? ""
  );

async function visit(name: string, route: string, dump: boolean, into: Row[]) {
  const before = problems.length;
  await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  const text = await mainText(page);
  const overflow = await page.evaluate(() => {
    const d = document.documentElement;
    return Math.max(0, d.scrollWidth - d.clientWidth);
  });
  const offenders = overflow
    ? await page.evaluate(() => {
        const w = document.documentElement.clientWidth;
        const bad: string[] = [];
        document.querySelectorAll("main *").forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.right > w + 1 && r.width > 32) {
            const cls = (el.getAttribute("class") ?? "").replace(/\s+/g, " ").slice(0, 60);
            const scroll = el.closest(".overflow-x-auto") ? " [in-scroller]" : "";
            const text = (el.textContent ?? "").trim().slice(0, 24).replace(/\s+/g, " ");
            bad.push(
              `${Math.round(r.right)}px <${el.tagName.toLowerCase()} class="${cls}">${scroll} “${text}”`
            );
          }
        });
        return [...new Set(bad)].sort((a, b) => parseInt(b) - parseInt(a)).slice(0, 6);
      })
    : [];
  const chain = overflow
    ? await page.evaluate(() => {
        const w = document.documentElement.clientWidth;
        const start = [...document.querySelectorAll("main *")].find(
          (e) => e.getBoundingClientRect().right > w + 1
        );
        const out: string[] = [];
        let n: Element | null = start ?? null;
        while (n && n !== document.body) {
          const r = n.getBoundingClientRect();
          const cls = (n.getAttribute("class") ?? "").split(" ").slice(0, 3).join(".");
          out.push(
            `${n.tagName.toLowerCase()}.${cls} w=${Math.round(r.width)} scrollW=${n.scrollWidth} overflowX=${getComputedStyle(n).overflowX} minW=${getComputedStyle(n).minWidth}`
          );
          n = n.parentElement;
        }
        return out;
      })
    : [];
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  into.push({
    route,
    chars: text.length,
    problems: problems.length - before,
    overflow,
    offenders,
    chain,
    top: dump ? text.split("\n").filter(Boolean).slice(0, 18).join("\n    ") : "",
  });
}

function print(rows: Row[]) {
  for (const r of rows) {
    console.log(
      `${r.route.padEnd(30)} text=${String(r.chars).padStart(5)} problems=${r.problems} overflow=${r.overflow}px`
    );
    if (r.top) console.log(`  ${r.top}`);
    for (const o of r.offenders) console.log(`    ${o}`);
    for (const c of r.chain) console.log(`      ^ ${c}`);
  }
}

/* ------------------------------------------------------------ signed out */

console.log("\n=== PUBLIC 1440x950 (signed out) ===");
for (const [name, route] of PUBLIC) await visit(name, route, true, publicReport);
print(publicReport);

/* -------------------------------------------------------------- sign up */

console.log(`\n[smoke] signing up ${EMAIL}`);
await page.goto(`${BASE}/auth?returnTo=//example.com`, { waitUntil: "networkidle" });
try {
  await page.waitForSelector("#email", { timeout: 20000 });
} catch {
  const text = await page.evaluate(() => document.body?.innerText ?? "(no body text)");
  console.log("=== AUTH PAGE DID NOT RENDER ===");
  console.log(text.slice(0, 800) || "(empty)");
  console.log("=== PROBLEMS ===");
  console.log(problems.join("\n") || "(none)");
  await page.screenshot({ path: `${OUT}/auth-failure.png`, fullPage: false });
  await browser.close();
  process.exit(1);
}
await page.click("text=Daftar");
await page.fill("#name", "Smoke Tester");
await page.fill("#email", EMAIL);
await page.fill("#password", PASS);
await page.click('button[type="submit"]');
await page.waitForURL("**/app", { timeout: 45000 });
await page.waitForTimeout(5000);

// Seed the real crawl dataset so every panel has content.
await page.goto(`${BASE}/app/bridge`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const seed = page.locator("text=Isi data demo").first();
if (await seed.count()) {
  await seed.click();
  console.log("[smoke] demo data seeded, waiting for propagation");
  await page.waitForTimeout(6000);
} else {
  console.log("[smoke] WARNING: seed button not found");
}

/* -------------------------------------------------------------- desktop */

console.log("\n=== DESKTOP 1440x950 ===");
for (const [name, route] of ROUTES) await visit(name, route, true, report);

// The Autopilot plan must expose a local-first AutoShorts handoff for each generated plan.
await page.goto(`${BASE}/app/autopilot`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const autoshortsHandoff = page.getByText("AutoShorts handoff", { exact: true });
if (await autoshortsHandoff.count()) {
  const manifestButton = page.getByRole("button", { name: "Copy manifest JSON" }).first();
  if (!(await manifestButton.count())) problems.push("autopilot: AutoShorts manifest copy control did not render");
} else {
  problems.push("autopilot: AutoShorts handoff did not render");
}

// Campaign detail reachable from the scanner table.
await page.goto(`${BASE}/app/scanner`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

// The scanner sort controls must remain keyboard-stable across a re-render.
const scoreHeader = page.getByRole("button", { name: "skor", exact: true }).first();
if (await scoreHeader.count()) {
  await scoreHeader.focus();
  await page.keyboard.press("Enter");
  const focused = await page.evaluate(() => (document.activeElement as HTMLElement | null)?.innerText ?? "");
  if (!focused.toLowerCase().includes("skor")) {
    problems.push("scanner: sort header lost keyboard focus after re-render");
  }
} else {
  problems.push("scanner: score sort header did not render");
}

const firstRow = page.locator('a[href^="/app/campaign/"]').first();
let detailHref: string | null = null;
if (await firstRow.count()) {
  const href = (detailHref = await firstRow.getAttribute("href"));
  const before = problems.length;
  await page.goto(`${BASE}${href}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  const text = await mainText(page);
  await page.screenshot({ path: `${OUT}/campaign-detail.png`, fullPage: true });
  report.push({
    route: href ?? "/app/campaign/*",
    chars: text.length,
    problems: problems.length - before,
    overflow: 0,
    offenders: [],
    chain: [],
    top: text.split("\n").filter(Boolean).slice(0, 18).join("\n    "),
  });
} else {
  problems.push("scanner: no campaign rows rendered");
}
print(report);

/* --------------------------------------------------------------- mobile */

// Mobile pass — catches page-level horizontal overflow and missing touch targets.
console.log("\n=== MOBILE 390x844 ===");
await page.setViewportSize({ width: 390, height: 844 });
report.length = 0;
publicReport.length = 0;
for (const [name, route] of PUBLIC) await visit(`mobile-${name}`, route, false, publicReport);
for (const [name, route] of ROUTES) await visit(`mobile-${name}`, route, false, report);
if (detailHref) await visit("mobile-campaign-detail", detailHref, false, report);
print([...publicReport, ...report]);

console.log("\n=== PROBLEMS ===");
console.log(problems.length ? problems.slice(0, 20).join("\n") : "(none)");

const allRows = [...publicReport, ...report];
const failures = allRows.filter((row) => row.problems > 0 || row.overflow > 0 || row.chars < 40);
if (failures.length > 0) {
  console.log("\n=== FAILED ROUTES ===");
  for (const row of failures) {
    console.log(
      `${row.route}: text=${row.chars} problems=${row.problems} overflow=${row.overflow}px`
    );
  }
}
await browser.close();
if (problems.length > 0 || failures.length > 0) process.exitCode = 1;
