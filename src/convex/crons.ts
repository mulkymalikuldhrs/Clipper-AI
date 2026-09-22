import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Daily housekeeping placeholder. Data refresh is push-based from scripts/bridge-sync.ts
// (scheduled on the user's machine), so no heavy cron is needed here.
crons.daily(
  "prune-sync-logs",
  { hourUTC: 18, minuteUTC: 0 },
  internal.maintenance.pruneSyncLogs
);

export default crons;
