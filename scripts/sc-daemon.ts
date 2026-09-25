#!/usr/bin/env bun
/**
 * Operator-run daemon. Freebuff never starts this process automatically.
 * It performs bounded public discovery and, only when explicitly configured,
 * sends normalized read-only snapshots to the existing ingest boundary.
 */
import { randomUUID } from "node:crypto";
import { mkdirSync, openSync, unlinkSync, writeFileSync, closeSync } from "node:fs";
import { dirname } from "node:path";
import { contentRewardsListUrl, normalizeContentRewardsCampaigns } from "../src/convex/lib/contentRewards";
import { daemonConfigFromEnv, type DaemonConfig } from "../src/lib/operatorRuntime";

const pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

type CycleResult = { source: string; status: "ok" | "skipped" | "error"; campaigns?: number; detail?: string };

type DaemonState = {
  status: "starting" | "running" | "stopped" | "error";
  pid: number;
  startedAt: string;
  updatedAt: string;
  cycles: number;
  lastResult?: { source: string; status: "ok" | "skipped" | "error"; campaigns?: number; detail?: string };
};

function writeState(config: DaemonConfig, state: DaemonState): void {
  mkdirSync(dirname(config.stateFile), { recursive: true });
  writeFileSync(config.stateFile, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function readPublicCampaigns(): Promise<{ count: number; campaigns: Record<string, unknown>[] }> {
  return fetch(contentRewardsListUrl({ limit: 5, sortBy: "newest" }), {
    headers: { accept: "application/json", "user-agent": "Super-Clipper-Daemon-ReadOnly/1.0" },
    signal: AbortSignal.timeout(20_000),
  }).then(async (response) => {
    if (!response.ok) throw new Error(`Content Rewards HTTP ${response.status}`);
    const payload: unknown = await response.json();
    const normalized = normalizeContentRewardsCampaigns(payload);
    return { count: normalized.length, campaigns: normalized.map((campaign) => campaign.raw.campaign as Record<string, unknown>) };
  });
}

async function runCycle(): Promise<CycleResult> {
  const result = await readPublicCampaigns();
  const shouldSync = process.env.SC_DAEMON_SYNC === "true";
  const email = process.env.CONTENT_REWARDS_SYNC_EMAIL?.trim();
  const pushUrl = process.env.SUPERCLIPPER_URL?.trim();
  const token = process.env.INGEST_TOKEN?.trim();
  if (!shouldSync) return { source: "content_rewards", status: "ok", campaigns: result.count, detail: "observe-only" };
  if (!email || !pushUrl || !token) return { source: "content_rewards", status: "skipped", campaigns: result.count, detail: "sync disabled until email, ingest URL, and token are configured" };

  const response = await fetch(pushUrl, {
    method: "POST",
    headers: { "content-type": "application/json", "x-sc-token": token },
    body: JSON.stringify({
      email: email.toLowerCase(),
      source: "content_rewards",
      requestId: randomUUID(),
      snapshot: { profile: { source: "content_rewards", readOnly: true }, campaigns: result.campaigns, coverage: { discovery: true, detail: false } },
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) return { source: "content_rewards", status: "error", campaigns: result.count, detail: `ingest HTTP ${response.status}` };
  return { source: "content_rewards", status: "ok", campaigns: result.count, detail: "observe + bounded ingest" };
}

export async function runDaemon(config = daemonConfigFromEnv()): Promise<void> {
  mkdirSync(dirname(config.lockFile), { recursive: true });
  let lockFd: number;
  try {
    lockFd = openSync(config.lockFile, "wx");
  } catch {
    throw new Error(`Daemon lock exists: ${config.lockFile}. Another operator process may be running.`);
  }

  const startedAt = new Date().toISOString();
  let state: DaemonState = { status: "starting", pid: process.pid, startedAt, updatedAt: startedAt, cycles: 0 };
  writeState(config, state);
  let stopping = false;
  const stop = () => {
    stopping = true;
    state = { ...state, status: "stopped", updatedAt: new Date().toISOString() };
    writeState(config, state);
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);

  try {
    state = { ...state, status: "running" };
    writeState(config, state);
    for (let cycle = 0; !stopping && (config.maxCycles === 0 || cycle < config.maxCycles); cycle += 1) {
      try {
        const result = await runCycle();
        state = { ...state, status: "running", cycles: cycle + 1, lastResult: result, updatedAt: new Date().toISOString() };
        writeState(config, state);
        console.log(`[daemon] cycle ${cycle + 1}: ${result.status} · ${result.campaigns ?? 0} campaigns · ${result.detail ?? ""}`);
      } catch (error) {
        state = { ...state, status: "error", cycles: cycle + 1, lastResult: { source: "content_rewards", status: "error", detail: String(error).slice(0, 180) }, updatedAt: new Date().toISOString() };
        writeState(config, state);
        console.error(`[daemon] cycle ${cycle + 1}: ${String(error).slice(0, 180)}`);
      }
      if (config.maxCycles !== 0 && cycle + 1 >= config.maxCycles) break;
      await pause(config.intervalSeconds * 1000);
    }
  } finally {
    closeSync(lockFd);
    try { unlinkSync(config.lockFile); } catch { /* already removed */ }
    if (state.status !== "stopped") stop();
  }
}

if (import.meta.main) {
  runDaemon().catch((error) => {
    console.error(`[daemon] fatal: ${String(error).slice(0, 240)}`);
    process.exitCode = 1;
  });
}
