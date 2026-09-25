#!/usr/bin/env bun
/**
 * Official Model Context Protocol stdio server.
 * It intentionally exposes no arbitrary URL, shell, filesystem, marketplace write,
 * credential, publishing, or account-control tools.
 */
import { readFileSync } from "node:fs";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { CONNECTORS } from "../src/lib/connectors";
import { contentRewardsListUrl } from "../src/convex/lib/contentRewards";
import {
  BROWSER_ALLOWLIST,
  OPERATOR_VERSION,
  daemonConfigFromEnv,
  isAllowedBrowserUrl,
  readOnlySourceSummary,
} from "../src/lib/operatorRuntime";

const server = new McpServer({ name: "super-clipper-operator", version: OPERATOR_VERSION });
const readOnly = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } as const;
const text = (value: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] });

server.registerTool("source_status", {
  title: "Source status",
  description: "Report configured source prerequisites without exposing secret values.",
  annotations: readOnly,
}, async () => text(readOnlySourceSummary()));

server.registerTool("connector_catalog", {
  title: "Connector catalog",
  description: "List provider capabilities, required environment names, and safety boundaries.",
  annotations: readOnly,
}, async () => text(CONNECTORS));

server.registerTool("provider_config", {
  title: "Provider configuration",
  description: "Report model provider configuration presence only; never return an API key.",
  annotations: readOnly,
}, async () => text(readOnlySourceSummary()));

server.registerTool("content_rewards_discover", {
  title: "Content Rewards discovery",
  description: "Fetch at most five public Content Rewards discovery rows. No login or cookies.",
  inputSchema: { limit: z.number().int().min(1).max(5).default(1) },
  annotations: readOnly,
}, async ({ limit }) => {
  const response = await fetch(contentRewardsListUrl({ limit, sortBy: "newest" }), {
    headers: { accept: "application/json", "user-agent": "Super-Clipper-MCP-ReadOnly/1.0" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) return text({ error: `Content Rewards HTTP ${response.status}` });
  const payload: unknown = await response.json();
  const rows = payload && typeof payload === "object" && "data" in payload && Array.isArray((payload as { data?: unknown }).data)
    ? (payload as { data: unknown[] }).data.slice(0, limit)
    : [];
  return text({ source: "content_rewards", readOnly: true, count: rows.length, rows });
});

server.registerTool("browser_policy", {
  title: "Browser policy",
  description: "Explain the operator-owned read-only browser allowlist and refusal boundaries.",
  annotations: readOnly,
}, async () => text({
  allowlist: BROWSER_ALLOWLIST,
  supported: "Playwright is built in; an external Camofox-compatible binary is optional and operator-run.",
  refuses: ["arbitrary URLs", "clicks", "forms", "downloads", "CAPTCHA or anti-bot bypass", "marketplace writes"],
}));

server.registerTool("daemon_status", {
  title: "Daemon status",
  description: "Read the local operator daemon state file, if the operator has started it.",
  annotations: readOnly,
}, async () => {
  const config = daemonConfigFromEnv();
  try {
    return text({ stateFile: config.stateFile, state: JSON.parse(readFileSync(config.stateFile, "utf8")) });
  } catch {
    return text({ stateFile: config.stateFile, state: null, note: "Daemon has not written a state file on this machine." });
  }
});

server.registerTool("browser_url_check", {
  title: "Browser URL check",
  description: "Check whether a URL is inside the bounded browser allowlist without opening it.",
  inputSchema: { url: z.string().url() },
  annotations: readOnly,
}, async ({ url }) => text({ url, allowed: isAllowedBrowserUrl(url), readOnly: true }));

await server.connect(new StdioServerTransport());
