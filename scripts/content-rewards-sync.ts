/**
 * Read-only Content Rewards Discover sync.
 *
 * This runner never uses marketplace cookies, joins campaigns, submits work, or
 * authenticates to Content Rewards. Configure a non-secret workspace identity
 * plus the same ingest endpoint/token used by the local bridge.
 *
 *   CONTENT_REWARDS_SYNC_EMAIL=you@example.com
 *   CLIPPER_AI_URL=<Convex HTTP action URL>/ingest   (legacy: SUPERCLIPPER_URL)
 *   INGEST_TOKEN=<local ingest token>
 *   bun scripts/content-rewards-sync.ts
 */
import { randomUUID } from "node:crypto";
import {
  CONTENT_REWARDS_MARKETPLACE,
  contentRewardsDetailUrl,
  contentRewardsListUrl,
  normalizeContentRewardsCampaigns,
  type ContentRewardsCampaign,
} from "../src/convex/lib/contentRewards";

const EMAIL = process.env.CONTENT_REWARDS_SYNC_EMAIL?.trim() ?? "";
const PUSH_URL = (process.env.CLIPPER_AI_URL ?? process.env.SUPERCLIPPER_URL ?? "").trim();
const TOKEN = process.env.INGEST_TOKEN?.trim() ?? "";
const MAX_PAGES = 10;
const MAX_CAMPAIGNS = 60;
const PAGE_SIZE = 6;
const DELAY_MS = 300;

if (!EMAIL || !PUSH_URL || !TOKEN) {
  console.error(
    "Set CONTENT_REWARDS_SYNC_EMAIL, CLIPPER_AI_URL, dan INGEST_TOKEN sebelum sync."
  );
  process.exit(1);
}

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};
}

function nextCursor(payload: unknown): string | undefined {
  const root = record(payload);
  const data = record(root.data);
  const pagination = record(root.pagination ?? root.meta ?? data.pagination ?? data.meta);
  const value = pagination.nextCursor ?? root.nextCursor ?? data.nextCursor;
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { accept: "application/json", "user-agent": "Clipper-AI-Content-Rewards-ReadOnly/1.0" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`GET ${new URL(url).pathname} returned HTTP ${response.status}`);
  return response.json();
}

const pause = () => new Promise<void>((resolve) => setTimeout(resolve, DELAY_MS));

async function main() {
  const discovered: Record<string, unknown>[] = [];
  const seenCursors = new Set<string>();
  let cursor: string | undefined;
  let pages = 0;

  for (; pages < MAX_PAGES && discovered.length < MAX_CAMPAIGNS; pages += 1) {
    const payload = await fetchJson(contentRewardsListUrl({ limit: PAGE_SIZE, cursor, sortBy: "newest" }));
    const batch = normalizeContentRewardsCampaigns(payload);
    for (const campaign of batch) {
      if (!discovered.some((item) => item.id === campaign.id)) discovered.push(campaign.raw.campaign as Record<string, unknown>);
    }
    console.log(`[content-rewards] list page ${pages + 1}: ${batch.length} campaign`);

    const next = nextCursor(payload);
    if (!next || seenCursors.has(next)) break;
    seenCursors.add(next);
    cursor = next;
    await pause();
  }

  const normalized: ContentRewardsCampaign[] = [];
  for (const [index, campaign] of discovered.slice(0, MAX_CAMPAIGNS).entries()) {
    const sourceId = typeof campaign.id === "string" ? campaign.id : "";
    if (!sourceId) continue;
    try {
      const detail = await fetchJson(contentRewardsDetailUrl(sourceId));
      const detailData = record(detail).data;
      normalized.push(...normalizeContentRewardsCampaigns({ data: [record(detailData).id ? detailData : campaign] }));
    } catch (error) {
      normalized.push(...normalizeContentRewardsCampaigns({ data: [campaign] }));
      console.warn(`[content-rewards] detail dilewati (${index + 1}/${discovered.length}): ${String(error).slice(0, 120)}`);
    }
    await pause();
  }

  const campaigns = normalized.slice(0, MAX_CAMPAIGNS);
  if (campaigns.length === 0) throw new Error("Content Rewards tidak mengembalikan campaign yang valid");

  const response = await fetch(PUSH_URL, {
    method: "POST",
    headers: { "content-type": "application/json", "x-sc-token": TOKEN },
    body: JSON.stringify({
      email: EMAIL.toLowerCase(),
      source: "content_rewards",
      requestId: randomUUID(),
      snapshot: {
        profile: { source: CONTENT_REWARDS_MARKETPLACE, readOnly: true },
        campaigns,
        detailFetched: campaigns.length,
        coverage: { discovery: true, detail: true, earnings: false, joined: false },
      },
    }),
    signal: AbortSignal.timeout(30_000),
  });
  const result = (await response.json()) as { error?: string; campaigns?: number };
  if (!response.ok || result.error) throw new Error(`ingest gagal (${response.status}): ${result.error ?? "unknown"}`);
  console.log(`[content-rewards] ingest ok: ${result.campaigns ?? campaigns.length} campaign, ${pages + 1} halaman`);
}

main().catch((error) => {
  console.error(`[content-rewards] fatal: ${String(error).slice(0, 240)}`);
  process.exit(1);
});
