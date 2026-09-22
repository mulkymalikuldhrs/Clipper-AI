/* Bridge ingest: write snapshot + campaign cache + earnings rows (internal action). */
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { scoreCampaign } from "./lib/konten";

type RawCampaign = {
  id?: string;
  slug?: string;
  title?: string;
  brand?: string;
  brand_logo?: string;
  category?: string;
  platform?: string[];
  status?: string;
  campaign_type?: string;
  rate_per_million?: number | null;
  budget?: number | null;
  spent?: number | null;
  clippers?: number | null;
  min_views?: number | null;
  min_video_duration?: number | null;
  hashtags?: string[];
  deadline?: string | null;
};

type Snapshot = {
  profile?: unknown;
  campaigns?: RawCampaign[];
  joined?: { campaigns?: { id?: string }[] };
  earningsSummary?: Record<string, unknown>;
  timeseries?: { buckets?: { ts: number; views: number }[] };
  wallet?: Record<string, unknown>;
  featureFlags?: Record<string, unknown>;
  tier?: unknown;
  notifications?: number;
  closureByCampaignId?: Record<string, number>;
};

export const applySnapshot = internalAction({
  args: {
    email: v.string(),
    source: v.string(),
    snapshot: v.any(),
  },
  handler: async (ctx, { email, source, snapshot }): Promise<{ ok: boolean; userId: string; campaigns: number; source: string }> => {
    const snap = snapshot as Snapshot;
    const userId = await ctx.runMutation(internal.bridge.ensureBridgeUser, { email });

    await ctx.runMutation(internal.bridge.writeSnapshot, {
      userId,
      source,
      profile: (snap.profile ?? undefined) as unknown,
      campaigns: (snap.campaigns ?? undefined) as unknown,
      joined: (snap.joined ?? undefined) as unknown,
      earningsSummary: (snap.earningsSummary ?? undefined) as unknown,
      timeseries: (snap.timeseries ?? undefined) as unknown,
      wallet: (snap.wallet ?? undefined) as unknown,
      featureFlags: (snap.featureFlags ?? undefined) as unknown,
      tier: (snap.tier ?? undefined) as unknown,
      notifications: snap.notifications,
    });

    const joinedIds = new Set<string>(
      (snap.joined?.campaigns ?? []).map((c) => c.id ?? "").filter(Boolean)
    );
    let campaignCount = 0;
    for (const c of snap.campaigns ?? []) {
      if (!c?.id || !c?.slug) continue;
      const score = scoreCampaign({
        ratePerMillion: c.rate_per_million,
        budget: c.budget,
        spent: c.spent,
        clippers: c.clippers,
        minViews: c.min_views,
        remainingPct: snap.closureByCampaignId?.[c.id] ?? null,
      });
      await ctx.runMutation(internal.bridge.upsertCampaign, {
        userId,
        extId: c.id,
        slug: c.slug,
        title: c.title ?? c.slug,
        brand: c.brand ?? "Unknown",
        brandLogo: c.brand_logo,
        category: c.category,
        platforms: c.platform ?? [],
        status: c.status,
        campaignType: c.campaign_type,
        ratePerMillion: c.rate_per_million ?? undefined,
        budget: c.budget ?? undefined,
        spent: c.spent ?? undefined,
        clippers: c.clippers ?? undefined,
        minViews: c.min_views ?? undefined,
        minDuration: c.min_video_duration ?? undefined,
        hashtags: c.hashtags ?? [],
        deadline: c.deadline ?? undefined,
        remainingPct: snap.closureByCampaignId?.[c.id],
        joined: joinedIds.has(c.id),
        score,
        raw: c as unknown,
      });
      campaignCount++;
    }
    return { ok: true, userId: String(userId), campaigns: campaignCount, source };
  },
});
