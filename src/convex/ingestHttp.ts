import { v } from "convex/values";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { MAX_INGEST_BYTES, validateIngestPayload } from "./lib/ingest";

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
  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_INGEST_BYTES) {
    return new Response(JSON.stringify({ error: "payload too large" }), {
      status: 413,
      headers: { "content-type": "application/json" },
    });
  }

  let body: string;
  try {
    body = await req.text();
  } catch {
    return new Response(JSON.stringify({ error: "bad request" }), { status: 400 });
  }
  if (new TextEncoder().encode(body).byteLength > MAX_INGEST_BYTES) {
    return new Response(JSON.stringify({ error: "payload too large" }), {
      status: 413,
      headers: { "content-type": "application/json" },
    });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return new Response(JSON.stringify({ error: "bad json" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  const validation = validateIngestPayload(payload);
  if (!validation.ok) {
    return new Response(JSON.stringify({ error: validation.error }), {
      status: validation.status,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const result = await ctx.runAction(internal.ingest.applySnapshot, validation.value);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "ingest failed" }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }
});
