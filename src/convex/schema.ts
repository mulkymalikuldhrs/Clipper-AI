import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  // Convex Auth users table (standard fields) + app fields.
  users: defineTable({
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    image: v.optional(v.string()),
    isAnonymous: v.optional(v.boolean()),
    onboarded: v.optional(v.boolean()),
    role: v.optional(v.string()),
    avatarSeed: v.optional(v.string()),
  }).index("email", ["email"]),

  // Login-free operator workspace: a browser-held key that owns plans and organism state.
  operatorWorkspaces: defineTable({
    key: v.string(),
    userId: v.id("users"),
    plan: v.optional(v.string()), // "free" | "studio" | "agency"
    createdAt: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_userId", ["userId"]),

  // Machine credentials for the workspace HTTP API. Only the SHA-256 hash is stored.
  workspaceApiKeys: defineTable({
    workspaceId: v.id("users"),
    label: v.string(),
    prefix: v.string(),
    hash: v.string(),
    scopes: v.array(v.string()),
    createdAt: v.number(),
    lastUsedAt: v.optional(v.number()),
    revokedAt: v.optional(v.number()),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_hash", ["hash"]),

  // Usage meter: what a workspace actually consumed, counted where it happened.
  usageEvents: defineTable({
    workspaceId: v.id("users"),
    kind: v.string(), // plan.created | goal.created | api_key.created | api.request | ingest.snapshot
    quantity: v.number(),
    at: v.number(),
    meta: v.optional(v.any()),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_workspace_kind", ["workspaceId", "kind"]),


  // One snapshot per user — full mirror of konten.com state.
  kontenSnapshots: defineTable({
    userId: v.id("users"),
    fetchedAt: v.number(),
    source: v.string(), // "bridge" | "content_rewards"
    scope: v.optional(v.string()), // "private" | "public"
    profile: v.optional(v.any()),
    campaigns: v.optional(v.any()),
    joined: v.optional(v.any()),
    earningsSummary: v.optional(v.any()),
    timeseries: v.optional(v.any()),
    wallet: v.optional(v.any()),
    featureFlags: v.optional(v.any()),
    tier: v.optional(v.any()),
    notifications: v.optional(v.number()),
    detailFetched: v.optional(v.number()),
    coverage: v.optional(v.any()),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_source", ["userId", "source"])
    .index("by_scope", ["scope"]),

  // Campaign cache with derived autopilot score.
  kontenCampaigns: defineTable({
    userId: v.id("users"),
    extId: v.string(),
    slug: v.string(),
    title: v.string(),
    brand: v.string(),
    brandLogo: v.optional(v.string()),
    category: v.optional(v.string()),
    platforms: v.array(v.string()),
    status: v.optional(v.string()),
    campaignType: v.optional(v.string()),
    ratePerMillion: v.optional(v.number()),
    budget: v.optional(v.number()),
    spent: v.optional(v.number()),
    clippers: v.optional(v.number()),
    minViews: v.optional(v.number()),
    minDuration: v.optional(v.number()),
    hashtags: v.optional(v.array(v.string())),
    deadline: v.optional(v.string()),
    remainingPct: v.optional(v.number()),
    joined: v.boolean(),
    marketplace: v.optional(v.string()),
    scope: v.optional(v.string()), // "private" | "public"
    score: v.number(),
    raw: v.optional(v.any()),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_extId", ["userId", "extId"])
    .index("by_userId_joined", ["userId", "joined"])
    .index("by_scope", ["scope"]),

  kontenEarnings: defineTable({
    userId: v.id("users"),
    extVideoId: v.optional(v.string()),
    campaignTitle: v.optional(v.string()),
    platform: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    views: v.number(),
    amount: v.number(),
    status: v.optional(v.string()),
    earnedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_earnedAt", ["userId", "earnedAt"]),

  // Brief autopilot: production plan generated from a campaign brief.
  autopilotPlans: defineTable({
    userId: v.id("users"),
    campaignExtId: v.string(),
    campaignSlug: v.string(),
    title: v.string(),
    brand: v.string(),
    hook: v.string(),
    narasi: v.string(),
    cta: v.string(),
    caption: v.string(),
    hashtags: v.array(v.string()),
    durasiMin: v.number(),
    durasiMax: v.number(),
    materi: v.array(v.object({ title: v.string(), url: v.string() })),
    elemenWajib: v.array(v.string()),
    doDonts: v.array(v.string()),
    // Parsed straight from the live konten.com brief (brief_detail).
    boleh: v.optional(v.array(v.string())),
    dilarang: v.optional(v.array(v.string())),
    narasiPoints: v.optional(v.array(v.string())),
    captionWajib: v.optional(v.string()),
    targetAudience: v.optional(v.string()),
    goal: v.optional(v.string()),
    instruksiBrief: v.optional(v.string()),
    judulFile: v.optional(v.string()),
    platforms: v.optional(v.array(v.string())),
    shotlist: v.array(v.object({ detik: v.string(), aksi: v.string() })),
    complianceScore: v.number(),
    status: v.string(), // draft | ready | shooting | done
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_campaign", ["userId", "campaignExtId"]),

  planTasks: defineTable({
    planId: v.id("autopilotPlans"),
    label: v.string(),
    category: v.string(), // materi | produksi | compliance | posting
    done: v.boolean(),
    order: v.number(),
  }).index("by_planId", ["planId"]),

  syncLogs: defineTable({
    userId: v.id("users"),
    source: v.string(),
    status: v.string(), // pending | ok | error
    requestId: v.optional(v.string()),
    message: v.optional(v.string()),
    pages: v.optional(v.number()),
    campaignCount: v.optional(v.number()),
    durationMs: v.optional(v.number()),
    errorCode: v.optional(v.string()),
    at: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_requestId", ["userId", "requestId"]),

  // Bounded organism kernel: identity, world signals, goals, capabilities, and experiments.
  organismProfiles: defineTable({
    userId: v.id("users"),
    name: v.string(),
    mode: v.string(), // observe | review | paused
    constitution: v.array(v.string()),
    dailyActionBudget: v.number(),
    actionsUsed: v.number(),
    lastEvaluatedAt: v.optional(v.number()),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  organismGoals: defineTable({
    userId: v.id("users"),
    title: v.string(),
    rationale: v.string(),
    status: v.string(), // candidate | selected | active | completed | rejected
    impact: v.number(),
    confidence: v.number(),
    learning: v.number(),
    cost: v.number(),
    risk: v.number(),
    feasibility: v.number(),
    source: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  organismCapabilities: defineTable({
    userId: v.id("users"),
    name: v.string(),
    kind: v.string(),
    status: v.string(), // available | missing | quarantined | blocked
    trust: v.number(),
    source: v.string(),
    notes: v.optional(v.string()),
    lastUsedAt: v.optional(v.number()),
  }).index("by_userId", ["userId"]),

  organismExperiments: defineTable({
    userId: v.id("users"),
    goalId: v.optional(v.id("organismGoals")),
    title: v.string(),
    hypothesis: v.string(),
    variant: v.string(),
    status: v.string(), // proposed | running | adopted | rejected
    baseline: v.number(),
    score: v.number(),
    risk: v.number(),
    evidence: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  organismMemories: defineTable({
    userId: v.id("users"),
    kind: v.string(), // lesson | observation | decision
    content: v.string(),
    source: v.string(),
    confidence: v.number(),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  organismEvents: defineTable({
    userId: v.id("users"),
    type: v.string(),
    message: v.string(),
    metadata: v.optional(v.any()),
    at: v.number(),
  }).index("by_userId", ["userId"]),
});
