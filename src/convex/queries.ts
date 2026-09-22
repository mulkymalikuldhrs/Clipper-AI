import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getSnapshot = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return (
      (await ctx.db
        .query("kontenSnapshots")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .first()) ?? null
    );
  },
});

export const listCampaigns = query({
  args: { joined: v.optional(v.boolean()) },
  handler: async (ctx, { joined }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const rows = joined
      ? await ctx.db
          .query("kontenCampaigns")
          .withIndex("by_userId_joined", (q) => q.eq("userId", userId).eq("joined", true))
          .collect()
      : await ctx.db
          .query("kontenCampaigns")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .collect();
    return rows.sort((a, b) => b.score - a.score);
  },
});

export const getCampaign = query({
  args: { id: v.id("kontenCampaigns") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const c = await ctx.db.get(id);
    if (!c || c.userId !== userId) return null;
    return c;
  },
});

export const getEarnings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return (
      await ctx.db
        .query("kontenEarnings")
        .withIndex("by_userId_earnedAt", (q) => q.eq("userId", userId))
        .order("desc")
        .take(100)
    );
  },
});

export const getSyncLogs = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const rows = await ctx.db
      .query("syncLogs")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    return rows.sort((a, b) => b.at - a.at).slice(0, 20);
  },
});

export const getPlanForCampaign = query({
  args: { campaignExtId: v.string() },
  handler: async (ctx, { campaignExtId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const plan = await ctx.db
      .query("autopilotPlans")
      .withIndex("by_userId_campaign", (q) =>
        q.eq("userId", userId).eq("campaignExtId", campaignExtId)
      )
      .first();
    if (!plan) return null;
    const tasks = await ctx.db
      .query("planTasks")
      .withIndex("by_planId", (q) => q.eq("planId", plan._id))
      .collect();
    return { plan, tasks: tasks.sort((a, b) => a.order - b.order) };
  },
});
