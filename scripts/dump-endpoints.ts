/* Dump full JSON bodies of selected endpoints from the crawl. */
import { readFileSync } from "node:fs";

const m = JSON.parse(readFileSync("research/konten-map.json", "utf8"));
const want = process.argv.slice(2);
for (const j of m.jsonHits ?? []) {
  try {
    const u = new URL(j.url);
    const match = want.length === 0 || want.some((w) => u.pathname.includes(w));
    if (match && j.status === 200) {
      console.log(`\n########## ${j.method} ${u.pathname}${u.search ?? ""}`);
      console.log(String(j.body).slice(0, 3500));
    }
  } catch {
    /* ignore */
  }
}
