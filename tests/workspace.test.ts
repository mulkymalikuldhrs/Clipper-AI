import { describe, expect, test } from "bun:test";
import { isValidWorkspaceKey } from "../src/convex/lib/workspace";
import { isPublicSource, scopeForSource } from "../src/convex/lib/ingest";
import { HARD_LIMITS, PLANS, isPlanId, planFor } from "../src/lib/plans";
import {
  API_KEY_PREFIX,
  apiKeyDisplayPrefix,
  bearerToken,
  generateApiKey,
  hashApiKey,
  isApiKeyScope,
  isApiKeySecret,
} from "../src/lib/apiKeys";

describe("login-free operator workspace", () => {
  test("accepts only 32 lowercase hex characters", () => {
    expect(isValidWorkspaceKey("0123456789abcdef0123456789abcdef")).toBe(true);
    expect(isValidWorkspaceKey("0123456789ABCDEF0123456789ABCDEF")).toBe(false);
    expect(isValidWorkspaceKey("0123456789abcdef0123456789abcde")).toBe(false);
    expect(isValidWorkspaceKey("0123456789abcdef0123456789abcdefg")).toBe(false);
    expect(isValidWorkspaceKey("")).toBe(false);
    expect(isValidWorkspaceKey(undefined)).toBe(false);
    expect(isValidWorkspaceKey(12345)).toBe(false);
  });

  test("resolves unknown plans to a real plan instead of failing open", () => {
    expect(planFor(undefined).id).toBe("free");
    expect(planFor("nonsense").id).toBe("free");
    expect(planFor("studio").id).toBe("studio");
    expect(isPlanId("agency")).toBe(true);
    expect(isPlanId("enterprise")).toBe(false);
  });

  test("keeps every plan inside the absolute ceilings", () => {
    for (const plan of Object.values(PLANS)) {
      expect(plan.maxPlans).toBeGreaterThan(0);
      expect(plan.maxPlans).toBeLessThanOrEqual(HARD_LIMITS.maxPlans);
      expect(plan.maxGoals).toBeLessThanOrEqual(HARD_LIMITS.maxGoals);
      expect(plan.maxApiKeys).toBeLessThanOrEqual(HARD_LIMITS.maxApiKeys);
      expect(plan.apiRequestsPerDay).toBeLessThanOrEqual(HARD_LIMITS.apiRequestsPerDay);
    }
    // Limits must increase with the plan, otherwise a plan means nothing.
    expect(PLANS.free.maxPlans).toBeLessThan(PLANS.studio.maxPlans);
    expect(PLANS.studio.maxPlans).toBeLessThan(PLANS.agency.maxPlans);
  });
});

describe("workspace API keys", () => {
  test("mints a key whose hash is stable and whose plaintext is never the stored form", async () => {
    const key = await generateApiKey();
    expect(isApiKeySecret(key.secret)).toBe(true);
    expect(key.secret.startsWith(`${API_KEY_PREFIX}_`)).toBe(true);
    expect(key.prefix).toBe(apiKeyDisplayPrefix(key.secret));
    expect(key.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(key.hash).toBe(await hashApiKey(key.secret));
    expect(key.prefix).not.toBe(key.secret);
  });

  test("matches the published SHA-256 vector so the hash cannot silently drift", async () => {
    // Known-answer test: any change to the hashing scheme breaks API keys in the field.
    expect(await hashApiKey("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
  });

  test("rejects malformed keys and parses bearer headers strictly", () => {
    expect(isApiKeySecret("clai_short")).toBe(false);
    expect(isApiKeySecret("nope")).toBe(false);
    expect(isApiKeySecret(`${API_KEY_PREFIX}_${"Z".repeat(48)}`)).toBe(false);
    expect(bearerToken("Bearer clai_abc")).toBe("clai_abc");
    expect(bearerToken("bearer   clai_abc  ")).toBe("clai_abc");
    expect(bearerToken(null)).toBe("");
    expect(bearerToken("Basic clai_abc")).toBe("");
  });

  test("exposes exactly one read scope and refuses anything else", () => {
    expect(isApiKeyScope("read")).toBe(true);
    expect(isApiKeyScope("write")).toBe(false);
    expect(isApiKeyScope(undefined)).toBe(false);
  });
});

describe("source visibility policy", () => {
  test("only public discovery data is readable without a workspace", () => {
    expect(isPublicSource("content_rewards")).toBe(true);
    expect(isPublicSource("bridge")).toBe(false);
    expect(scopeForSource("content_rewards")).toBe("public");
    expect(scopeForSource("bridge")).toBe("private");
  });
});
