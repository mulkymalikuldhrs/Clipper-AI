/**
 * Plan catalog and hard resource ceilings.
 *
 * A plan is enforced in code, never in copy: mutations resolve the workspace's plan and
 * refuse work beyond its limits. There is no billing integration, so a workspace stays on
 * its assigned plan until an operator changes it — the console must not offer an upgrade
 * button that cannot charge anyone.
 */

export type PlanId = "free" | "studio" | "agency";
export const PLAN_IDS = ["free", "studio", "agency"] as const;
export const DEFAULT_PLAN: PlanId = "free";

export type Plan = {
  id: PlanId;
  name: string;
  summary: string;
  maxPlans: number;
  maxGoals: number;
  maxApiKeys: number;
  apiRequestsPerDay: number;
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    summary: "Satu operator, discovery publik, dan API baca terbatas.",
    maxPlans: 25,
    maxGoals: 15,
    maxApiKeys: 2,
    apiRequestsPerDay: 200,
  },
  studio: {
    id: "studio",
    name: "Studio",
    summary: "Untuk tim kecil yang menjalankan beberapa campaign sekaligus.",
    maxPlans: 200,
    maxGoals: 120,
    maxApiKeys: 10,
    apiRequestsPerDay: 5_000,
  },
  agency: {
    id: "agency",
    name: "Agency",
    summary: "Volume tinggi dengan kuota API harian besar.",
    maxPlans: 1_000,
    maxGoals: 500,
    maxApiKeys: 40,
    apiRequestsPerDay: 50_000,
  },
};

/** Absolute ceilings no plan may exceed, so limits stay bounded even if a plan is edited. */
export const HARD_LIMITS = {
  maxPlans: 5_000,
  maxGoals: 2_000,
  maxApiKeys: 100,
  apiRequestsPerDay: 1_000_000,
} as const;

export function isPlanId(value: unknown): value is PlanId {
  return typeof value === "string" && (PLAN_IDS as readonly string[]).includes(value);
}

export function planFor(id: string | undefined | null): Plan {
  return isPlanId(id) ? PLANS[id] : PLANS[DEFAULT_PLAN];
}
