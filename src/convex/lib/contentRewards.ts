/* Pure, read-only normalizer for Content Rewards Discover campaign data. */

export const CONTENT_REWARDS_MARKETPLACE = "content-rewards" as const;
const CONTENT_REWARDS_BASE = "https://contentrewards.com";

type UnknownRecord = Record<string, unknown>;

export type ContentRewardsCampaign = {
  id: string;
  slug: string;
  title: string;
  brand: string;
  brand_logo?: string;
  category?: string;
  platform: string[];
  status?: string;
  campaign_type: string;
  rate_per_million?: number;
  budget?: number;
  spent?: number;
  clippers?: number;
  min_views?: number;
  min_video_duration?: number;
  hashtags: string[];
  marketplace: typeof CONTENT_REWARDS_MARKETPLACE;
  brief_detail?: {
    materi?: { title: string; url: string }[];
    narasi?: string;
    elemenWajib?: string;
    instruksiBrief?: string;
  };
  raw: UnknownRecord;
};

function record(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as UnknownRecord) : {};
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function finiteNumber(value: unknown): number | undefined {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function assetUrl(value: unknown): string | undefined {
  const raw = stringValue(value);
  if (!raw) return undefined;
  try {
    const url = new URL(raw, CONTENT_REWARDS_BASE);
    return url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function requirementText(value: unknown): string | undefined {
  const item = record(value);
  return stringValue(item.text) ?? stringValue(item.content) ?? stringValue(item.title) ?? stringValue(item.label);
}

function requirementItems(value: unknown): string[] {
  const raw = record(value).items;
  if (!Array.isArray(raw)) return [];
  return raw.map(requirementText).filter((item): item is string => Boolean(item)).slice(0, 30);
}

function materials(value: unknown): { title: string; url: string }[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const item = record(entry);
    const url = assetUrl(item.url);
    if (!url) return [];
    return [{ title: stringValue(item.title) ?? stringValue(item.name) ?? "Referensi campaign", url }];
  }).slice(0, 20);
}

/**
 * Convert one public Discover response into the existing konten-shaped cache.
 * Amounts stay in the source's USD unit: cents become dollars, and the public
 * per-thousand payout becomes dollars per million views for the shared score.
 */
export function normalizeContentRewardsCampaign(input: unknown): ContentRewardsCampaign | null {
  const c = record(input);
  const sourceId = stringValue(c.id);
  const title = stringValue(c.name);
  if (!sourceId || !title) return null;

  const metrics = record(c.metrics);
  const primaryPayoutCents = finiteNumber(c.primaryPayoutCents);
  const budgetCents = finiteNumber(c.budgetCents);
  const spentCents = finiteNumber(metrics.budgetSpentCents);
  const requirements = requirementItems(c.contentRequirements);
  const materialList = materials(c.referenceMaterials);
  const briefDetail = {
    ...(materialList.length > 0 ? { materi: materialList } : {}),
    ...(requirements.length > 0 ? { narasi: requirements.join("\n"), elemenWajib: requirements.join("\n") } : {}),
    ...(stringValue(c.description) ? { instruksiBrief: stringValue(c.description) } : {}),
  };
  const hasBrief = Object.keys(briefDetail).length > 0;

  return {
    id: `${CONTENT_REWARDS_MARKETPLACE}:${sourceId}`,
    slug: sourceId,
    title,
    brand: stringValue(c.organizationName) ?? "Content Rewards brand",
    brand_logo: assetUrl(c.organizationLogoUrl) ?? assetUrl(c.banner),
    category: stringValue(Array.isArray(c.categories) ? record(c.categories[0]).name : undefined),
    platform: Array.isArray(c.platforms) ? c.platforms.filter((p): p is string => typeof p === "string") : [],
    status: stringValue(c.status),
    campaign_type: "content-rewards",
    rate_per_million: primaryPayoutCents != null ? Math.max(0, primaryPayoutCents * 10) : undefined,
    budget: budgetCents != null ? budgetCents / 100 : undefined,
    spent: spentCents != null ? spentCents / 100 : undefined,
    clippers: finiteNumber(metrics.creatorCount),
    min_views: finiteNumber(c.minimumViews),
    min_video_duration: finiteNumber(c.minimumDurationSeconds),
    hashtags: [],
    marketplace: CONTENT_REWARDS_MARKETPLACE,
    ...(hasBrief ? { brief_detail: briefDetail } : {}),
    raw: { marketplace: CONTENT_REWARDS_MARKETPLACE, source: CONTENT_REWARDS_MARKETPLACE, campaign: c },
  };
}

export function normalizeContentRewardsCampaigns(input: unknown): ContentRewardsCampaign[] {
  const data = record(input).data;
  const list = Array.isArray(data) ? data : Array.isArray(input) ? input : [];
  return list.map(normalizeContentRewardsCampaign).filter((c): c is ContentRewardsCampaign => c !== null).slice(0, 500);
}

export function contentRewardsDetailUrl(id: string): string {
  return `${CONTENT_REWARDS_BASE}/api/campaign/campaigns/discover/${encodeURIComponent(id)}`;
}

export function contentRewardsListUrl(options: { limit?: number; cursor?: string; sortBy?: string } = {}): string {
  const params = new URLSearchParams({
    limit: String(Math.min(50, Math.max(1, options.limit ?? 6))),
    sortBy: options.sortBy ?? "newest",
  });
  if (options.cursor) params.set("cursor", options.cursor);
  return `${CONTENT_REWARDS_BASE}/api/campaign/campaigns/discover?${params.toString()}`;
}
