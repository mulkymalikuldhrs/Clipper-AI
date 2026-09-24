import { internalMutation } from "./_generated/server";
import { chooseNextGoal, scoreGoal, type GoalCandidate } from "./lib/organism";

export const planNextOrganismGoal = internalMutation({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query("organismProfiles").take(20);
    let selectedCount = 0;
    for (const profile of profiles) {
      if (profile.mode !== "observe" || profile.actionsUsed >= profile.dailyActionBudget) continue;
      const goals = await ctx.db
        .query("organismGoals")
        .withIndex("by_userId", (q) => q.eq("userId", profile.userId))
        .collect();
      const choice = chooseNextGoal(goals as unknown as GoalCandidate[]);
      if (!choice) {
        await ctx.db.insert("organismEvents", {
          userId: profile.userId,
          type: "do_nothing",
          message: "Tidak ada goal kandidat yang aman dan layak.",
          at: Date.now(),
        });
        continue;
      }
      const selected = goals.find((goal) => goal._id === choice._id);
      if (!selected) continue;
      const now = Date.now();
      await ctx.db.patch(selected._id, { status: "selected", updatedAt: now });
      await ctx.db.patch(profile._id, {
        actionsUsed: profile.actionsUsed + 1,
        lastEvaluatedAt: now,
        updatedAt: now,
      });
      await ctx.db.insert("organismEvents", {
        userId: profile.userId,
        type: "goal_selected",
        message: `Goal dipilih untuk review: ${choice.title}.`,
        metadata: { goalId: selected._id, score: scoreGoal(selected) },
        at: now,
      });
      selectedCount++;
    }
    return { selected: selectedCount };
  },
});

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
