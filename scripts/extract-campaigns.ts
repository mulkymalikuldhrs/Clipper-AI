/* Extract key fields from each campaign detail response. */
import { readFileSync } from "node:fs";

const m = JSON.parse(readFileSync("research/konten-map.json", "utf8"));
const seen = new Set<string>();
for (const j of m.jsonHits ?? []) {
  try {
    const u = new URL(j.url);
    if (!/^\/api\/campaigns\/[a-z0-9-]+$/.test(u.pathname) || j.status !== 200) continue;
    const body = JSON.parse(j.body);
    const c = body?.campaign;
    if (!c || seen.has(c.slug)) continue;
    seen.add(c.slug);
    const bd = c.brief_detail ?? {};
    console.log(
      JSON.stringify(
        {
          id: c.id,
          slug: c.slug,
          title: c.title,
          brand: c.brand,
          category: c.category,
          platform: c.platform,
          campaign_type: c.campaign_type,
          rate_per_million: c.rate_per_million,
          budget: c.budget,
          spent: c.spent,
          clippers: c.clippers,
          min_views: c.min_views,
          min_video_duration: c.min_video_duration,
          hashtags: c.hashtags,
          deadline: c.deadline,
          cta: (bd.cta ?? "").slice(0, 120),
          materiCount: (bd.materi ?? []).length,
          narasiLen: (bd.narasi ?? "").length,
          durasiMin: bd.durasiMin ?? null,
          durasiMax: bd.durasiMax ?? null,
        },
        null,
        1
      )
    );
  } catch {
    /* ignore */
  }
}
