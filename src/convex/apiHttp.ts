/* Workspace HTTP API v1.
 *
 * Authentication is a workspace API key presented as `Authorization: Bearer clai_...`.
 * The server only ever compares a SHA-256 hash, the key must carry the `read` scope, and
 * every request is metered against the workspace plan's daily quota.
 *
 * The API is read-only by design. Production plans and campaigns are prepared here; posting,
 * submitting, and spending stay human actions in the marketplace.
 */
import { httpAction } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { bearerToken, hashApiKey, isApiKeySecret } from "../lib/apiKeys";

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 25;
const API_VERSION = "2026-09-25";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "x-clipper-ai-api": API_VERSION,
    },
  });
}

function apiError(status: number, code: string, message: string): Response {
  return json({ error: { code, message } }, status);
}

type Authenticated = {
  workspaceId: Id<"users">;
  scopes: string[];
  label: string;
  keyId: Id<"workspaceApiKeys">;
};

/** Resolve the bearer key. Returns a Response to send when authentication fails. */
async function authenticate(ctx: ActionCtx, request: Request): Promise<Authenticated | Response> {
  const token = bearerToken(request.headers.get("authorization"));
  if (!token) return apiError(401, "missing_key", "Sertakan header Authorization: Bearer <api key>.");
  if (!isApiKeySecret(token)) return apiError(401, "malformed_key", "Format API key tidak dikenali.");
  const key = await ctx.runQuery(internal.platform.resolveApiKey, { hash: await hashApiKey(token) });
  if (!key) return apiError(401, "invalid_key", "API key tidak valid atau sudah dicabut.");
  if (!key.scopes.includes("read")) return apiError(403, "insufficient_scope", "API key ini tidak punya scope read.");
  return { workspaceId: key.workspaceId, scopes: key.scopes, label: key.label, keyId: key.id };
}

/** Meter the request against the plan quota. Returns a Response when the quota is spent. */
async function meter(ctx: ActionCtx, auth: Authenticated, route: string): Promise<Response | null> {
  const result = await ctx.runMutation(internal.platform.meterApiRequest, {
    workspaceId: auth.workspaceId,
    route,
  });
  if (!result.allowed) {
    return apiError(
      429,
      "quota_exceeded",
      `Kuota API harian plan ${result.plan} sudah terpakai (${result.used}/${result.limit}).`
    );
  }
  await ctx.runMutation(internal.platform.touchApiKey, { keyId: auth.keyId });
  return null;
}

function parseLimit(url: URL): number {
  const raw = Number(url.searchParams.get("limit") ?? DEFAULT_LIMIT);
  if (!Number.isFinite(raw)) return DEFAULT_LIMIT;
  return Math.max(1, Math.min(MAX_LIMIT, Math.floor(raw)));
}

export const apiWorkspace = httpAction(async (ctx, request) => {
  const auth = await authenticate(ctx, request);
  if (auth instanceof Response) return auth;
  const denied = await meter(ctx, auth, "workspace");
  if (denied) return denied;
  const context = await ctx.runQuery(internal.apiData.workspaceContext, { workspaceId: auth.workspaceId });
  return json({ apiVersion: API_VERSION, key: { label: auth.label, scopes: auth.scopes }, ...context });
});

export const apiCampaigns = httpAction(async (ctx, request) => {
  const auth = await authenticate(ctx, request);
  if (auth instanceof Response) return auth;
  const denied = await meter(ctx, auth, "campaigns");
  if (denied) return denied;
  const limit = parseLimit(new URL(request.url));
  const campaigns = await ctx.runQuery(internal.apiData.listCampaigns, {
    workspaceId: auth.workspaceId,
    limit,
  });
  return json({ apiVersion: API_VERSION, limit, count: campaigns.length, campaigns });
});

export const apiPlans = httpAction(async (ctx, request) => {
  const auth = await authenticate(ctx, request);
  if (auth instanceof Response) return auth;
  const denied = await meter(ctx, auth, "plans");
  if (denied) return denied;
  const limit = parseLimit(new URL(request.url));
  const plans = await ctx.runQuery(internal.apiData.listProductionPlans, {
    workspaceId: auth.workspaceId,
    limit,
  });
  return json({ apiVersion: API_VERSION, limit, count: plans.length, plans });
});
