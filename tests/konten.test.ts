import { describe, expect, test } from "bun:test";
import { parseBrief, scoreCampaign } from "../src/convex/lib/konten";
import { MAX_CAMPAIGNS, validateIngestPayload } from "../src/convex/lib/ingest";

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

  test("rejects unsupported sources and oversized campaign arrays", () => {
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
