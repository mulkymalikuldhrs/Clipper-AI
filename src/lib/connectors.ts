/* Connector catalog. Secrets are never part of this config; they belong in Keys/API keys. */

export type ConnectorId = "apify" | "whop" | "content_rewards" | "openai_compatible" | "webhook" | "mcp_operator" | "playwright_browser" | "camofox_adapter";
export type ConnectorCapability = "read" | "write" | "scrape" | "schedule" | "consequential";

export type ConnectorDefinition = {
  id: ConnectorId;
  label: string;
  description: string;
  docsUrl: string;
  capabilities: ConnectorCapability[];
  requiredEnvVars: string[];
  status: "available" | "planned";
  safety: string;
};

export const CONNECTORS: ConnectorDefinition[] = [
  {
    id: "apify",
    label: "Apify",
    description: "Run Actors untuk scraping, monitoring, dan automation browser dengan output terstruktur.",
    docsUrl: "https://docs.apify.com/",
    capabilities: ["read", "scrape", "schedule"],
    requiredEnvVars: ["APIFY_TOKEN"],
    status: "available",
    safety: "Actor adalah external execution; gunakan allowlist Actor ID dan review output.",
  },
  {
    id: "whop",
    label: "Whop",
    description: "Connector server-side untuk Whop developer API, webhook, dan commerce workflows.",
    docsUrl: "https://docs.whop.com/",
    capabilities: ["read", "write", "consequential"],
    requiredEnvVars: ["WHOP_API_KEY"],
    status: "available",
    safety: "Payment, payout, dan app-management actions memerlukan review; jangan expose key ke browser.",
  },
  {
    id: "content_rewards",
    label: "Content Rewards Discover",
    description: "Public campaign discovery untuk marketplace clipping; read-only dan tanpa cookies.",
    docsUrl: "https://contentrewards.com/discover",
    capabilities: ["read", "scrape"],
    requiredEnvVars: [],
    status: "available",
    safety: "Tidak melakukan join, submit, publish, atau engagement otomatis.",
  },
  {
    id: "openai_compatible",
    label: "OpenAI-compatible model",
    description: "Model provider dengan custom base URL dan model name untuk swarm lokal.",
    docsUrl: "https://github.com/open-multi-agent/open-multi-agent",
    capabilities: ["read"],
    requiredEnvVars: [],
    status: "available",
    safety: "API key hanya sessionStorage browser atau server-side Convex env; output tetap perlu review.",
  },
  {
    id: "mcp_operator",
    label: "Clipper AI MCP",
    description: "Official MCP stdio server untuk source status, connector catalog, provider presence, dan bounded public discovery.",
    docsUrl: "https://ts.sdk.modelcontextprotocol.io/",
    capabilities: ["read"],
    requiredEnvVars: [],
    status: "available",
    safety: "Read-only tool allowlist; tidak ada shell, arbitrary URL, credential, atau marketplace write tool.",
  },
  {
    id: "playwright_browser",
    label: "Playwright browser",
    description: "Built-in browser runner untuk inspeksi halaman read-only pada origin dan path yang di-allowlist.",
    docsUrl: "https://playwright.dev/docs/intro",
    capabilities: ["read", "scrape"],
    requiredEnvVars: [],
    status: "available",
    safety: "Headless inspection only; tidak melakukan click, form submission, download, atau anti-bot bypass.",
  },
  {
    id: "camofox_adapter",
    label: "Camofox adapter contract",
    description: "Contract opsional untuk binary Camofox-compatible milik operator; tidak mengaktifkan stealth atau bypass.",
    docsUrl: "https://github.com/daijro/camoufox",
    capabilities: ["read", "scrape"],
    requiredEnvVars: ["SC_CAMOFOX_COMMAND"],
    status: "planned",
    safety: "Hanya adapter binary yang diverifikasi operator; tidak ada klaim official, anti-detection, atau CAPTCHA bypass.",
  },
  {
    id: "webhook",
    label: "Generic webhook",
    description: "Plugin contract untuk event masuk dan notifikasi internal dengan signature verification.",
    docsUrl: "",
    capabilities: ["read", "write", "schedule"],
    requiredEnvVars: ["WEBHOOK_SIGNING_SECRET"],
    status: "planned",
    safety: "Gunakan signed payload, allowlist origin, replay protection, dan bounded payload.",
  },
];

export function getConnector(id: string): ConnectorDefinition | undefined {
  return CONNECTORS.find((connector) => connector.id === id);
}
