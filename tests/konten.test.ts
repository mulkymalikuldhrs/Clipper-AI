import { describe, expect, test } from "bun:test";
import { parseBrief, scoreCampaign } from "../src/convex/lib/konten";
import { MAX_CAMPAIGNS, validateIngestPayload } from "../src/convex/lib/ingest";
import { chooseNextGoal, decideExperiment, scoreGoal } from "../src/convex/lib/organism";
import { readNonSecretProviderConfig, validateProviderConfig } from "../src/lib/providerConfig";
import { buildAutoShortsManifest } from "../src/lib/autoshorts";
import { buildAutonomyReview } from "../src/lib/autonomy";
import { buildRolePrompt, createSwarmSession, deriveMemory, evaluateSwarmSession, proposeSkill } from "../src/lib/agentSwarm";
import { getConnector } from "../src/lib/connectors";
import {
  normalizeContentRewardsCampaign,
  normalizeContentRewardsCampaigns,
} from "../src/convex/lib/contentRewards";

describe("scoreCampaign", () => {
  test("keeps the weighted score within the expected range", () => {
    expect(
      scoreCampaign({
        ratePerMillion: 5000,
        budget: 100_000,
        spent: 0,
        clippers: 1,
        minViews: 0,
      })
    ).toBe(96);
  });

  test("uses a safe fallback when campaign metrics are missing", () => {
    expect(scoreCampaign({})).toBe(61);
  });

  test("clamps metrics and treats overspent budget as having no liquidity", () => {
    const score = scoreCampaign({
      ratePerMillion: 100_000,
      budget: 100,
      spent: 150,
      clippers: 1_000_000,
      minViews: 100_000,
    });

    expect(score).toBe(35);
  });
});

describe("validateIngestPayload", () => {
  test("normalizes a bounded bridge request", () => {
    const result = validateIngestPayload({
      email: " CLIPPER@Example.COM ",
      source: "bridge",
      requestId: "sync-2026-09-24",
      snapshot: { campaigns: [{ id: "1", slug: "one" }] },
    });

    expect(result).toEqual({
      ok: true,
      value: {
        email: "clipper@example.com",
        source: "bridge",
        requestId: "sync-2026-09-24",
        snapshot: { campaigns: [{ id: "1", slug: "one" }] },
      },
    });
  });

  test("accepts the bounded Content Rewards source and rejects unsupported sources", () => {
    expect(validateIngestPayload({ email: "a@example.com", source: "content_rewards", snapshot: { campaigns: [] } })).toEqual({
      ok: true,
      value: { email: "a@example.com", source: "content_rewards", snapshot: { campaigns: [] } },
    });
    expect(validateIngestPayload({ email: "a@example.com", source: "demo" })).toEqual({
      ok: false,
      status: 400,
      error: "unsupported ingest source",
    });
    const campaigns = Array.from({ length: MAX_CAMPAIGNS + 1 }, (_, id) => ({ id: String(id) }));
    const result = validateIngestPayload({
      email: "a@example.com",
      snapshot: { campaigns },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("at most");
  });
});

describe("bounded agent swarm", () => {
  test("keeps roles explicit and shares context without hiding uncertainty", () => {
    const session = createSwarmSession("Turn campaign brief into a safe production plan");
    session.messages.push({ id: "m1", roleId: "researcher", role: "Researcher", content: "Evidence: brief detail and campaign facts are available.", createdAt: Date.now() });
    const prompt = buildRolePrompt("reviewer", session.goal, "SHARED MEMORY: keep facts separate from assumptions");
    expect(prompt.system).toContain("Reviewer");
    expect(prompt.user).toContain(session.goal);
    expect(deriveMemory(session)[0].source).toBe("Researcher");
    expect(evaluateSwarmSession(session).verdict).toBe("ready_for_review");
  });

  test("requires human review before a proposed skill can be adopted", () => {
    const session = createSwarmSession("Review a campaign");
    session.messages.push({ id: "m1", roleId: "reviewer", role: "Reviewer", content: "A sufficiently long review output with evidence and a reusable lesson.", createdAt: Date.now() });
    expect(proposeSkill(session)?.status).toBe("review_required");
  });
});

describe("connector catalog", () => {
  test("exposes provider capabilities and secret boundaries", () => {
    expect(getConnector("apify")?.requiredEnvVars).toEqual(["APIFY_TOKEN"]);
    expect(getConnector("whop")?.capabilities).toContain("consequential");
    expect(getConnector("content_rewards")?.capabilities).not.toContain("write");
  });
});

describe("Content Rewards normalization", () => {
  const payload = {
    data: [{
      id: "campaign-1",
      name: "Launch week",
      description: "A public brief",
      organizationName: "Acme",
      banner: "/brand/banner.png",
      categories: [{ name: "Technology" }],
      platforms: ["tiktok", "instagram"],
      primaryPayoutCents: 200,
      budgetCents: 50000,
      metrics: { budgetSpentCents: 12500, creatorCount: 8 },
      referenceMaterials: [{ title: "Raw footage", url: "https://cdn.example.com/raw.mp4" }],
      contentRequirements: { items: [{ text: "Show the product in the first three seconds" }] },
    }],
  };

  test("maps public cents and preserves the Content Rewards source", () => {
    const [campaign] = normalizeContentRewardsCampaigns(payload);
    expect(campaign.id).toBe("content-rewards:campaign-1");
    expect(campaign.slug).toBe("campaign-1");
    expect(campaign.brand).toBe("Acme");
    expect(campaign.rate_per_million).toBe(2000);
    expect(campaign.budget).toBe(500);
    expect(campaign.spent).toBe(125);
    expect(campaign.clippers).toBe(8);
    expect(campaign.brand_logo).toBe("https://contentrewards.com/brand/banner.png");
    expect(campaign.brief_detail?.materi?.[0].url).toBe("https://cdn.example.com/raw.mp4");
    expect(campaign.brief_detail?.narasi).toContain("first three seconds");
  });

  test("rejects records without a stable id and title", () => {
    expect(normalizeContentRewardsCampaign({ name: "No id" })).toBeNull();
  });

  test("does not invent CTA or caption copy for discovery-only campaigns", () => {
    const campaign = normalizeContentRewardsCampaign({ id: "minimal", name: "Minimal" });
    expect(campaign?.brief_detail).toBeUndefined();
    expect(campaign?.hashtags).toEqual([]);
  });
});

describe("local provider config", () => {
  test("validates an OpenAI-compatible local endpoint", () => {
    expect(
      validateProviderConfig({ baseUrl: "http://localhost:11434/v1/", model: "qwen2.5:14b", apiKey: "" })
    ).toEqual({ ok: true, value: { baseUrl: "http://localhost:11434/v1", model: "qwen2.5:14b", apiKey: "" } });
  });

  test("rejects unsafe URLs and preserves non-secret settings on malformed storage", () => {
    expect(validateProviderConfig({ baseUrl: "ftp://example.com", model: "x", apiKey: "" }).ok).toBe(false);
    expect(validateProviderConfig({ baseUrl: "https://example.com/v1?key=secret", model: "x", apiKey: "" }).ok).toBe(false);
    expect(readNonSecretProviderConfig("not-json")).toEqual({ baseUrl: "", model: "" });
    expect(readNonSecretProviderConfig(JSON.stringify({ baseUrl: "https://example.com/v1", model: "local", apiKey: "never-read" }))).toEqual({ baseUrl: "https://example.com/v1", model: "local" });
  });
});

describe("bounded organism policy", () => {
  test("ranks goals by value, learning, feasibility, cost, and risk", () => {
    const score = scoreGoal({
      impact: 0.9,
      confidence: 0.8,
      learning: 0.7,
      cost: 0.2,
      risk: 0.1,
      feasibility: 0.9,
    });
    expect(score).toBeGreaterThan(70);
    expect(score).toBeLessThanOrEqual(100);
  });

  test("selects one safe goal and treats do nothing as valid", () => {
    const base = { impact: 0.5, confidence: 0.5, learning: 0.5, cost: 0.5, risk: 0.5, feasibility: 0.5 };
    const choice = chooseNextGoal([
      { _id: "safe", title: "safe", status: "candidate", ...base },
      { _id: "risky", title: "risky", status: "candidate", ...base, impact: 1, risk: 0.95 },
    ]);
    expect(choice?._id).toBe("safe");
    expect(chooseNextGoal([{ _id: "blocked", title: "blocked", status: "candidate", ...base, risk: 0.9 }])).toBeNull();
  });

  test("adopts only measured low-risk improvements", () => {
    expect(decideExperiment({ score: 0.8, baseline: 0.5, risk: 0.2, status: "running" })).toBe("adopted");
    expect(decideExperiment({ score: 0.55, baseline: 0.5, risk: 0.2, status: "running" })).toBe("rejected");
    expect(decideExperiment({ score: 0.9, baseline: 0.5, risk: 0.8, status: "running" })).toBe("rejected");
  });
});

describe("campaign autonomy review", () => {
  const campaign = {
    extId: "campaign-1",
    title: "Trailer",
    brand: "IBU",
    status: "active",
    platforms: ["tiktok", "instagram"],
    joined: true,
    score: 90,
    raw: { brief_detail: { cta: "Tonton" } },
  };
  const plan = {
    campaignExtId: "campaign-1",
    title: "Trailer",
    brand: "IBU",
    campaignSlug: "trailer",
    hook: "Hook",
    narasi: "Narrasi",
    cta: "Tonton",
    caption: "Caption",
    hashtags: ["ibu"],
    durasiMin: 10,
    durasiMax: 60,
    materi: [{ title: "Asset", url: "https://cdn.example/asset.mp4" }],
    platforms: ["tiktok", "instagram"],
    complianceScore: 100,
    status: "done",
  };

  test("derives a review-required social handoff, never an auto-publish action", () => {
    const review = buildAutonomyReview(campaign, plan, []);
    expect(review.lifecycle).toBe("ready_for_review");
    expect(review.decision).toBe("prepare_post");
    expect(review.publishHandoff.status).toBe("review_required");
    expect(review.publishHandoff.manifest?.candidates).toHaveLength(3);
    expect(review.publishHandoff.note.toLowerCase()).toContain("review");
  });

  test("prefers measurement when earnings exist", () => {
    const review = buildAutonomyReview(campaign, plan, [{ campaignTitle: "Trailer", views: 1000, amount: 25000 }]);
    expect(review.lifecycle).toBe("earning");
    expect(review.decision).toBe("measure_results");
    expect(review.economicSignal).toEqual({ earnings: 25000, views: 1000, rows: 1 });
  });
});

describe("AutoShorts handoff", () => {
  test("creates bounded 9:16 candidate specifications without rendering or publishing", () => {
    const manifest = buildAutoShortsManifest({
      title: "Trailer",
      brand: "IBU",
      campaignSlug: "ibu-trailer",
      hook: "Hook from brief",
      durasiMin: 10,
      durasiMax: 120,
      materi: [{ title: "Trailer utama", url: "https://cdn.example/trailer.mp4" }],
      narasi: "Tunjukkan konflik utama",
      cta: "Tonton trailer lengkapnya",
      platforms: ["tiktok", "instagram"],
    });
    expect(manifest.schema).toBe("super-clipper/autoshorts-manifest");
    expect(manifest.localFirst).toBe(true);
    expect(manifest.externalModelUsed).toBe(false);
    expect(manifest.candidates).toHaveLength(3);
    expect(manifest.candidates.every((candidate) => candidate.aspectRatio === "9:16")).toBe(true);
    expect(manifest.candidates.every((candidate) => candidate.status === "spec")).toBe(true);
  });
});

describe("parseBrief", () => {
  const brief = parseBrief({
    title: "IBU — Trailer",
    brand: "IBU",
    platform: ["tiktok", "instagram"],
    brief_detail: {
      cta: "Tonton trailer lengkapnya",
      captionWajib: "Geser untuk momen truth-nya",
      hashtags: ["ibu", "film", "trailer"],
      durasiMin: "10",
      durasiMax: "120",
      narasi: "- Tunjukkan konflik utama\n- Jangan spoiled ending",
      materi: [
        { title: "Trailer utama", url: "https://cdn.example/trailer.mp4" },
        { title: "Tanpa URL", url: "" },
      ],
      elemenWajib: "1. Hook emosional",
      bolehDilakukan: ["Gunakan footage trailer"],
      dilarangDilakukan: ["Spoil ending"],
    },
  });

  test("normalizes brief fields and preserves the campaign constraints", () => {
    expect(brief.durasiMin).toBe(10);
    expect(brief.durasiMax).toBe(120);
    expect(brief.materi).toHaveLength(1);
    expect(brief.materi[0].title).toBe("Trailer utama");
    expect(brief.narasiPoints).toEqual(["Tunjukkan konflik utama", "Jangan spoiled ending"]);
    expect(brief.elemenWajib).toEqual(["Hook emosional"]);
    expect(brief.boleh).toEqual(["Gunakan footage trailer"]);
    expect(brief.dilarang).toEqual(["Spoil ending"]);
    expect(brief.caption).toBe("Geser untuk momen truth-nya");
    expect(brief.cta).toBe("Tonton trailer lengkapnya");
  });

  test("does not fabricate CTA or caption for Content Rewards discovery briefs", () => {
    const discovery = parseBrief({
      title: "Discovery campaign",
      brand: "Acme",
      marketplace: "content-rewards",
      platform: ["tiktok"],
      brief_detail: { materi: [] },
    });
    expect(discovery.cta).toBe("");
    expect(discovery.caption).toBe("");
  });

  test("builds a complete compliance checklist for a rich brief", () => {
    expect(brief.complianceScore).toBe(100);
    expect(brief.shotlist[0].detik).toBe("0:00–0:03");
    expect(brief.shotlist.at(-1)?.detik).toContain("2:00");
    expect(brief.doDonts).toEqual(
      expect.arrayContaining([
        "BOLEH: Gunakan footage trailer",
        "DILARANG: Spoil ending",
        "Hanya platform yang diizinkan campaign: tiktok, instagram",
      ])
    );
  });
});
