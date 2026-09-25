#!/usr/bin/env bun
/** Super Clipper operator CLI. Local, bounded, and read-only by default. */
import { readFileSync } from "node:fs";
import { CONNECTORS } from "../src/lib/connectors";
import {
  BROWSER_ALLOWLIST,
  MCP_TOOLS,
  OPERATOR_JOBS,
  daemonConfigFromEnv,
  isAllowedBrowserUrl,
  readOnlySourceSummary,
} from "../src/lib/operatorRuntime";

const args = process.argv.slice(2);
const command = args[0] ?? "help";

function print(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

function help(): void {
  console.log(`Super Clipper operator CLI\n\nCommands:\n  source status\n  connector list\n  mcp list\n  daemon status\n  browser policy [url]\n  browser check <allowlisted-url>\n\nAll commands are read-only. Run the daemon explicitly with: bun run sc:daemon`);
}

function daemonState(): { running: boolean; state: unknown } {
  const config = daemonConfigFromEnv();
  try {
    const state = JSON.parse(readFileSync(config.stateFile, "utf8")) as { status?: string };
    return { running: state.status === "running", state };
  } catch {
    return { running: false, state: null };
  }
}

switch (command) {
  case "help":
  case "--help":
  case "-h":
    help();
    break;
  case "source":
    if (args[1] !== "status") throw new Error("Usage: sc source status");
    print({ ok: true, sources: readOnlySourceSummary(), jobs: OPERATOR_JOBS });
    break;
  case "connector":
    if (args[1] !== "list") throw new Error("Usage: sc connector list");
    print(CONNECTORS);
    break;
  case "mcp":
    if (args[1] !== "list") throw new Error("Usage: sc mcp list");
    print(MCP_TOOLS);
    break;
  case "daemon":
    if (args[1] !== "status") throw new Error("Usage: sc daemon status");
    print(daemonState());
    break;
  case "browser": {
    if (args[1] === "policy") {
      print({ allowlist: BROWSER_ALLOWLIST, note: "Read-only page title/text checks only; no clicks, forms, downloads, or anti-bot bypass." });
      break;
    }
    if (args[1] !== "check" || !args[2]) throw new Error("Usage: sc browser check <allowlisted-url>");
    const url = args[2];
    print({ url, allowed: isAllowedBrowserUrl(url), mode: "read_only", engine: "playwright" });
    if (!isAllowedBrowserUrl(url)) process.exitCode = 2;
    break;
  }
  default:
    console.error(`Unknown command: ${command}`);
    help();
    process.exitCode = 1;
}
