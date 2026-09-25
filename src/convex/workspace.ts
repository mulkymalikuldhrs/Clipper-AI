/* Workspace identity resolution.
 *
 * Order of authority:
 *   1. A signed-in Convex Auth user, when one exists.
 *   2. An anonymous operator workspace referenced by a browser-held key.
 *   3. No workspace at all (read-only public discovery data).
 */
import { getAuthUserId } from "@convex-dev/auth/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { isValidWorkspaceKey } from "./lib/workspace";

type DbCtx = QueryCtx | MutationCtx;

/** Look up an existing anonymous workspace. Queries never create rows. */
export async function findWorkspaceUserId(ctx: DbCtx, key: string | undefined) {
  if (!isValidWorkspaceKey(key)) return null;
  const row = await ctx.db
    .query("operatorWorkspaces")
    .withIndex("by_key", (q) => q.eq("key", key))
    .first();
  return row?.userId ?? null;
}

/** The workspace that owns new records, or null when the caller is purely public. */
export async function resolveWorkspaceUserId(ctx: DbCtx, key: string | undefined) {
  const authUserId = await getAuthUserId(ctx as QueryCtx);
  if (authUserId) return authUserId;
  return await findWorkspaceUserId(ctx, key);
}

/** The workspace that may write, created on first use. Rejects invalid keys. */
export async function ensureWorkspaceUserId(ctx: MutationCtx, key: string | undefined) {
  const authUserId = await getAuthUserId(ctx);
  if (authUserId) return authUserId;
  if (!isValidWorkspaceKey(key)) throw new Error("Workspace key tidak valid.");
  const userId = await findWorkspaceUserId(ctx, key);
  if (userId) return userId;
  const created = await ctx.db.insert("users", {
    name: "Operator workspace",
    isAnonymous: true,
    onboarded: false,
  });
  await ctx.db.insert("operatorWorkspaces", {
    key,
    userId: created,
    createdAt: Date.now(),
  });
  return created;
}
