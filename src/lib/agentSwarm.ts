/* Browser-safe multi-agent swarm foundation.
 *
 * Provider secrets are never written to localStorage. The runtime is deliberately
 * bounded: a small role set, capped messages, and skill changes always require
 * human review before they can influence later work.
 */

import type { ProviderConfig } from "./providerConfig";
import { readWithLegacy } from "./localStore";

export const SWARM_STORAGE_KEY = "clipper-ai.swarm.sessions.v1";
export const SWARM_STORAGE_LEGACY_KEY = "superclipper.swarm.sessions.v1";
export const SWARM_PROVIDER_KEY = "clipper-ai.swarm.provider.v1";
export const SWARM_PROVIDER_LEGACY_KEY = "superclipper.swarm.provider.v1";
export const SWARM_API_KEY_SESSION_KEY = "clipper-ai.swarm.api-key.v1";

export const AGENT_ROLES = [
  { id: "coordinator", label: "Coordinator", focus: "memecah goal, mengurutkan pekerjaan, dan menjaga scope" },
  { id: "researcher", label: "Researcher", focus: "mengumpulkan bukti, campaign facts, dan gap informasi" },
  { id: "producer", label: "Producer", focus: "mengubah brief menjadi manifest produksi dan shotlist" },
  { id: "reviewer", label: "Reviewer", focus: "menilai kepatuhan, risiko, kualitas, dan apa yang perlu review" },
  { id: "memory", label: "Memory", focus: "menyaring pelajaran yang bisa dipakai kembali" },
  { id: "connector", label: "Connector", focus: "memetakan kebutuhan data ke connector read-only" },
] as const;

export type AgentRoleId = (typeof AGENT_ROLES)[number]["id"];
export type AgentMessage = {
  id: string;
  roleId: AgentRoleId;
  role: string;
  content: string;
  createdAt: number;
};
export type SwarmMemory = {
  id: string;
  content: string;
  source: string;
  confidence: number;
  createdAt: number;
};
export type SkillProposal = {
  id: string;
  name: string;
  instructions: string;
  rationale: string;
  status: "review_required" | "approved" | "rejected";
  createdAt: number;
};
export type SwarmEvaluation = {
  score: number;
  verdict: "do_nothing" | "ready_for_review" | "needs_evidence";
  checks: { label: string; ok: boolean; detail: string }[];
  evaluatedAt: number;
};
export type SwarmSession = {
  id: string;
  title: string;
  goal: string;
  createdAt: number;
  updatedAt: number;
  messages: AgentMessage[];
  memories: SwarmMemory[];
  skills: SkillProposal[];
  evaluation?: SwarmEvaluation;
};

export type SwarmRunConfig = ProviderConfig & {
  roleIds: AgentRoleId[];
  maxCalls?: number;
};

const MAX_GOAL = 2_000;
const MAX_OUTPUT = 12_000;
const MAX_HISTORY = 12;

function id(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function bounded(value: string, max = MAX_OUTPUT): string {
  return value.trim().slice(0, max);
}

function roleById(roleId: AgentRoleId) {
  return AGENT_ROLES.find((role) => role.id === roleId) ?? AGENT_ROLES[0];
}

export function defaultRoleIds(): AgentRoleId[] {
  return ["coordinator", "producer", "reviewer"];
}

export function createSwarmSession(goal: string, title = "Swarm session"): SwarmSession {
  const now = Date.now();
  const safeGoal = bounded(goal, MAX_GOAL);
  return {
    id: id("swarm"),
    title: bounded(title || "Swarm session", 120),
    goal: safeGoal,
    createdAt: now,
    updatedAt: now,
    messages: [],
    memories: [],
    skills: [],
  };
}

export function readSwarmSessions(
  storage: Pick<Storage, "getItem"> & Partial<Pick<Storage, "setItem" | "removeItem">>
): SwarmSession[] {
  try {
    const value = readWithLegacy(storage, SWARM_STORAGE_KEY, SWARM_STORAGE_LEGACY_KEY);
    if (!value) return [];
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSwarmSession).slice(-12);
  } catch {
    return [];
  }
}

export function writeSwarmSessions(storage: Pick<Storage, "setItem">, sessions: SwarmSession[]): void {
  storage.setItem(SWARM_STORAGE_KEY, JSON.stringify(sessions.slice(-12)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSwarmSession(value: unknown): value is SwarmSession {
  if (!isRecord(value)) return false;
  return typeof value.id === "string" && typeof value.goal === "string" && Array.isArray(value.messages) && Array.isArray(value.memories) && Array.isArray(value.skills);
}

export function buildRolePrompt(roleId: AgentRoleId, goal: string, context: string): { system: string; user: string } {
  const role = roleById(roleId);
  return {
    system: `Kamu adalah ${role.label} dalam Clipper AI Swarm. Fokusmu: ${role.focus}. Bekerja dengan bukti, jangan mengarang data, tandai ketidakpastian, dan jangan melakukan stock atau mengubah repo. Jawaban singkat, konkret, dan dapat ditinjau berikutnya.`,
    user: `GOAL:\n${bounded(goal, MAX_GOAL)}\n\nCONTEXT SHARED:\n${bounded(context || "Belum ada konteks.", 8_000)}`,
  };
}

function contextFor(session: SwarmSession): string {
  const recentMessages = session.messages.slice(-MAX_HISTORY).map((m) => `${m.role}: ${m.content}`).join("\n");
  const memories = session.memories.slice(-8).map((m) => `[${m.source}] ${m.content}`).join("\n");
  return `SHARED MEMORY:\n${memories || "Belum ada memori."}\n\nRECENT TRANSCRIPT:\n${recentMessages || "Belum ada transcript."}`;
}

async function callModel(config: ProviderConfig, roleId: AgentRoleId, session: SwarmSession): Promise<string> {
  const prompt = buildRolePrompt(roleId, session.goal, contextFor(session));
  const base = config.baseUrl.replace(/\/$/, "");
  const endpoint = base.endsWith("/chat/completions") ? base : `${base}/chat/completions`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(config.apiKey ? { authorization: `Bearer ${config.apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.2,
      max_tokens: 900,
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user },
      ],
    }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok) throw new Error(`Provider ${response.status}: ${(await response.text()).slice(0, 240)}`);
  const payload: unknown = await response.json();
  let message: unknown;
  if (isRecord(payload) && Array.isArray(payload.choices)) {
    const first = payload.choices[0];
    if (isRecord(first) && isRecord(first.message)) message = first.message.content;
  }
  if (typeof message !== "string" || !message.trim()) throw new Error("Provider tidak mengembalikan konten.");
  return bounded(message);
}

export async function probeProvider(config: ProviderConfig): Promise<{ ok: true; modelCount: number; endpoint: string }> {
  const base = config.baseUrl.replace(/\/$/, "").replace(/\/chat\/completions$/, "");
  const endpoint = `${base}/models`;
  const response = await fetch(endpoint, {
    headers: { accept: "application/json", ...(config.apiKey ? { authorization: `Bearer ${config.apiKey}` } : {}) },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Provider health check ${response.status}: ${(await response.text()).slice(0, 180)}`);
  const payload: unknown = await response.json();
  const data = isRecord(payload) && Array.isArray(payload.data) ? payload.data : [];
  return { ok: true, modelCount: data.length, endpoint };
}

export async function runSwarm(session: SwarmSession, config: SwarmRunConfig): Promise<SwarmSession> {
  const roleIds = [...new Set(config.roleIds)].slice(0, Math.max(1, Math.min(4, config.maxCalls ?? 3)));
  let next: SwarmSession = { ...session, messages: [...session.messages], memories: [...session.memories], skills: [...session.skills] };
  for (const roleId of roleIds) {
    const content = await callModel(config, roleId, next);
    const role = roleById(roleId);
    next = {
      ...next,
      updatedAt: Date.now(),
      messages: [...next.messages, { id: id("msg"), roleId, role: role.label, content, createdAt: Date.now() }].slice(-40),
    };
  }
  const lessons = deriveMemory(next);
  const skill = proposeSkill(next);
  return {
    ...next,
    updatedAt: Date.now(),
    memories: [...next.memories, ...lessons].slice(-40),
    skills: skill ? [...next.skills, skill].slice(-20) : next.skills,
    evaluation: evaluateSwarmSession(next),
  };
}

export function deriveMemory(session: SwarmSession): SwarmMemory[] {
  const source = session.messages.at(-1)?.role ?? "swarm";
  const content = bounded(`Run terakhir untuk ${session.goal}; output terakhir: ${session.messages.at(-1)?.content ?? "belum ada output"}.`, 600);
  return [{ id: id("mem"), content, source, confidence: 0.55, createdAt: Date.now() }];
}

export function proposeSkill(session: SwarmSession): SkillProposal | null {
  const last = session.messages.at(-1)?.content ?? "";
  if (!last || last.length < 40) return null;
  return {
    id: id("skill"),
    name: "swarm-review-loop",
    instructions: "Sebelum finalisasi, pisahkan fakta, inferensi, dan langkah yang membutuhkan persetujuan manusia. Simpan pelajaran hanya jika didukung output run.",
    rationale: "Pola run ini dapat menjadi reusable review loop, tetapi tidak boleh aktif sebelum disetujui pengguna.",
    status: "review_required",
    createdAt: Date.now(),
  };
}

export function evaluateSwarmSession(session: SwarmSession): SwarmEvaluation {
  const hasGoal = session.goal.trim().length >= 3;
  const hasOutput = session.messages.some((message) => message.content.trim().length >= 20);
  const hasEvidence = session.messages.some((message) => /https?:\/\/|brief|campaign|evidence|bukti/i.test(message.content));
  const checks = [
    { label: "goal jelas", ok: hasGoal, detail: hasGoal ? "Goal tersedia." : "Goal belum cukup spesifik." },
    { label: "output agent", ok: hasOutput, detail: hasOutput ? "Ada output lintas role." : "Belum ada output lintas role." },
    { label: "evidence tertaut", ok: hasEvidence, detail: hasEvidence ? "Ada jejak evidence di transcript." : "Evidence belum eksplisit." },
  ];
  const score = Math.round((checks.filter((check) => check.ok).length / checks.length) * 100);
  return { score, verdict: score >= 66 ? "ready_for_review" : score >= 33 ? "needs_evidence" : "do_nothing", checks, evaluatedAt: Date.now() };
}
