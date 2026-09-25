/* Workspace platform layer: plan limits, usage metering, and hashed machine credentials.
 *
 * Everything here is enforced, not advertised. A limit that is not checked in a mutation is
 * not a limit, so every quota in this file is read from the plan catalog in `src/lib/plans.ts`
 * and applies to the concrete write that consumes it.
 */
import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { planFor, type Plan } from "../lib/plans";
import { isApiKeySecret, isApiKeyScope } from "../lib/apiKeys";
import { ensureWorkspaceUserId, resolveWorkspaceUserId } from "./workspace";

const WORKSPACE_ARGS = { workspaceKey: v.optional(v.string()) };

export const USAGE_KINDS = [
  "plan.created",
  "goal.created",
  "api_key.created",
  "api.request",
  "ingest.snapshot",
] as const;
export type UsageKind = (typeof USAGE_KINDS)[number];

const DAY_MS = 24 * 60 * 60 * 1000;
const HASH_PATTERN = /^[a-f0-9]{64}$/;
const LABEL_MAX = 60;
const MAX_KEYS_PER_WORKSPACE_ABSOLUTE = 100;

/* ------------------------------------------------------------------- plan */

/** The plan actually in force for a workspace. Unknown or absent plans fall back to free. */
export async function planForWorkspace(ctx: QueryCtx | MutationCtx, workspaceId: Id<"users">): Promise<Plan> {
  const row = await ctx.db
    .query("operatorWorkspaces")
    .withIndex("by_userId", (q) => q.eq("userId", workspaceId))
    .first();
  return planFor(row?.plan);
}

/* ------------------------------------------------------------------ usage */

export async function countUsage(
  ctx: QueryCtx | MutationCtx,
  workspaceId: Id<"users">,
  kind: UsageKind
): Promise<number> {
  const rows = await ctx.db
    .query("usageEvents")
    .withIndex("by_workspace_kind", (q) => q.eq("workspaceId", workspaceId).eq("kind", kind))
    .collect();
  return rows.reduce((total, row) => total + row.quantity, 0);
}

export async function countUsageSince(
  ctx: QueryCtx | MutationCtx,
  workspaceId: Id<"users">,
  kind: UsageKind,
  since: number
): Promise<number> {
  const rows = await ctx.db
    .query("usageEvents")
    .withIndex("by_workspace_kind", (q) => q.eq("workspaceId", workspaceId).eq("kind", kind))
    .collect();
  return rows.filter((row) => row.at >= since).reduce((total, row) => total + row.quantity, 0);
}

/** Record consumption at the moment it happens. Called from the mutation that consumes it. */
export async function recordUsage(
  ctx: MutationCtx,
  workspaceId: Id<"users">,
  kind: UsageKind,
  quantity = 1,
  meta?: unknown
): Promise<void> {
  await ctx.db.insert("usageEvents", {
    workspaceId,
    kind,
    quantity,
    at: Date.now(),
    meta,
  });
}

/* --------------------------------------------------------------- api keys */

export const createApiKey = mutation({
  args: {
    label: v.string(),
    prefix: v.string(),
    hash: v.string(),
    scopes: v.optional(v.array(v.string())),
    ...WORKSPACE_ARGS,
  },
  handler: async (ctx, args) => {
    // The plaintext secret is minted and hashed in the browser; the server only ever sees a hash.
    if (!HASH_PATTERN.test(args.hash)) throw new Error("Hash API key tidak valid.");
    if (!/^clai_[a-f0-9]{8}$/.test(args.prefix)) throw new Error("Prefix API key tidak valid.");
    const workspaceId = await ensureWorkspaceUserId(ctx, args.workspaceKey);
    const scopes = (args.scopes ?? ["read"]).filter(isApiKeyScope);
    if (scopes.length === 0) throw new Error("Minimal satu scope diperlukan.");
    const label = args.label.trim().slice(0, LABEL_MAX) || "Untitled key";

    const plan = await planForWorkspace(ctx, workspaceId);
    const existing = await ctx.db
      .query("workspaceApiKeys")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
      .collect();
    const active = existing.filter((key) => !key.revokedAt);
    if (active.length >= Math.min(plan.maxApiKeys, MAX_KEYS_PER_WORKSPACE_ABSOLUTE)) {
      throw new Error(
        `Plan ${plan.name} mengizinkan ${plan.maxApiKeys} API key aktif. Cabut satu key dulu.`
      );
    }
    if (existing.some((key) => key.hash === args.hash)) {
      throw new Error("API key ini sudah terdaftar.");
    }

    const id = await ctx.db.insert("workspaceApiKeys", {
      workspaceId,
      label,
      prefix: args.prefix,
      hash: args.hash,
      scopes,
      createdAt: Date.now(),
    });
    await recordUsage(ctx, workspaceId, "api_key.created");
    return { id, prefix: args.prefix, label, scopes };
  },
});

export const listApiKeys = query({
  args: WORKSPACE_ARGS,
  handler: async (ctx, { workspaceKey }) => {
    const workspaceId = await resolveWorkspaceUserId(ctx, workspaceKey);
    if (!workspaceId) return [];
    const rows = await ctx.db
      .query("workspaceApiKeys")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
      .collect();
    // Never return `hash`: it is the credential's only on-disk representation.
    return rows
      .map((row) => ({
        _id: row._id,
        label: row.label,
        prefix: row.prefix,
        scopes: row.scopes,
        createdAt: row.createdAt,
        lastUsedAt: row.lastUsedAt ?? null,
        revokedAt: row.revokedAt ?? null,
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const revokeApiKey = mutation({
  args: { keyId: v.id("workspaceApiKeys"), ...WORKSPACE_ARGS },
  handler: async (ctx, { keyId, workspaceKey }) => {
    const workspaceId = await resolveWorkspaceUserId(ctx, workspaceKey);
    if (!workspaceId) throw new Error("Workspace tidak ditemukan.");
    const row = await ctx.db.get(keyId);
    if (!row || row.workspaceId !== workspaceId) throw new Error("API key tidak ditemukan.");
    if (row.revokedAt) return { revokedAt: row.revokedAt };
    const revokedAt = Date.now();
    await ctx.db.patch(keyId, { revokedAt });
    return { revokedAt };
  },
});

/** Resolve a presented bearer hash to its workspace. Revoked keys resolve to null. */
export const resolveApiKey = internalQuery({
  args: { hash: v.string() },
  handler: async (ctx, { hash }) => {
    if (!HASH_PATTERN.test(hash)) return null;
    const row = await ctx.db
      .query("workspaceApiKeys")
      .withIndex("by_hash", (q) => q.eq("hash", hash))
      .first();
    if (!row || row.revokedAt) return null;
    return { id: row._id, workspaceId: row.workspaceId, scopes: row.scopes, label: row.label };
  },
});

export const touchApiKey = internalMutation({
  args: { keyId: v.id("workspaceApiKeys") },
  handler: async (ctx, { keyId }) => {
    const row = await ctx.db.get(keyId);
    if (!row) return;
    await ctx.db.patch(keyId, { lastUsedAt: Date.now() });
  },
});

/** Meter a completed ingest snapshot against the workspace that owns the mirrored source. */
export const recordIngestUsage = internalMutation({
  args: { workspaceId: v.id("users"), source: v.string(), campaigns: v.number() },
  handler: async (ctx, { workspaceId, source, campaigns }) => {
    await recordUsage(ctx, workspaceId, "ingest.snapshot", 1, { source, campaigns });
  },
});

/** Record one metered API request and report whether the daily quota still allows it. */
export const meterApiRequest = internalMutation({
  args: { workspaceId: v.id("users"), route: v.string() },
  handler: async (ctx, { workspaceId, route }) => {
    const plan = await planForWorkspace(ctx, workspaceId);
    const used = await countUsageSince(ctx, workspaceId, "api.request", Date.now() - DAY_MS);
    if (used >= plan.apiRequestsPerDay) {
      return { allowed: false as const, used, limit: plan.apiRequestsPerDay, plan: plan.id };
    }
    await recordUsage(ctx, workspaceId, "api.request", 1, { route });
    return { allowed: true as const, used: used + 1, limit: plan.apiRequestsPerDay, plan: plan.id };
  },
});

/* --------------------------------------------------------------- overview */

export const getPlatformOverview = query({
  args: WORKSPACE_ARGS,
  handler: async (ctx, { workspaceKey }) => {
    const workspaceId = await resolveWorkspaceUserId(ctx, workspaceKey);
    if (!workspaceId) {
      return { hasWorkspace: false as const, plan: planFor(undefined) };
    }
    const plan = await planForWorkspace(ctx, workspaceId);
    const [plans, goals, keys] = await Promise.all([
      ctx.db.query("autopilotPlans").withIndex("by_userId", (q) => q.eq("userId", workspaceId)).collect(),
      ctx.db.query("organismGoals").withIndex("by_userId", (q) => q.eq("userId", workspaceId)).collect(),
      ctx.db.query("workspaceApiKeys").withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId)).collect(),
    ]);
    const apiRequests24h = await countUsageSince(ctx, workspaceId, "api.request", Date.now() - DAY_MS);
    const activeKeys = keys.filter((key) => !key.revokedAt);
    return {
      hasWorkspace: true as const,
      plan,
      usage: {
        plans: plans.length,
        goals: goals.length,
        activeApiKeys: activeKeys.length,
        totalApiKeys: keys.length,
        apiRequests24h,
      },
    };
  },
});
