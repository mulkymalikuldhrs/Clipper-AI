/** Shared operator runtime contracts. These are intentionally boring and local-first. */
export const OPERATOR_VERSION = "0.1.0";

export const OPERATOR_JOBS = [
  {
    id: "content_rewards_discovery",
    mode: "read_only" as const,
    intervalSeconds: 900,
    description: "Bounded public Content Rewards Discover sync into the existing ingest boundary.",
  },
] as const;

export const MCP_TOOLS = [
  { name: "source_status", access: "read", description: "Report configured source and ingest prerequisites without exposing values." },
  { name: "connector_catalog", access: "read", description: "List connector capabilities and secret boundaries." },
  { name: "provider_config", access: "read", description: "Report model configuration presence only; never return an API key." },
  { name: "content_rewards_discover", access: "read", description: "Fetch a small bounded page of public Content Rewards discovery data." },
  { name: "browser_policy", access: "read", description: "Explain the read-only browser URL allowlist and refusal boundaries." },
  { name: "browser_url_check", access: "read", description: "Check a URL against the browser allowlist without opening it." },
  { name: "daemon_status", access: "read", description: "Read the local daemon state file if the operator has run it." },
] as const;

export const BROWSER_ALLOWLIST = [
  { origin: "https://contentrewards.com", paths: ["/discover"], purpose: "public campaign discovery" },
  { origin: "https://konten.com", paths: ["/clipper-dashboard", "/login"], purpose: "operator-owned session bridge" },
] as const;

export type DaemonConfig = {
  intervalSeconds: number;
  maxCycles: number;
  stateFile: string;
  lockFile: string;
  source: "content_rewards";
};

export const DEFAULT_STATE_DIR = ".clipper-ai/";

function safeLocalPath(value: string | undefined, fallback: string): string {
  const candidate = value?.trim() ?? "";
  // The legacy `.superclipper/` directory stays accepted so an existing operator state file
  // keeps working after the rename; anything outside these two prefixes is refused.
  const allowed = candidate.startsWith(DEFAULT_STATE_DIR) || candidate.startsWith(".superclipper/");
  if (!allowed || candidate.includes("..") || candidate.includes("\\")) return fallback;
  return candidate;
}

export function daemonConfigFromEnv(env: NodeJS.ProcessEnv = process.env): DaemonConfig {
  const rawInterval = Number(env.SC_DAEMON_INTERVAL_SECONDS ?? "900");
  const intervalSeconds = Number.isFinite(rawInterval) ? Math.max(60, Math.min(3600, Math.floor(rawInterval))) : 900;
  const rawCycles = Number(env.SC_DAEMON_MAX_CYCLES ?? "0");
  const maxCycles = Number.isFinite(rawCycles) ? Math.max(0, Math.min(10_000, Math.floor(rawCycles))) : 0;
  return {
    intervalSeconds,
    maxCycles,
    stateFile: safeLocalPath(env.SC_DAEMON_STATE_FILE, `${DEFAULT_STATE_DIR}daemon-state.json`),
    lockFile: safeLocalPath(env.SC_DAEMON_LOCK_FILE, `${DEFAULT_STATE_DIR}daemon.lock`),
    source: "content_rewards",
  };
}

export function isAllowedBrowserUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return BROWSER_ALLOWLIST.some((entry) => url.origin === entry.origin && entry.paths.some((path) => url.pathname === path));
  } catch {
    return false;
  }
}

export function redactConfigValue(value: string | undefined): string {
  return value && value.trim() ? "configured" : "missing";
}

/** Read an env var under its current name, falling back to the pre-rename name. */
export function readRenamedEnv(env: NodeJS.ProcessEnv, name: string, legacyName: string): string | undefined {
  return env[name]?.trim() || env[legacyName]?.trim() || undefined;
}

export const INGEST_URL_ENV = "CLIPPER_AI_URL";
export const INGEST_URL_LEGACY_ENV = "SUPERCLIPPER_URL";

export function readOnlySourceSummary(env: NodeJS.ProcessEnv = process.env): Record<string, string> {
  return {
    contentRewardsEmail: redactConfigValue(env.CONTENT_REWARDS_SYNC_EMAIL),
    ingestUrl: redactConfigValue(readRenamedEnv(env, INGEST_URL_ENV, INGEST_URL_LEGACY_ENV)),
    ingestToken: redactConfigValue(env.INGEST_TOKEN),
    modelBaseUrl: redactConfigValue(readRenamedEnv(env, "CLIPPER_AI_MODEL_BASE_URL", "SUPERCLIPPER_MODEL_BASE_URL")),
    modelName: redactConfigValue(readRenamedEnv(env, "CLIPPER_AI_MODEL_NAME", "SUPERCLIPPER_MODEL_NAME")),
    modelApiKey: redactConfigValue(readRenamedEnv(env, "CLIPPER_AI_MODEL_API_KEY", "SUPERCLIPPER_MODEL_API_KEY")),
  };
}
