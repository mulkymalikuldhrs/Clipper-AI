import { describe, expect, test } from "bun:test";
import { MAX_WORKSPACE_GOALS, MAX_WORKSPACE_PLANS, isValidWorkspaceKey } from "../src/convex/lib/workspace";
import { isPublicSource, scopeForSource } from "../src/convex/lib/ingest";

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

  test("bounds how much state one unauthenticated workspace can create", () => {
    expect(MAX_WORKSPACE_PLANS).toBeGreaterThan(0);
    expect(MAX_WORKSPACE_GOALS).toBeGreaterThan(0);
    expect(MAX_WORKSPACE_PLANS).toBeLessThanOrEqual(200);
    expect(MAX_WORKSPACE_GOALS).toBeLessThanOrEqual(200);
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
