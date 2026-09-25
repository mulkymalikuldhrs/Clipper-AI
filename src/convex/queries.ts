import { mutation, query, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "./_generated/dataModel";
import { decideExperiment, isSafeMode, type OrganismMode } from "./lib/organism";
import { isPublicSource } from "./lib/ingest";
import { planForWorkspace, recordUsage } from "./platform";
import { buildAutonomyReview } from "../lib/autonomy";
import { ensureWorkspaceUserId, findWorkspaceUserId, resolveWorkspaceUserId } from "./workspace";

const ORGANISM_MODES = ["observe", "review", "paused"] as const;

/** Every workspace-aware function takes the same optional capability key. */
const WORKSPACE_ARGS = { workspaceKey: v.optional(v.string()) };

type CampaignRow = Doc<"kontenCampaigns">;

function ratio(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

/** Public discovery records are the only source an anonymous console may read. */
async function latestPublicSnapshot(ctx: QueryCtx) {
  const rows = await ctx.db.query("kontenSnapshots").withIndex("by_scope", (q) => q.eq("scope", "public")).collect();
  return rows.sort((a, b) => b.fetchedAt - a.fetchedAt)[0] ?? null;
}

async function latestWorkspaceSnapshot(ctx: QueryCtx, workspaceId: Id<"users">) {
  const rows = await ctx.db
    .query("kontenSnapshots")
    .withIndex("by_userId", (q) => q.eq("userId", workspaceId))
    .collect();
  return rows.sort((a, b) => b.fetchedAt - a.fetchedAt)[0] ?? null;
}

export async function publicCampaigns(ctx: QueryCtx) {
  return await ctx.db
    .query("kontenCampaigns")
    .withIndex("by_scope", (q) => q.eq("scope", "public"))
    .collect();
}

/** Public discovery rows plus the workspace's own rows; own data wins on a collision. */
export function mergeCampaigns(
  own: CampaignRow[],
  discovery: CampaignRow[],
  filter?: (row: CampaignRow) => boolean
) {
  const merged = new Map<string, CampaignRow>();
  for (const row of discovery) {
    if (!filter || filter(row)) merged.set(`${row.marketplace ?? ""}:${row.extId}`, row);
  }
  for (const row of own) {
    if (!filter || filter(row)) merged.set(`${row.marketplace ?? ""}:${row.extId}`, row);
  }
  return [...merged.values()].sort((a, b) => b.score - a.score);
}

export const getSnapshot = query({
  args: WORKSPACE_ARGS,
  handler: async (ctx, { workspaceKey }) => {
    const workspaceId = await resolveWorkspaceUserId(ctx, workspaceKey);
    if (!workspaceId) return await latestPublicSnapshot(ctx);
    return (await latestWorkspaceSnapshot(ctx, workspaceId)) ?? (await latestPublicSnapshot(ctx));
  },
});

/** Tells the console which data it is actually looking at, so the UI never overstates it. */
export const getWorkspaceContext = query({
  args: WORKSPACE_ARGS,
  handler: async (ctx, { workspaceKey }) => {
    const authUserId = await getAuthUserId(ctx);
    const workspaceId = authUserId ?? (await findWorkspaceUserId(ctx, workspaceKey));
    const ownSnapshot = workspaceId ? await latestWorkspaceSnapshot(ctx, workspaceId) : null;
    const discovery = await latestPublicSnapshot(ctx);
    const [plans, goals] = workspaceId
      ? await Promise.all([
          ctx.db.query("autopilotPlans").withIndex("by_userId", (q) => q.eq("userId", workspaceId)).collect(),
          ctx.db.query("organismGoals").withIndex("by_userId", (q) => q.eq("userId", workspaceId)).collect(),
        ])
      : [[], []];
    const mode = authUserId ? ("account" as const) : workspaceId ? ("workspace" as const) : ("public" as const);
    const source = ownSnapshot?.source ?? discovery?.source ?? null;
    return {
      mode,
      ownsWorkspace: Boolean(workspaceId),
      // own-session means a local bridge mirrored it; public-discovery means a public JSON source.
      dataMode: ownSnapshot
        ? ("own-session" as const)
        : discovery
          ? ("public-discovery" as const)
          : ("empty" as const),
      source,
      isPublicSource: source ? isPublicSource(source) : null,
      fetchedAt: ownSnapshot?.fetchedAt ?? discovery?.fetchedAt ?? null,
      plans: plans.length,
      goals: goals.length,
    };
  },
});

export const listCampaigns = query({
  args: { joined: v.optional(v.boolean()), ...WORKSPACE_ARGS },
  handler: async (ctx, { joined, workspaceKey }) => {
    const workspaceId = await resolveWorkspaceUserId(ctx, workspaceKey);
    const own = workspaceId
      ? joined
        ? await ctx.db
            .query("kontenCampaigns")
            .withIndex("by_userId_joined", (q) => q.eq("userId", workspaceId).eq("joined", true))
            .collect()
        : await ctx.db
            .query("kontenCampaigns")
            .withIndex("by_userId", (q) => q.eq("userId", workspaceId))
            .collect()
      : [];

    if (joined) {
      // Production queue: campaigns this workspace marked, plus discovery campaigns it planned.
      const plans = workspaceId
        ? await ctx.db
            .query("autopilotPlans")
            .withIndex("by_userId", (q) => q.eq("userId", workspaceId))
            .collect()
        : [];
      const planned = new Set(plans.map((plan) => plan.campaignExtId));
      return mergeCampaigns(
        own,
        await publicCampaigns(ctx),
        (row) => row.joined || planned.has(row.extId)
      );
    }

    return mergeCampaigns(own, await publicCampaigns(ctx));
  },
});

export const getCampaign = query({
  args: { id: v.id("kontenCampaigns"), ...WORKSPACE_ARGS },
  handler: async (ctx, { id, workspaceKey }) => {
    const c = await ctx.db.get(id);
    if (!c) return null;
    if (c.scope === "public") return c;
    const workspaceId = await resolveWorkspaceUserId(ctx, workspaceKey);
    if (!workspaceId || c.userId !== workspaceId) return null;
    return c;
  },
});

export const getEarnings = query({
  args: WORKSPACE_ARGS,
  handler: async (ctx, { workspaceKey }) => {
    const workspaceId = await resolveWorkspaceUserId(ctx, workspaceKey);
    if (!workspaceId) return [];
    return (
      await ctx.db
        .query("kontenEarnings")
        .withIndex("by_userId_earnedAt", (q) => q.eq("userId", workspaceId))
        .order("desc")
        .take(100)
    );
  },
});

export const getSyncLogs = query({
  args: WORKSPACE_ARGS,
  handler: async (ctx, { workspaceKey }) => {
    const authUserId = await getAuthUserId(ctx);
    const workspaceId = authUserId ?? (await findWorkspaceUserId(ctx, workspaceKey));
    if (workspaceId) {
      const own = await ctx.db
        .query("syncLogs")
        .withIndex("by_userId", (q) => q.eq("userId", workspaceId))
        .collect();
      if (authUserId || own.length > 0) {
        return own.sort((a, b) => b.at - a.at).slice(0, 20);
      }
    }
    // Fall back to public discovery activity only — own-session logs are never exposed here.
    const snapshot = await latestPublicSnapshot(ctx);
    if (!snapshot) return [];
    const rows = await ctx.db
      .query("syncLogs")
      .withIndex("by_userId", (q) => q.eq("userId", snapshot.userId))
      .collect();
    return rows
      .filter((row) => isPublicSource(row.source))
      .sort((a, b) => b.at - a.at)
      .slice(0, 20);
  },
});

export const getOrganism = query({
  args: WORKSPACE_ARGS,
  handler: async (ctx, { workspaceKey }) => {
    const userId = await resolveWorkspaceUserId(ctx, workspaceKey);
    if (!userId) return null;
    const profile = await ctx.db
      .query("organismProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile) return null;
    const [goals, capabilities, experiments, memories, events] = await Promise.all([
      ctx.db.query("organismGoals").withIndex("by_userId", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("organismCapabilities").withIndex("by_userId", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("organismExperiments").withIndex("by_userId", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("organismMemories").withIndex("by_userId", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("organismEvents").withIndex("by_userId", (q) => q.eq("userId", userId)).collect(),
    ]);
    return {
      profile,
      goals: goals.sort((a, b) => b.updatedAt - a.updatedAt),
      capabilities: capabilities.sort((a, b) => a.name.localeCompare(b.name)),
      experiments: experiments.sort((a, b) => b.updatedAt - a.updatedAt),
      memories: memories.sort((a, b) => b.createdAt - a.createdAt).slice(0, 20),
      events: events.sort((a, b) => b.at - a.at).slice(0, 20),
    };
  },
});

export const initializeOrganism = mutation({
  args: WORKSPACE_ARGS,
  handler: async (ctx, { workspaceKey }) => {
    const userId = await ensureWorkspaceUserId(ctx, workspaceKey);
    const existing = await ctx.db
      .query("organismProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (existing) return existing._id;

    const now = Date.now();
    const profileId = await ctx.db.insert("organismProfiles", {
      userId,
      name: "Clipper AI Organism",
      mode: "observe",
      constitution: [
        "Maximize useful autonomy only inside explicit owner and safety boundaries.",
        "Treat repository and runtime reality as more authoritative than stale documentation.",
        "Protect owner data, credentials, financial resources, and marketplace submission.",
        "Distinguish known, unknown, assumption, unverified, contradicted, and stale state.",
        "Prefer reuse, evidence, reversibility, and bounded experimentation over new components.",
        "Do nothing when no safe, feasible, evidence-backed action exists.",
        "Never let autonomy bypass resource, network, filesystem, credential, or deployment limits.",
      ],
      dailyActionBudget: 12,
      actionsUsed: 0,
      updatedAt: now,
    });

    const goals = [
      {
        title: "Stabilkan bridge sync dan observability",
        rationale: "Reliable data is the prerequisite for every useful decision.",
        impact: 0.9,
        confidence: 0.9,
        learning: 0.6,
        cost: 0.25,
        risk: 0.1,
        feasibility: 0.95,
        source: "constitution",
      },
      {
        title: "Uji hook brief 3 detik",
        rationale: "Measure a small creative variation against the deterministic baseline.",
        impact: 0.65,
        confidence: 0.55,
        learning: 0.85,
        cost: 0.35,
        risk: 0.25,
        feasibility: 0.7,
        source: "world-model",
      },
      {
        title: "Evaluasi capability gap media renderer",
        rationale: "A renderer may be useful, but adding a runtime expands the trust boundary.",
        impact: 0.45,
        confidence: 0.35,
        learning: 0.7,
        cost: 0.75,
        risk: 0.55,
        feasibility: 0.3,
        source: "capability-scan",
      },
    ];
    for (const goal of goals) {
      await ctx.db.insert("organismGoals", {
        userId,
        ...goal,
        status: "candidate",
        createdAt: now,
        updatedAt: now,
      });
    }

    const capabilities = [
      { name: "Konten bridge", kind: "observation", status: "available", trust: 0.9, source: "local" },
      { name: "Deterministic brief parser", kind: "decision", status: "available", trust: 0.95, source: "constitution" },
      { name: "External model", kind: "reasoning", status: "quarantined", trust: 0.2, source: "opt-in-required" },
      { name: "Media renderer", kind: "production", status: "missing", trust: 0.2, source: "capability-scan" },
      { name: "Marketplace publisher", kind: "external-action", status: "blocked", trust: 0.1, source: "safety-boundary" },
    ];
    for (const capability of capabilities) {
      await ctx.db.insert("organismCapabilities", { userId, ...capability });
    }

    const goal = await ctx.db
      .query("organismGoals")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    await ctx.db.insert("organismExperiments", {
      userId,
      goalId: goal?._id,
      title: "Baseline versus hook alternatif",
      hypothesis: "Hook yang lebih spesifik akan meningkatkan compliance score tanpa menambah risiko.",
      variant: "brief-parser-baseline-v1",
      status: "proposed",
      baseline: 0.5,
      score: 0,
      risk: 0.2,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("organismMemories", {
      userId,
      kind: "decision",
      content: "Organism dimulai dalam mode observe; tidak ada tool eksternal yang dijalankan otomatis.",
      source: "initialize",
      confidence: 1,
      createdAt: now,
    });
    await ctx.db.insert("organismEvents", {
      userId,
      type: "kernel_initialized",
      message: "Bounded organism kernel diinisialisasi dalam mode observe.",
      at: now,
    });
    return profileId;
  },
});

export const setOrganismMode = mutation({
  args: { mode: v.string(), ...WORKSPACE_ARGS },
  handler: async (ctx, { mode, workspaceKey }) => {
    const userId = await ensureWorkspaceUserId(ctx, workspaceKey);
    if (!ORGANISM_MODES.includes(mode as (typeof ORGANISM_MODES)[number]) || !isSafeMode(mode as OrganismMode)) {
      throw new Error("Mode organism tidak diizinkan");
    }
    const profile = await ctx.db
      .query("organismProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile) throw new Error("Organism belum diinisialisasi");
    await ctx.db.patch(profile._id, { mode, updatedAt: Date.now() });
    await ctx.db.insert("organismEvents", {
      userId,
      type: "mode_changed",
      message: `Mode diubah menjadi ${mode}.`,
      at: Date.now(),
    });
    return mode;
  },
});

export const createOrganismGoal = mutation({
  args: {
    title: v.string(),
    rationale: v.string(),
    impact: v.number(),
    confidence: v.number(),
    learning: v.number(),
    cost: v.number(),
    risk: v.number(),
    feasibility: v.number(),
    ...WORKSPACE_ARGS,
  },
  handler: async (ctx, args) => {
    const userId = await ensureWorkspaceUserId(ctx, args.workspaceKey);
    const plan = await planForWorkspace(ctx, userId);
    const existingGoals = await ctx.db
      .query("organismGoals")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    if (existingGoals.length >= plan.maxGoals) {
      throw new Error(`Plan ${plan.name} mengizinkan ${plan.maxGoals} goal organisme.`);
    }
    const title = args.title.trim().slice(0, 140);
    if (title.length < 3) throw new Error("Judul goal terlalu pendek");
    const now = Date.now();
    const goalId = await ctx.db.insert("organismGoals", {
      userId,
      title,
      rationale: args.rationale.trim().slice(0, 600),
      status: "candidate",
      impact: ratio(args.impact),
      confidence: ratio(args.confidence),
      learning: ratio(args.learning),
      cost: ratio(args.cost),
      risk: ratio(args.risk),
      feasibility: ratio(args.feasibility),
      source: "operator",
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("organismEvents", {
      userId,
      type: "goal_created",
      message: `Goal baru dicatat: ${title}.`,
      metadata: { goalId },
      at: now,
    });
    await recordUsage(ctx, userId, "goal.created", 1, { goalId });
    return goalId;
  },
});

export const evaluateOrganismExperiment = mutation({
  args: { experimentId: v.id("organismExperiments"), score: v.number(), evidence: v.string(), ...WORKSPACE_ARGS },
  handler: async (ctx, { experimentId, score, evidence, workspaceKey }) => {
    const userId = await resolveWorkspaceUserId(ctx, workspaceKey);
    if (!userId) throw new Error("Workspace tidak ditemukan.");
    const experiment = await ctx.db.get(experimentId);
    if (!experiment || experiment.userId !== userId) throw new Error("Experiment tidak ditemukan");
    const decision = decideExperiment({
      status: experiment.status as "proposed" | "running" | "adopted" | "rejected",
      baseline: experiment.baseline,
      score,
      risk: experiment.risk,
    });
    const now = Date.now();
    await ctx.db.patch(experimentId, {
      status: decision,
      score: ratio(score),
      evidence: evidence.trim().slice(0, 600),
      updatedAt: now,
    });
    if (decision === "adopted") {
      await ctx.db.insert("organismMemories", {
        userId,
        kind: "lesson",
        content: `Experiment ${experiment.title} adopted: improvement ${ratio(score) - experiment.baseline >= 0.1 ? "melewati ambang" : "diperiksa manual"}.`,
        source: "experiment-evaluator",
        confidence: 0.7,
        createdAt: now,
      });
    }
    await ctx.db.insert("organismEvents", {
      userId,
      type: `experiment_${decision}`,
      message: `${experiment.title}: ${decision}.`,
      metadata: { experimentId, score: ratio(score) },
      at: now,
    });
    return decision;
  },
});

export const getAutonomyReviews = query({
  args: WORKSPACE_ARGS,
  handler: async (ctx, { workspaceKey }) => {
    const userId = await resolveWorkspaceUserId(ctx, workspaceKey);
    if (!userId) return [];
    const [campaigns, plans, earnings] = await Promise.all([
      ctx.db.query("kontenCampaigns").withIndex("by_userId", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("autopilotPlans").withIndex("by_userId", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("kontenEarnings").withIndex("by_userId", (q) => q.eq("userId", userId)).collect(),
    ]);
    return campaigns
      .map((campaign) => buildAutonomyReview(campaign, plans.find((plan) => plan.campaignExtId === campaign.extId), earnings))
      .sort((a, b) => b.dataReadiness - a.dataReadiness || b.complianceScore - a.complianceScore);
  },
});

export const getAutonomySummary = query({
  args: WORKSPACE_ARGS,
  handler: async (ctx, { workspaceKey }) => {
    const userId = await resolveWorkspaceUserId(ctx, workspaceKey);
    if (!userId) return null;
    const snapshot = await ctx.db.query("kontenSnapshots").withIndex("by_userId", (q) => q.eq("userId", userId)).first();
    const profile = await ctx.db.query("organismProfiles").withIndex("by_userId", (q) => q.eq("userId", userId)).first();
    return {
      profile,
      coverage: snapshot?.coverage ?? null,
      detailFetched: snapshot?.detailFetched ?? 0,
      snapshotFetchedAt: snapshot?.fetchedAt ?? null,
    };
  },
});

export const getPlanForCampaign = query({
  args: { campaignExtId: v.string(), ...WORKSPACE_ARGS },
  handler: async (ctx, { campaignExtId, workspaceKey }) => {
    const userId = await resolveWorkspaceUserId(ctx, workspaceKey);
    if (!userId) return null;
    const plan = await ctx.db
      .query("autopilotPlans")
      .withIndex("by_userId_campaign", (q) =>
        q.eq("userId", userId).eq("campaignExtId", campaignExtId)
      )
      .first();
    if (!plan) return null;
    const tasks = await ctx.db
      .query("planTasks")
      .withIndex("by_planId", (q) => q.eq("planId", plan._id))
      .collect();
    return { plan, tasks: tasks.sort((a, b) => a.order - b.order) };
  },
});
