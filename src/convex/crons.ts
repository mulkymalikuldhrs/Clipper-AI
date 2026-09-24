import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// The kernel only selects a safe goal for review; it never executes external tools.
crons.daily(
  "plan-organism-goal",
  { hourUTC: 18, minuteUTC: 15 },
  internal.maintenance.planNextOrganismGoal
);

crons.daily(
  "prune-sync-logs",
  { hourUTC: 18, minuteUTC: 0 },
  internal.maintenance.pruneSyncLogs
);

export default crons;
