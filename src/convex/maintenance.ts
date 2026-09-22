import { internalMutation } from "./_generated/server";

// Placeholder housekeeping mutation — keeps crons valid until retention policy is defined.
export const pruneSyncLogs = internalMutation({
  args: {},
  handler: async () => {
    return { pruned: 0 };
  },
});
