/* Analyze the crawler output: API endpoints + page structure summary. */
import { readFileSync } from "node:fs";

const m = JSON.parse(readFileSync("research/konten-map.json", "utf8"));
console.log("LOGIN:", m.loginStatus);
console.log("localStorage keys:", (m.localStorageKeys ?? []).join(", "));

console.log("\n=== JSON API ENDPOINTS (unique paths) ===");
const seen = new Map();
for (const j of m.jsonHits ?? []) {
  try {
    const u = new URL(j.url);
    const key = `${j.method} ${u.pathname}`;
    if (!seen.has(key)) {
      seen.set(key, { status: j.status, sample: String(j.body).slice(0, 220) });
      console.log(`\n${j.method} ${j.status} ${u.pathname}${u.search ? "?" + u.search.slice(0, 100) : ""}`);
      console.log(`   ${seen.get(key).sample}`);
    }
  } catch {
    /* ignore */
  }
}

console.log("\n=== PAGES ===");
for (const p of m.pages ?? []) {
  console.log(`\n-- ${p.path} (final: ${p.finalUrl}) json:${p.jsonHits}${p.error ? " ERROR:" + p.error : ""}`);
  if (p.headings?.length) console.log("   H:", p.headings.slice(0, 8).join(" | "));
  if (p.buttons?.length) console.log("   BTN:", p.buttons.slice(0, 12).join(" | "));
}
