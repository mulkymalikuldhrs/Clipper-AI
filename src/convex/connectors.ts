/* Server-side provider connectors. Provider secrets stay in Convex env vars. */
import { v } from "convex/values";
import { action } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const runApifyActor = action({
  args: {
    actorId: v.string(),
    input: v.optional(v.any()),
  },
  handler: async (ctx, { actorId, input }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const token = process.env.APIFY_TOKEN;
    if (!token) throw new Error("APIFY_TOKEN belum dikonfigurasi");
    if (!/^[a-zA-Z0-9._-]{3,120}$/.test(actorId)) throw new Error("Actor ID tidak valid");
    const response = await fetch(`https://api.apify.com/v2/acts/${encodeURIComponent(actorId)}/runs`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(input ?? {}),
    });
    if (!response.ok) throw new Error(`Apify HTTP ${response.status}: ${(await response.text()).slice(0, 240)}`);
    return response.json();
  },
});

export const probeWhopAccount = action({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const token = process.env.WHOP_API_KEY;
    if (!token) throw new Error("WHOP_API_KEY belum dikonfigurasi");
    const response = await fetch("https://api.whop.com/api/v1/users?limit=1", {
      headers: { authorization: `Bearer ${token}`, accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Whop HTTP ${response.status}: ${(await response.text()).slice(0, 240)}`);
    return response.json();
  },
});
