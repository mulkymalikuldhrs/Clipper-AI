import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Local tracking flag: mark a campaign as followed/joined from the app.
// The authoritative joined state still comes from bridge sync (/api/campaigns/joined-details).
export const toggleJoined = mutation({
  args: { campaignId: v.id("kontenCampaigns") },
  handler: async (ctx, { campaignId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const c = await ctx.db.get(campaignId);
    if (!c || c.userId !== userId) throw new Error("Campaign tidak ditemukan");
    await ctx.db.patch(campaignId, { joined: !c.joined, updatedAt: Date.now() });
    return !c.joined;
  },
});
