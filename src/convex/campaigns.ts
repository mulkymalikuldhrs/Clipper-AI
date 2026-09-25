import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { resolveWorkspaceUserId } from "./workspace";

// Local tracking flag: mark one of *your own mirrored* campaigns as being worked on.
// The authoritative joined state still comes from bridge sync (/api/campaigns/joined-details).
// Public discovery rows are never patched: joining happens on the marketplace itself.
export const toggleJoined = mutation({
  args: { campaignId: v.id("kontenCampaigns"), workspaceKey: v.optional(v.string()) },
  handler: async (ctx, { campaignId, workspaceKey }) => {
    const userId = await resolveWorkspaceUserId(ctx, workspaceKey);
    if (!userId) throw new Error("Workspace tidak ditemukan.");
    const c = await ctx.db.get(campaignId);
    if (!c || c.userId !== userId) {
      throw new Error("Hanya campaign hasil bridge milikmu yang bisa ditandai di sini.");
    }
    await ctx.db.patch(campaignId, { joined: !c.joined, updatedAt: Date.now() });
    return !c.joined;
  },
});
