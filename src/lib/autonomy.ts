import { buildAutoShortsManifest, type AutoShortsManifest } from "./autoshorts";

export type AutonomyCampaign = {
  extId: string;
  title: string;
  brand: string;
  status?: string;
  platforms: string[];
  joined: boolean;
  score: number;
  raw?: unknown;
};

export type AutonomyPlan = {
  campaignExtId: string;
  title: string;
  brand: string;
  campaignSlug: string;
  hook: string;
  narasi: string;
  cta: string;
  caption: string;
  hashtags: string[];
  durasiMin: number;
  durasiMax: number;
  materi: { title: string; url: string }[];
  platforms?: string[];
  complianceScore: number;
  status: string;
};

export type AutonomyEarning = {
  campaignTitle?: string;
  platform?: string;
  views: number;
  amount: number;
  status?: string;
};

export type AutonomyReview = {
  campaignExtId: string;
  lifecycle: "observe" | "planned" | "ready_for_review" | "earning" | "needs_attention";
  decision: "collect_data" | "finish_plan" | "prepare_post" | "measure_results" | "do_nothing";
  reason: string;
  complianceScore: number;
  dataReadiness: number;
  economicSignal: { earnings: number; views: number; rows: number };
  publishHandoff: {
    status: "review_required" | "blocked";
    platforms: string[];
    caption: string;
    manifest: AutoShortsManifest | null;
    note: string;
  };
};

function money(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function readiness(campaign: AutonomyCampaign, plan: AutonomyPlan | undefined): number {
  const raw = campaign.raw as { brief_detail?: unknown } | undefined;
  const hasBrief = Boolean(raw?.brief_detail && typeof raw.brief_detail === "object");
  let score = 20;
  if (campaign.status === "active") score += 10;
  if (campaign.platforms.length > 0) score += 10;
  if (hasBrief) score += 20;
  if (plan) score += 25;
  if (plan?.materi.length) score += 15;
  return Math.min(100, score);
}

/** Derive a reviewable operating decision from known workspace signals. */
export function buildAutonomyReview(
  campaign: AutonomyCampaign,
  plan: AutonomyPlan | undefined,
  earnings: AutonomyEarning[]
): AutonomyReview {
  const campaignEarnings = earnings.filter((row) => {
    if (!row.campaignTitle) return false;
    return row.campaignTitle === campaign.title || row.campaignTitle === campaign.brand;
  });
  const earned = campaignEarnings.reduce((sum, row) => sum + money(row.amount), 0);
  const views = campaignEarnings.reduce((sum, row) => sum + Math.max(0, row.views), 0);
  const dataReadiness = readiness(campaign, plan);
  const manifest = plan
    ? buildAutoShortsManifest({
        title: plan.title,
        brand: plan.brand,
        campaignSlug: plan.campaignSlug,
        hook: plan.hook,
        durasiMin: plan.durasiMin,
        durasiMax: plan.durasiMax,
        materi: plan.materi,
        narasi: plan.narasi,
        cta: plan.cta,
        platforms: plan.platforms ?? campaign.platforms,
      })
    : null;
  const hasPublishablePlan = Boolean(plan && plan.complianceScore >= 70 && plan.materi.length > 0);
  const lifecycle: AutonomyReview["lifecycle"] = earned > 0
    ? "earning"
    : hasPublishablePlan
      ? plan?.status === "done" ? "ready_for_review" : "planned"
      : "needs_attention";
  const decision: AutonomyReview["decision"] = earned > 0
    ? "measure_results"
    : !plan
      ? "collect_data"
      : !hasPublishablePlan
        ? "finish_plan"
        : plan?.status === "done"
          ? "prepare_post"
          : "do_nothing";
  const reason = earned > 0
    ? "Earnings teramati; ukur hasil sebelum experimenting."
    : !plan
      ? "Campaign belum memiliki plan spesifik dari brief."
      : !hasPublishablePlan
        ? "Plan belum cukup lengkap atau compliant untuk handoff."
        : plan?.status === "done"
          ? "Plan selesai; buat handoff review, jangan publish otomatis."
          : "Plan aman tersedia; tunggu status produksi dan review operator.";
  return {
    campaignExtId: campaign.extId,
    lifecycle,
    decision,
    reason,
    complianceScore: plan?.complianceScore ?? 0,
    dataReadiness,
    economicSignal: { earnings: earned, views, rows: campaignEarnings.length },
    publishHandoff: {
      status: hasPublishablePlan ? "review_required" : "blocked",
      platforms: plan?.platforms ?? campaign.platforms,
      caption: plan?.caption ?? "Brief belum menghasilkan caption.",
      manifest,
      note: hasPublishablePlan
        ? "Review operator wajib sebelum platform API resmi digunakan; menyetujui media, caption, dan hak konten."
        : "Tidak ada publish handoff sebelum plan, materi, dan compliance lengkap.",
    },
  };
}
