/* Brief Autopilot: generate a production plan from a campaign's brief. */
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { parseBrief, type RawCampaign } from "./lib/konten";

export const createPlan = mutation({
  args: { campaignId: v.id("kontenCampaigns") },
  handler: async (ctx, { campaignId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const c = await ctx.db.get(campaignId);
    if (!c || c.userId !== userId) throw new Error("Campaign tidak ditemukan");

    // Reuse existing plan if present.
    const existing = await ctx.db
      .query("autopilotPlans")
      .withIndex("by_userId_campaign", (q) =>
        q.eq("userId", userId).eq("campaignExtId", c.extId)
      )
      .first();
    if (existing) return existing._id;

    const raw = (c.raw ?? {}) as RawCampaign;
    const brief = parseBrief({
      ...raw,
      id: c.extId,
      slug: c.slug,
      title: c.title,
      brand: c.brand,
      platform: c.platforms,
      min_views: c.minViews,
      hashtags: c.hashtags,
    });

    const planId = await ctx.db.insert("autopilotPlans", {
      userId,
      campaignExtId: c.extId,
      campaignSlug: c.slug,
      title: c.title,
      brand: c.brand,
      hook: brief.hook,
      narasi: brief.narasi,
      cta: brief.cta,
      caption: brief.caption,
      hashtags: brief.hashtags,
      durasiMin: brief.durasiMin,
      durasiMax: brief.durasiMax,
      materi: brief.materi,
      elemenWajib: brief.elemenWajib,
      doDonts: brief.doDonts,
      boleh: brief.boleh,
      dilarang: brief.dilarang,
      narasiPoints: brief.narasiPoints,
      captionWajib: brief.captionWajib,
      targetAudience: brief.targetAudience,
      goal: brief.goal,
      instruksiBrief: brief.instruksiBrief,
      judulFile: brief.judulFile,
      platforms: c.platforms,
      shotlist: brief.shotlist,
      complianceScore: brief.complianceScore,
      status: "draft",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const taskDefs: { label: string; category: string }[] = [
      ...brief.materi.slice(0, 12).map((m) => ({ label: `Unduh & review materi: ${m.title}`, category: "materi" })),
      ...brief.narasiPoints.slice(0, 4).map((n) => ({ label: `Sampaikan poin narasi: ${n.slice(0, 100)}`, category: "produksi" })),
      { label: "Pilih 1 reaksi/testimoni paling kuat sebagai HOOK (3 dtk pertama)", category: "produksi" },
      { label: `Rakit rough cut sesuai shotlist (durasi ${brief.durasiMin}–${brief.durasiMax} dtk)`, category: "produksi" },
      ...brief.elemenWajib.slice(0, 6).map((e) => ({ label: `Penuhi elemen wajib: ${e.slice(0, 90)}`, category: "compliance" })),
      { label: "Pasang bumper ending + CTA resmi", category: "compliance" },
      ...brief.dilarang.slice(0, 8).map((d) => ({ label: `CEK LARANGAN: ${d.slice(0, 100)}`, category: "compliance" })),
      { label: "Siapkan caption + semua hashtag wajib", category: "posting" },
      { label: "Posting di platform: " + (c.platforms.join(", ") || "-"), category: "posting" },
      { label: "Submit link video ke campaign di konten.com", category: "posting" },
    ];
    let order = 0;
    for (const t of taskDefs) {
      await ctx.db.insert("planTasks", { planId, label: t.label, category: t.category, done: false, order: order++ });
    }
    return planId;
  },
});

export const toggleTask = mutation({
  args: { taskId: v.id("planTasks") },
  handler: async (ctx, { taskId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const task = await ctx.db.get(taskId);
    if (!task) return;
    const plan = await ctx.db.get(task.planId);
    if (!plan || plan.userId !== userId) return;
    await ctx.db.patch(taskId, { done: !task.done });
  },
});

export const setPlanStatus = mutation({
  args: { planId: v.id("autopilotPlans"), status: v.string() },
  handler: async (ctx, { planId, status }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const plan = await ctx.db.get(planId);
    if (!plan || plan.userId !== userId) return;
    await ctx.db.patch(planId, { status, updatedAt: Date.now() });
  },
});
