import { describe, expect, test } from "bun:test";
import { normalizeSocialAccounts } from "../src/lib/socialAccounts";

describe("social account configuration", () => {
  test("keeps only valid platform metadata and forces review-gated publishing", () => {
    const accounts = normalizeSocialAccounts([
      {
        id: "ig-1",
        platform: "instagram",
        displayName: "Studio",
        handle: "@studio",
        profileUrl: "https://instagram.com/studio",
        connection: "ready",
        publishMode: "auto",
      },
      { platform: "unknown", displayName: "No", handle: "@no" },
      null,
    ]);

    expect(accounts).toHaveLength(1);
    expect(accounts[0]?.platform).toBe("instagram");
    expect(accounts[0]?.publishMode).toBe("review_required");
    expect(accounts[0]?.connection).toBe("ready");
  });

  test("rejects non-HTTPS profile URLs", () => {
    const [account] = normalizeSocialAccounts([
      {
        platform: "tiktok",
        displayName: "Studio",
        handle: "@studio",
        profileUrl: "javascript:alert(1)",
      },
    ]);
    expect(account?.profileUrl).toBe("");
  });
});
