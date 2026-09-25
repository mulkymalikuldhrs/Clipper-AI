/* Read models for the workspace HTTP API.
 *
 * These exist so the machine API and the console read the same data through the same
 * rules. Payloads are deliberately narrowed: `raw` marketplace dumps stay out of the API.
 */
import { v } from "convex/values";
import { internalQuery } from "./_generated/server";
import { countUsageSince, planForWorkspace } from "./platform";
import { mergeCampaigns, publicCampaigns } from "./queries";

const DAY_MS = 24 * 60 * 60 * 1000;

type CampaignRow = Awaited<ReturnType<typeof publicCampaigns>>[number];

function serializeCampaign(row: CampaignRow) {
  return {
    id: row._id,
    extId: row.extId,
    slug: row.slug,
    title: row.title,
    brand: row.brand,
    category: row.category ?? null,
    marketplace: row.marketplace ?? null,
    scope: row.scope ?? "private",
    platforms: row.platforms,
    status: row.status ?? null,
    score: row.score,
    joined: row.joined,
    ratePerMillion: row.ratePerMillion ?? null,
    budget: row.budget ?? null,
    spent: row.spent ?? null,
    remainingPct: row.remainingPct ?? null,
    minViews: row.minViews ?? null,
    minDuration: row.minDuration ?? null,
    hashtags: row.hashtags,
    deadline: row.deadline ?? null,
    updatedAt: row.updatedAt,
  };
}

export const workspaceContext = internalQuery({
  args: { workspaceId: v.id("users") },
  handler: async (ctx, { workspaceId }) => {
    const plan = await planForWorkspace(ctx, workspaceId);
    const [plans, goals, campaigns, apiRequests24h] = await Promise.all([
      ctx.db.query("autopilotPlans").withIndex("by_userId", (q) => q.eq("userId", workspaceId)).collect(),
      ctx.db.query("organismGoals").withIndex("by_userId", (q) => q.eq("userId", workspaceId)).collect(),
      mergeCampaigns(
        await ctx.db.query("kontenCampaigns").withIndex("by_userId", (q) => q.eq("userId", workspaceId)).collect(),
        await publicCampaigns(ctx)
      ),
      countUsageSince(ctx, workspaceId, "api.request", Date.now() - DAY_MS),
    ]);
    const snapshot = (
      await ctx.db.query("kontenSnapshots").withIndex("by_userId", (q) => q.eq("userId", workspaceId)).collect()
    ).sort((a, b) => b.fetchedAt - a.fetchedAt)[0];
    return {
      plan: plan.id,
      limits: {
        maxPlans: plan.maxPlans,
        maxGoals: plan.maxGoals,
        maxApiKeys: plan.maxApiKeys,
        apiRequestsPerDay: plan.apiRequestsPerDay,
      },
      usage: {
        plans: plans.length,
        goals: goals.length,
        campaigns: campaigns.length,
        apiRequests24h,
      },
      source: snapshot?.source ?? null,
      sourceFetchedAt: snapshot?.fetchedAt ?? null,
    };
  },
});

export const listCampaigns = internalQuery({
  args: { workspaceId: v.id("users"), limit: v.number() },
  handler: async (ctx, { workspaceId, limit }) => {
    const own = await ctx.db
      .query("kontenCampaigns")
      .withIndex("by_userId", (q) => q.eq("userId", workspaceId))
      .collect();
    return mergeCampaigns(own, await publicCampaigns(ctx))
      .slice(0, limit)
      .map(serializeCampaign);
  },
});

export const listProductionPlans = internalQuery({
  args: { workspaceId: v.id("users"), limit: v.number() },
  handler: async (ctx, { workspaceId, limit }) => {
    const rows = await ctx.db
      .query("autopilotPlans")
      .withIndex("by_userId", (q) => q.eq("userId", workspaceId))
      .collect();
    return rows
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, limit)
      .map((plan) => ({
        id: plan._id,
        campaignExtId: plan.campaignExtId,
        campaignSlug: plan.campaignSlug,
        title: plan.title,
        brand: plan.brand,
        status: plan.status,
        complianceScore: plan.complianceScore,
        durasiMin: plan.durasiMin,
        durasiMax: plan.durasiMax,
        hashtags: plan.hashtags,
        cta: plan.cta,
        caption: plan.caption,
        shotlist: plan.shotlist,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
      }));
  },
});
