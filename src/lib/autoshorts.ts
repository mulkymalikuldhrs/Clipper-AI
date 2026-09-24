/**
 * AutoShorts-compatible production handoff.
 *
 * This is a clean-room adapter for the Super Clipper web console. It does not
 * copy AutoShorts source code or invoke a renderer. It produces a small JSON
 * manifest that a local AutoShorts/Tauri installation can consume later.
 */

export type ClipCandidate = {
  id: string;
  label: string;
  startSec: number;
  endSec: number;
  durationSec: number;
  aspectRatio: "9:16";
  hook: string;
  source: string;
  complianceNote: string;
  status: "spec";
};

export type AutoShortsManifest = {
  schema: "super-clipper/autoshorts-manifest";
  version: 1;
  project: string;
  campaignSlug: string;
  aspectRatio: "9:16";
  localFirst: true;
  externalModelUsed: false;
  sourceAssets: { title: string; url: string }[];
  candidates: ClipCandidate[];
  notes: string[];
};

type PlanInput = {
  title: string;
  brand: string;
  campaignSlug: string;
  hook: string;
  durasiMin: number;
  durasiMax: number;
  materi: { title: string; url: string }[];
 narasi?: string;
  cta?: string;
  platforms?: string[];
  durationLimitReached?: boolean;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

/** Build bounded candidate windows; actual media analysis remains a local renderer concern. */
export function buildAutoShortsManifest(plan: PlanInput): AutoShortsManifest {
  const max = Math.max(plan.durasiMin, plan.durasiMax, 3);
  const shortWindow = clamp(Math.min(max, 30), 3, max);
  const coreStart = clamp(max * 0.2, 0, Math.max(0, max - 3));
  const ctaStart = clamp(max * 0.78, 0, Math.max(0, max - 3));
  const source = plan.materi[0]?.title ?? "Campaign source material";
  const sourceUrl = plan.materi[0]?.url ?? "";
  const durationLimitReached = plan.durationLimitReached ?? max > 180;

  const candidates: ClipCandidate[] = [
    {
      id: "hook-01",
      label: "Hook / opening promise",
      startSec: 0,
      endSec: shortWindow,
      durationSec: shortWindow,
      aspectRatio: "9:16",
      hook: plan.hook,
      source,
      complianceNote: "Open on the strongest brief-approved moment; do not add an unapproved intro.",
      status: "spec",
    },
    {
      id: "core-01",
      label: "Core proof / narrative",
      startSec: coreStart,
      endSec: Math.min(max, coreStart + shortWindow),
      durationSec: Math.min(shortWindow, max - coreStart),
      aspectRatio: "9:16",
      hook: plan.narasi?.split("\n").find((line) => line.trim().length > 3)?.trim() ?? plan.hook,
      source,
      complianceNote: "Keep the mandatory narrative points and only footage allowed by the campaign brief.",
      status: "spec",
    },
    {
      id: "cta-01",
      label: "Close / CTA",
      startSec: ctaStart,
      endSec: max,
      durationSec: Math.max(3, max - ctaStart),
      aspectRatio: "9:16",
      hook: plan.cta ?? "Use the campaign-approved closing CTA.",
      source,
      complianceNote: "Include the official CTA and end card; do not auto-submit or publish from this manifest.",
      status: "spec",
    },
  ];

  return {
    schema: "super-clipper/autoshorts-manifest",
    version: 1,
    project: `${plan.brand} — ${plan.title}`.trim(),
    campaignSlug: plan.campaignSlug,
    aspectRatio: "9:16",
    localFirst: true,
    externalModelUsed: false,
    sourceAssets: plan.materi,
    candidates,
    notes: [
      `Target platforms from brief: ${(plan.platforms ?? []).join(", ") || "not specified"}.`,
      "Candidate windows are planning specifications, not rendered clips.",
      "Validate transcript, captions, music rights, and brand rules inside the local renderer.",
      ...(sourceUrl ? [] : ["No source asset URL is present; attach approved campaign media before rendering."]),
      ...(durationLimitReached ? ["The requested duration is long; review whether multiple clips are more compliant."] : []),
    ],
  };
}
