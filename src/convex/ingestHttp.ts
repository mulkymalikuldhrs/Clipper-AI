import { v } from "convex/values";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Push-only ingest endpoint for the local bridge (scripts/bridge-sync.ts).
 * Auth: header "x-sc-token" must equal INGEST_TOKEN env var.
 */
export const pushSnapshot = httpAction(async (ctx, req) => {
  const token = req.headers.get("x-sc-token") ?? "";
  const expected = process.env.INGEST_TOKEN ?? "";
  if (!expected || token !== expected) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  let payload: {
    email?: string;
    source?: string;
    snapshot?: Record<string, unknown>;
  };
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "bad json" }), { status: 400 });
  }
  const email = (payload.email ?? "").toLowerCase();
  if (!email) {
    return new Response(JSON.stringify({ error: "email required" }), { status: 400 });
  }

  const result = await ctx.runAction(internal.ingest.applySnapshot, {
    email,
    source: payload.source ?? "bridge",
    snapshot: payload.snapshot ?? {},
  });
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
});
