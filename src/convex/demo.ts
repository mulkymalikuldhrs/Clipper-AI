/* Demo seed: mengisi workspace dengan data campaign NYATA dari konten.com.
 *
 * Campaign + brief_detail berasal dari crawl nyata (scripts/crawl-campaigns.ts →
 * src/convex/demoData.ts). Agar jujur: angka earnings/wallet di bawah ini adalah
 * CONTOH (bukan milikmu) supaya halaman Earnings/Analitik bisa dievaluasi tanpa
 * kredensial. Data milikmu sendiri datang lewat Bridge (scripts/bridge-sync.ts).
 */
import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { scoreCampaign } from "./lib/konten";
import { DEMO_CAMPAIGNS, DEMO_CAPTURED_AT } from "./demoData";

// Campaign yang ditandai "diikuti" agar Autopilot/Earnings punya konteks.
const JOINED_SLUGS = new Set([
  "ibu-bagaimana-aku-tanpamu-trailer-soundtrack-film-copy",
  "bevan",
]);

function num(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

const DEMO_SUMMARY = {
  totalEarned: 1250000,
  available: 850000,
  onHold: 400000,
  sedangDiproses: 0,
  thisMonth: 1250000,
  totalViews: 2140000,
  viewsBerjalan: 180000,
  withdrawn: 0,
  frozen: 0,
};

const DEMO_TIMESERIES = Array.from({ length: 30 }, (_, i) => {
  const day = new Date("2026-09-22T00:00:00Z").getTime() - (29 - i) * 86400000;
  const base = 20000 + Math.round(Math.sin(i / 3) * 9000) + i * 1200;
  return { ts: day, views: Math.max(0, base) };
});

// Contoh baris earnings (judul campaign nyata, angka contoh).
const DEMO_EARNINGS = [
  {
    extVideoId: "demo-1",
    campaignTitle: "IBU, Bagaimana aku Tanpamu Reaksi dan Testimoni Special Screening",
    platform: "tiktok",
    videoUrl: "https://www.tiktok.com/@contoh/video/1",
    views: 842000,
    amount: 842000,
    status: "diproses",
    earnedAt: Date.now() - 2 * 86400000,
  },
  {
    extVideoId: "demo-2",
    campaignTitle: "Bevan — Education Clips",
    platform: "instagram",
    videoUrl: "https://www.instagram.com/reel/contoh2",
    views: 315000,
    amount: 945000,
    status: "approved",
    earnedAt: Date.now() - 5 * 86400000,
  },
  {
    extVideoId: "demo-3",
    campaignTitle: "David Noah — Edukasi",
    platform: "youtube",
    videoUrl: "https://www.youtube.com/shorts/contoh3",
    views: 983000,
    amount: 2457500,
    status: "approved",
    earnedAt: Date.now() - 8 * 86400000,
  },
];

export const seedDemo = action({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const joinedCampaigns = DEMO_CAMPAIGNS.filter((c) => JOINED_SLUGS.has(c.slug ?? "")).map(
      (c) => ({ id: c.id })
    );

    await ctx.runMutation(internal.bridge.writeSnapshot, {
      userId,
      source: "demo",
      profile: { name: "Clipper Demo", role: "clipper" },
      campaigns: DEMO_CAMPAIGNS as unknown,
      joined: { campaigns: joinedCampaigns },
      earningsSummary: DEMO_SUMMARY,
      timeseries: { buckets: DEMO_TIMESERIES },
      wallet: { balance: 850000, available: 850000, onHold: 400000 },
      featureFlags: {
        flags: {
          tier_system_enabled: true,
          leaderboard_competition_enabled: true,
          early_earning_enabled: true,
        },
        settings: {
          min_withdrawal_idr: 50000,
          withdrawal_fee_idr: 10000,
          early_earning_rate_percent: 50,
          min_views_floor: 50000,
          hashtag_grace_hours: 168,
        },
      },
      tier: { tiers: [{ tier: 1, name: "Base Clipper" }] },
      notifications: 1,
    });

    for (const c of DEMO_CAMPAIGNS) {
      if (!c.id || !c.slug) continue;
      await ctx.runMutation(internal.bridge.upsertCampaign, {
        userId,
        extId: c.id,
        slug: c.slug,
        title: c.title ?? c.slug,
        brand: c.brand ?? "Unknown",
        category: c.category,
        platforms: c.platform ?? [],
        status: c.status,
        campaignType: c.campaign_type,
        ratePerMillion: num(c.rate_per_million),
        budget: num(c.budget),
        spent: num(c.spent),
        clippers: num(c.clippers),
        minViews: num(c.min_views),
        minDuration: num(c.min_video_duration),
        hashtags: c.hashtags ?? [],
        deadline: c.deadline ?? undefined,
        joined: JOINED_SLUGS.has(c.slug),
        score: scoreCampaign({
          ratePerMillion: c.rate_per_million,
          budget: c.budget,
          spent: c.spent,
          clippers: c.clippers,
          minViews: c.min_views,
        }),
        // brief_detail ikut disimpan supaya Brief Autopilot bisa menyusun
        // rencana langsung dari brief asli campaign.
        raw: c as unknown,
      });
    }

    await ctx.runMutation(internal.bridge.replaceEarnings, {
      userId,
      rows: DEMO_EARNINGS.map((e) => ({ ...e, amount: Math.round(e.amount) })),
    });

    await ctx.runMutation(internal.bridge.logSync, {
      userId,
      source: "demo",
      status: "ok",
      message: `Demo workspace diisi dari crawl nyata konten.com (${DEMO_CAPTURED_AT.slice(0, 10)}): ${DEMO_CAMPAIGNS.length} campaign + brief lengkap. Angka earnings adalah contoh.`,
      pages: DEMO_CAMPAIGNS.length,
    });
    return { ok: true, campaigns: DEMO_CAMPAIGNS.length };
  },
});
