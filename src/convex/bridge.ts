/* Internal mutations used by ingest + demo seed. */
import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const ensureBridgeUser = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();
    if (existing) return existing._id;
    return ctx.db.insert("users", { email, name: email.split("@")[0], onboarded: false });
  },
});

export const beginSync = internalMutation({
  args: {
    userId: v.id("users"),
    source: v.string(),
    requestId: v.optional(v.string()),
  },
  handler: async (ctx, { userId, source, requestId }) => {
    if (requestId) {
      const existing = await ctx.db
        .query("syncLogs")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("requestId"), requestId))
        .first();
      if (existing) {
        if (existing.status === "error") {
          await ctx.db.patch(existing._id, {
            status: "pending",
            message: undefined,
            errorCode: undefined,
            at: Date.now(),
          });
          return { created: true as const, logId: existing._id, campaignCount: 0, status: "pending" };
        }
        return {
          created: false as const,
          logId: existing._id,
          campaignCount: existing.campaignCount ?? 0,
          status: existing.status,
        };
      }
    }
    const logId = await ctx.db.insert("syncLogs", {
      userId,
      source,
      status: "pending",
      requestId,
      at: Date.now(),
    });
    return { created: true as const, logId, campaignCount: 0, status: "pending" };
  },
});

export const finishSync = internalMutation({
  args: {
    logId: v.id("syncLogs"),
    campaignCount: v.number(),
    durationMs: v.number(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, { logId, campaignCount, durationMs, message }) => {
    const log = await ctx.db.get(logId);
    if (!log) return;
    await ctx.db.patch(logId, {
      status: "ok",
      campaignCount,
      durationMs,
      message,
      at: Date.now(),
    });
  },
});

export const failSync = internalMutation({
  args: {
    logId: v.id("syncLogs"),
    durationMs: v.number(),
    errorCode: v.string(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, { logId, durationMs, errorCode, message }) => {
    const log = await ctx.db.get(logId);
    if (!log) return;
    await ctx.db.patch(logId, {
      status: "error",
      durationMs,
      errorCode,
      message,
      at: Date.now(),
    });
  },
});

export const writeSnapshot = internalMutation({
  args: {
    userId: v.id("users"),
    source: v.string(),
    profile: v.optional(v.any()),
    campaigns: v.optional(v.any()),
    joined: v.optional(v.any()),
    earningsSummary: v.optional(v.any()),
    timeseries: v.optional(v.any()),
    wallet: v.optional(v.any()),
    featureFlags: v.optional(v.any()),
    tier: v.optional(v.any()),
    notifications: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("kontenSnapshots")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    const data = {
      userId: args.userId,
      source: args.source,
      fetchedAt: Date.now(),
      profile: args.profile,
      campaigns: args.campaigns,
      joined: args.joined,
      earningsSummary: args.earningsSummary,
      timeseries: args.timeseries,
      wallet: args.wallet,
      featureFlags: args.featureFlags,
      tier: args.tier,
      notifications: args.notifications,
    };
    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    }
    return ctx.db.insert("kontenSnapshots", data);
  },
});

export const upsertCampaign = internalMutation({
  args: {
    userId: v.id("users"),
    extId: v.string(),
    slug: v.string(),
    title: v.string(),
    brand: v.string(),
    brandLogo: v.optional(v.string()),
    category: v.optional(v.string()),
    platforms: v.array(v.string()),
    status: v.optional(v.string()),
    campaignType: v.optional(v.string()),
    ratePerMillion: v.optional(v.number()),
    budget: v.optional(v.number()),
    spent: v.optional(v.number()),
    clippers: v.optional(v.number()),
    minViews: v.optional(v.number()),
    minDuration: v.optional(v.number()),
    hashtags: v.array(v.string()),
    deadline: v.optional(v.string()),
    remainingPct: v.optional(v.number()),
    joined: v.boolean(),
    score: v.number(),
    raw: v.optional(v.any()),
  },
  handler: async (ctx, c) => {
    const existing = await ctx.db
      .query("kontenCampaigns")
      .withIndex("by_userId_extId", (q) => q.eq("userId", c.userId).eq("extId", c.extId))
      .first();
    const data = { ...c, updatedAt: Date.now() };
    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    }
    return ctx.db.insert("kontenCampaigns", data);
  },
});

export const replaceEarnings = internalMutation({
  args: {
    userId: v.id("users"),
    rows: v.array(
      v.object({
        extVideoId: v.optional(v.string()),
        campaignTitle: v.optional(v.string()),
        platform: v.optional(v.string()),
        videoUrl: v.optional(v.string()),
        views: v.number(),
        amount: v.number(),
        status: v.optional(v.string()),
        earnedAt: v.number(),
      })
    ),
  },
  handler: async (ctx, { userId, rows }) => {
    const old = await ctx.db
      .query("kontenEarnings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    for (const row of old) await ctx.db.delete(row._id);
    for (const row of rows.slice(0, 500)) {
      await ctx.db.insert("kontenEarnings", { userId, ...row });
    }
    return rows.length;
  },
});

export const logSync = internalMutation({
  args: {
    userId: v.id("users"),
    source: v.string(),
    status: v.string(),
    message: v.optional(v.string()),
    pages: v.optional(v.number()),
  },
  handler: async (ctx, { userId, source, status, message, pages }) => {
    await ctx.db.insert("syncLogs", {
      userId,
      source,
      status,
      message,
      pages,
      at: Date.now(),
    });
  },
});
