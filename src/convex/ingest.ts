/* Bridge ingest: write snapshot + campaign cache + earnings rows (internal action). */
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { scoreCampaign } from "./lib/konten";
import { MAX_CAMPAIGNS, scopeForSource, type IngestSource } from "./lib/ingest";

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
  marketplace?: string;
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
  detailFetched?: number;
  coverage?: Record<string, unknown>;
  earningsRows?: unknown[];
  closureByCampaignId?: Record<string, number>;
};

type RawEarning = {
  id?: string | number;
  video_id?: string | number;
  videoId?: string | number;
  extVideoId?: string | number;
  campaign_id?: string | number;
  campaign_title?: string;
  campaignTitle?: string;
  platform?: string;
  video_url?: string;
  videoUrl?: string;
  views?: number | string;
  amount?: number | string;
  earnings?: number | string;
  status?: string;
  earned_at?: string | number;
  earnedAt?: string | number;
  created_at?: string | number;
};

function numberOr(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function earnedAtOr(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return Date.now();
}

function normalizeEarnings(rows: unknown[] | undefined) {
  return (rows ?? []).slice(0, 500).flatMap((value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return [];
    const row = value as RawEarning;
    const amount = numberOr(row.amount ?? row.earnings);
    const views = numberOr(row.views);
    if (amount === 0 && views === 0) return [];
    return [{
      extVideoId: String(row.extVideoId ?? row.videoId ?? row.video_id ?? row.id ?? "unknown"),
      campaignTitle: row.campaignTitle ?? row.campaign_title,
      platform: row.platform,
      videoUrl: row.videoUrl ?? row.video_url,
      views,
      amount,
      status: row.status,
      earnedAt: earnedAtOr(row.earnedAt ?? row.earned_at ?? row.created_at),
    }];
  });
}

export const applySnapshot = internalAction({
  args: {
    email: v.string(),
    source: v.string(),
    snapshot: v.any(),
    requestId: v.optional(v.string()),
  },
  handler: async (ctx, { email, source, snapshot, requestId }): Promise<{ ok: boolean; userId: string; campaigns: number; source: string; scope: string; deduped?: boolean }> => {
    const snap = snapshot as Snapshot;
    const scope = scopeForSource(source as IngestSource);
    const userId = await ctx.runMutation(internal.bridge.ensureBridgeUser, { email });
    const startedAt = Date.now();
    const sync = await ctx.runMutation(internal.bridge.beginSync, {
      userId,
      source,
      requestId,
    });
    if (!sync.created) {
      return {
        ok: true,
        userId: String(userId),
        campaigns: sync.campaignCount,
        source,
        scope,
        deduped: true,
      };
    }

    try {
      await ctx.runMutation(internal.bridge.writeSnapshot, {
      userId,
      source,
      scope,
      profile: (snap.profile ?? undefined) as unknown,
      campaigns: (snap.campaigns ?? undefined) as unknown,
      joined: (snap.joined ?? undefined) as unknown,
      earningsSummary: (snap.earningsSummary ?? undefined) as unknown,
      timeseries: (snap.timeseries ?? undefined) as unknown,
      wallet: (snap.wallet ?? undefined) as unknown,
      featureFlags: (snap.featureFlags ?? undefined) as unknown,
      tier: (snap.tier ?? undefined) as unknown,
      notifications: snap.notifications,
      detailFetched: snap.detailFetched,
      coverage: snap.coverage,
    });
    const earnings = normalizeEarnings(snap.earningsRows);
    if (earnings.length > 0 || snap.earningsRows !== undefined) {
      await ctx.runMutation(internal.bridge.replaceEarnings, { userId, rows: earnings });
    }

    const joinedIds = new Set<string>(
      (snap.joined?.campaigns ?? []).map((c) => c.id ?? "").filter(Boolean)
    );
    let campaignCount = 0;
    for (const c of (snap.campaigns ?? []).slice(0, MAX_CAMPAIGNS)) {
      if (!c || typeof c !== "object" || !c.id || !c.slug) continue;
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
        joined: source === "content_rewards" ? false : joinedIds.has(c.id),
        marketplace: c.marketplace ?? (source === "content_rewards" ? "content-rewards" : "konten"),
        scope,
        score,
        raw: c as unknown,
      });
      campaignCount++;
    }
      await ctx.runMutation(internal.bridge.finishSync, {
        logId: sync.logId,
        campaignCount,
        durationMs: Date.now() - startedAt,
        message: `Snapshot diterima: ${campaignCount} campaign.`,
      });
      return { ok: true, userId: String(userId), campaigns: campaignCount, source, scope };
    } catch (error) {
      await ctx.runMutation(internal.bridge.failSync, {
        logId: sync.logId,
        durationMs: Date.now() - startedAt,
        errorCode: "snapshot_apply_failed",
        message: String(error).slice(0, 240),
      });
      throw error;
    }
  },
});
