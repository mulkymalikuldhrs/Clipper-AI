import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getViewer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    return {
      id: user._id,
      email: user.email ?? "",
      name: user.name ?? user.email ?? "Clipper",
      onboarded: user.onboarded ?? false,
    };
  },
});

export const setOnboarded = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;
    await ctx.db.patch(userId, { onboarded: true });
  },
});
