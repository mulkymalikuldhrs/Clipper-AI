import { internalMutation } from "./_generated/server";

// Keep operation history useful without allowing an always-on bridge to grow
// the database forever. The 30-day window matches the UI's diagnostic scope.
export const pruneSyncLogs = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const old = await ctx.db
      .query("syncLogs")
      .filter((q) => q.lt(q.field("at"), cutoff))
      .take(1000);
    for (const log of old) await ctx.db.delete(log._id);
    return { pruned: old.length };
  },
});
