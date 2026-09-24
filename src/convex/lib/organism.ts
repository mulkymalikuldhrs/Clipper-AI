/* Pure policy helpers for the bounded organism kernel. No model or tool calls live here. */

export type OrganismMode = "observe" | "review" | "paused";
export type GoalStatus = "candidate" | "selected" | "active" | "completed" | "rejected";
export type ExperimentStatus = "proposed" | "running" | "adopted" | "rejected";

export type GoalCandidate = {
  _id: string;
  title: string;
  status: GoalStatus;
  impact: number;
  confidence: number;
  learning: number;
  cost: number;
  risk: number;
  feasibility: number;
};

export type ExperimentCandidate = {
  score: number;
  baseline: number;
  risk: number;
  status: ExperimentStatus;
};

function clamp(value: number, min = 0, max = 1): number {
  return Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : min;
}

/** Rank a goal using explicit value, learning, feasibility, cost, and risk. */
export function scoreGoal(goal: Omit<GoalCandidate, "_id" | "status">): number {
  const value =
    clamp(goal.impact) * 0.35 +
    clamp(goal.confidence) * 0.2 +
    clamp(goal.learning) * 0.2 +
    clamp(goal.feasibility) * 0.25 -
    clamp(goal.cost) * 0.15 -
    clamp(goal.risk) * 0.2;
  return Math.round(clamp(value, 0, 1) * 100);
}

/** Select at most one candidate; doing nothing is a valid decision. */
export function chooseNextGoal(goals: GoalCandidate[]): GoalCandidate | null {
  const eligible = goals.filter(
    (goal) => goal.status === "candidate" && goal.risk <= 0.7 && goal.feasibility >= 0.35
  );
  if (eligible.length === 0) return null;
  return eligible.reduce((best, goal) => {
    const bestScore = scoreGoal(best);
    const goalScore = scoreGoal(goal);
    return goalScore > bestScore ? goal : best;
  });
}

/** Adopt only measured, low-risk improvements; otherwise keep the experiment rejected. */
export function decideExperiment(experiment: ExperimentCandidate): "adopted" | "rejected" {
  if (experiment.status !== "running" && experiment.status !== "proposed") {
    return experiment.status === "adopted" ? "adopted" : "rejected";
  }
  const improvement = clamp(experiment.score) - clamp(experiment.baseline);
  return improvement >= 0.1 && clamp(experiment.risk) <= 0.5 ? "adopted" : "rejected";
}

export function isSafeMode(mode: OrganismMode): boolean {
  return mode === "observe" || mode === "review" || mode === "paused";
}
