/**
 * Resolve the Convex deployment URL for the browser.
 *
 * In the Freebuff sandbox the page is served through a port tunnel
 * (`<port>-<sandbox>.e2b.app`), so the local backend on 127.0.0.1:3210 is unreachable by
 * name and must be addressed through its own tunnel (`https://3210-<sandbox>.e2b.app`).
 * Outside that case the injected `VITE_CONVEX_URL` is authoritative.
 */
const configured = (import.meta.env.VITE_CONVEX_URL as string | undefined) ?? "";

export function resolveConvexUrl(): string {
  if (typeof window !== "undefined" && window.location.hostname.endsWith(".e2b.app")) {
    const sandbox = window.location.hostname.replace(/^\d+-/, "");
    return `https://3210-${sandbox}`;
  }
  return configured;
}

/** Base URL for the workspace HTTP API (Convex HTTP actions, same origin as the deployment). */
export function apiBaseUrl(): string {
  return `${resolveConvexUrl().replace(/\/+$/, "")}/api/v1`;
}

export function isConvexUrlConfigured(): boolean {
  return Boolean(configured);
}
