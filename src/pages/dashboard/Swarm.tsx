import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, Panel, Status } from "@/components/shared";
import {
  AGENT_ROLES,
  SWARM_API_KEY_SESSION_KEY,
  SWARM_PROVIDER_KEY,
  createSwarmSession,
  defaultRoleIds,
  evaluateSwarmSession,
  readSwarmSessions,
  runSwarm,
  writeSwarmSessions,
  type AgentRoleId,
  type SwarmSession,
} from "@/lib/agentSwarm";
import { readNonSecretProviderConfig, validateProviderConfig, type ProviderConfig } from "@/lib/providerConfig";
import { Check, Clock3, ExternalLink, LockKeyhole, Play, Plus, ShieldCheck, X } from "lucide-react";
import { CONNECTORS } from "@/lib/connectors";

export default function Swarm() {
  const [sessions, setSessions] = useState<SwarmSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [goal, setGoal] = useState("");
  const [title, setTitle] = useState("Swarm session");
  const [roles, setRoles] = useState<AgentRoleId[]>(defaultRoleIds());
  const [provider, setProvider] = useState<ProviderConfig>({ baseUrl: "", model: "", apiKey: "" });
  const [busy, setBusy] = useState(false);
  const [autoEvaluate, setAutoEvaluate] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const stored = readSwarmSessions(window.localStorage);
    setSessions(stored);
    setActiveId(stored.at(-1)?.id ?? null);
    setProvider({
      ...readNonSecretProviderConfig(window.localStorage.getItem(SWARM_PROVIDER_KEY)),
      apiKey: window.sessionStorage.getItem(SWARM_API_KEY_SESSION_KEY) ?? "",
    });
  }, []);

  const active = useMemo(() => sessions.find((session) => session.id === activeId) ?? null, [activeId, sessions]);

  useEffect(() => {
    if (!autoEvaluate || !active) return;
    const timer = window.setInterval(() => {
      setSessions((current) => {
        const next = current.map((session) => session.id === active.id ? { ...session, evaluation: evaluateSwarmSession(session), updatedAt: Date.now() } : session);
        writeSwarmSessions(window.localStorage, next);
        return next;
      });
    }, 300_000);
    return () => window.clearInterval(timer);
  }, [active, autoEvaluate]);

  function persist(next: SwarmSession[]) {
    setSessions(next);
    writeSwarmSessions(window.localStorage, next);
  }

  function newSession() {
    const session = createSwarmSession(goal || "Analisis campaign dan susun langkah produksi yang aman.", title);
    persist([...sessions, session]);
    setActiveId(session.id);
    setNotice("Session swarm lokal dibuat.");
  }

  function saveProvider() {
    const validation = validateProviderConfig(provider);
    if (!validation.ok) {
      setNotice(validation.error);
      return;
    }
    const value = validation.value;
    window.localStorage.setItem(SWARM_PROVIDER_KEY, JSON.stringify({ baseUrl: value.baseUrl, model: value.model }));
    if (value.apiKey) window.sessionStorage.setItem(SWARM_API_KEY_SESSION_KEY, value.apiKey);
    else window.sessionStorage.removeItem(SWARM_API_KEY_SESSION_KEY);
    setProvider(value);
    setNotice("Provider non-secret disimpan di browser; API key hanya hidup di sessionStorage.");
  }

  async function run() {
    if (!active) {
      setNotice("Buat session swarm terlebih dahulu.");
      return;
    }
    const validation = validateProviderConfig(provider);
    if (!validation.ok) {
      setNotice(validation.error);
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      const result = await runSwarm(active, { ...validation.value, roleIds: roles });
      persist(sessions.map((session) => (session.id === result.id ? result : session)));
      setNotice(`Swarm selesai: ${result.messages.length} pesan, ${result.memories.length} memori, ${result.skills.length} skill proposal.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Provider gagal dipanggil.");
    } finally {
      setBusy(false);
    }
  }

  function evaluate() {
    if (!active) return;
    const evaluation = evaluateSwarmSession(active);
    persist(sessions.map((session) => (session.id === active.id ? { ...session, evaluation, updatedAt: Date.now() } : session)));
    setNotice(`Evaluasi: ${evaluation.score}/100 — ${evaluation.verdict}.`);
  }

  function toggleRole(roleId: AgentRoleId) {
    setRoles((current) => current.includes(roleId) ? current.filter((id) => id !== roleId) : [...current, roleId].slice(-4));
  }

  function updateSkill(skillId: string, status: "approved" | "rejected") {
    if (!active) return;
    persist(sessions.map((session) => session.id === active.id ? { ...session, skills: session.skills.map((skill) => skill.id === skillId ? { ...skill, status } : skill) } : session));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Swarm"
        title="Agent control room"
        meta="Role-based orchestration dengan shared context, memory connector, evaluation, dan skill yang selalu review-gated."
        actions={<Status tone="info">local-first · review required</Status>}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)]">
        <div className="space-y-6">
          <Panel title="Session baru" meta="stored in this browser">
            <div className="space-y-3">
              <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Nama session" />
              <Textarea value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="Contoh: Nilai campaign ini dan susun brief produksi yang aman." className="min-h-28" />
              <Button onClick={newSession} className="w-full"><Plus className="h-3.5 w-3.5" /> Buat session</Button>
            </div>
          </Panel>

          <Panel title="Provider" meta="OpenAI-compatible">
            <div className="space-y-3">
              <Input value={provider.baseUrl} onChange={(event) => setProvider((current) => ({ ...current, baseUrl: event.target.value }))} placeholder="https://api.example.com/v1 atau http://localhost:11434/v1" />
              <Input value={provider.model} onChange={(event) => setProvider((current) => ({ ...current, model: event.target.value }))} placeholder="model name" />
              <Input type="password" value={provider.apiKey} onChange={(event) => setProvider((current) => ({ ...current, apiKey: event.target.value }))} placeholder="API key (opsional untuk Ollama)" />
              <Button variant="outline" onClick={saveProvider} className="w-full"><LockKeyhole className="h-3.5 w-3.5" /> Simpan config lokal</Button>
              <p className="text-[11px] leading-relaxed text-muted-foreground">Base URL dan model non-secret disimpan di localStorage. API key hanya di sessionStorage browser dan tidak pernah masuk Convex.</p>
            </div>
          </Panel>

          <Panel title="Role selection" meta={`${roles.length}/4 calls per run`}>
            <div className="space-y-2">
              {AGENT_ROLES.map((role) => {
                const selected = roles.includes(role.id);
                return <button key={role.id} type="button" onClick={() => toggleRole(role.id)} className={`flex w-full items-start gap-3 border p-3 text-left transition-colors ${selected ? "border-primary/40 bg-primary/10" : "border-border hover:bg-secondary/40"}`}>
                  <span className={`mt-0.5 grid h-5 w-5 place-items-center border ${selected ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{selected && <Check className="h-3 w-3" />}</span>
                  <span><span className="block text-[13px] font-medium">{role.label}</span><span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">{role.focus}</span></span>
                </button>;
              })}
            </div>
            <Button onClick={run} disabled={busy || !active || roles.length === 0} className="mt-4 w-full"><Play className="h-3.5 w-3.5" /> {busy ? "Swarm berjalan…" : "Run swarm"}</Button>
            <Button variant="outline" onClick={evaluate} disabled={!active} className="mt-2 w-full"><ShieldCheck className="h-3.5 w-3.5" /> Evaluate session</Button>
            <Button variant={autoEvaluate ? "default" : "outline"} onClick={() => setAutoEvaluate((current) => !current)} disabled={!active} className="mt-2 w-full"><Clock3 className="h-3.5 w-3.5" /> {autoEvaluate ? "Cron evaluate aktif" : "Cron evaluate setiap 5m"}</Button>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Session" meta={active ? `${active.messages.length} messages · ${active.memories.length} memories` : "belum ada"}>
            {!active ? <p className="text-[13px] text-muted-foreground">Buat session untuk melihat transcript dan hasil swarm.</p> : <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-medium">{active.title}</p><p className="mt-1 text-[12px] text-muted-foreground">{active.goal}</p></div><Status tone={active.evaluation?.verdict === "ready_for_review" ? "good" : "neutral"}>{active.evaluation?.verdict ?? "not evaluated"}</Status></div>
              {notice && <p className="border border-primary/25 bg-primary/5 px-3 py-2 text-[12px] text-primary">{notice}</p>}
              <div className="max-h-[32rem] space-y-2 overflow-y-auto border-t border-border pt-3">
                {active.messages.length === 0 ? <p className="py-4 text-[12px] text-muted-foreground">Transcript akan muncul setelah run.</p> : active.messages.map((message) => <div key={message.id} className="border-l-2 border-primary/40 pl-3"><div className="flex items-center gap-2"><span className="font-mono text-[10px] uppercase tracking-[0.1em] text-primary">{message.role}</span><span className="text-[10px] text-muted-foreground">{new Date(message.createdAt).toLocaleTimeString()}</span></div><p className="mt-1 whitespace-pre-wrap text-[12px] leading-relaxed text-muted-foreground">{message.content}</p></div>)}
              </div>
            </div>}
          </Panel>

          {active && <Panel title="Shared memory" meta="ring buffer · 40 items">
            {active.memories.length === 0 ? <p className="text-[12px] text-muted-foreground">Memory akan dibuat setelah run pertama.</p> : <div className="space-y-2">{active.memories.slice(-6).map((memory) => <div key={memory.id} className="border border-border/70 bg-background/40 p-3"><div className="flex items-center justify-between gap-2"><span className="font-mono text-[10px] uppercase text-primary">{memory.source}</span><span className="font-mono text-[10px] text-muted-foreground">confidence {Math.round(memory.confidence * 100)}%</span></div><p className="mt-1 text-[12px] leading-relaxed">{memory.content}</p></div>)}</div>}
          </Panel>}

          {active && <Panel title="Skill evolution" meta="human approval required">
            {active.skills.length === 0 ? <p className="text-[12px] text-muted-foreground">Agent dapat mengajukan skill baru, tetapi tidak bisa mengaktifkannya sendiri.</p> : <div className="space-y-3">{active.skills.map((skill) => <div key={skill.id} className="border border-border/70 p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[11px] uppercase tracking-[0.1em] text-primary">{skill.name}</p><p className="mt-1 text-[12px] leading-relaxed">{skill.instructions}</p><p className="mt-2 text-[11px] text-muted-foreground">{skill.rationale}</p></div><Status tone={skill.status === "approved" ? "good" : skill.status === "rejected" ? "bad" : "warn"}>{skill.status}</Status></div>{skill.status === "review_required" && <div className="mt-3 flex gap-2"><Button size="sm" onClick={() => updateSkill(skill.id, "approved")}><Check className="h-3 w-3" /> Approve</Button><Button size="sm" variant="outline" onClick={() => updateSkill(skill.id, "rejected")}><X className="h-3 w-3" /> Reject</Button></div>}</div>)}</div>}
          </Panel>}

          <Panel title="Connector registry" meta="plugin contract">
            <div className="space-y-2">
              {CONNECTORS.map((connector) => <div key={connector.id} className="border border-border/70 p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[0.1em] text-primary">{connector.label}</p><p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{connector.description}</p></div><Status tone={connector.status === "available" ? "good" : "neutral"}>{connector.status}</Status></div><div className="mt-2 flex flex-wrap items-center gap-2"><span className="font-mono text-[10px] text-muted-foreground">{connector.capabilities.join(" · ")}</span>{connector.docsUrl && <a href={connector.docsUrl} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-[11px] text-primary hover:underline">docs <ExternalLink className="h-3 w-3" /></a>}</div></div>)}
            </div>
          </Panel>

          <Panel title="Safety boundary" className="border-amber-500/25">
            <div className="flex gap-3"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" /><ul className="space-y-2 text-[12px] leading-relaxed text-muted-foreground"><li>Agent tidak bisa menulis repo, memanggil shell, mengubah credential, atau memposting ke marketplace.</li><li>Memory dan transcript tersimpan lokal di browser; API key hanya sessionStorage.</li><li>Skill proposal, social publishing, dan tindakan consequential tetap membutuhkan approval manusia.</li><li>Browser cron hanya berjalan saat tab aktif; gunakan backend scheduler untuk produksi.</li></ul></div>
          </Panel>
        </div>
      </div>

      <Panel title="Riwayat session" meta={`${sessions.length} lokal`}>
        {sessions.length === 0 ? <p className="text-[12px] text-muted-foreground">Belum ada session.</p> : <div className="flex flex-wrap gap-2">{sessions.map((session) => <Button key={session.id} size="sm" variant={session.id === activeId ? "default" : "outline"} onClick={() => setActiveId(session.id)}><Clock3 className="h-3 w-3" /> {session.title}</Button>)}</div>}
      </Panel>
    </div>
  );
}
