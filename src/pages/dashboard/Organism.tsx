import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  EmptyState,
  MetricStrip,
  PageHeader,
  Panel,
  PanelLoading,
  Score,
  Status,
  TableRow,
  TableShell,
} from "@/components/shared";
import { timeAgo } from "@/lib/utils";
import {
  EMPTY_PROVIDER_CONFIG,
  PROVIDER_API_KEY_SESSION_KEY,
  PROVIDER_SETTINGS_KEY,
  validateProviderConfig,
  type ProviderConfig,
} from "@/lib/providerConfig";
import { Brain, Check, Eye, EyeOff, FlaskConical, KeyRound, Pause, Play, Plus, ShieldAlert } from "lucide-react";

const GOAL_COLS = "minmax(0,1fr) 5rem 5rem 5rem 6rem";
const CAP_COLS = "minmax(0,1fr) 7rem 5rem 5rem";
const EXP_COLS = "minmax(0,1fr) 6rem 6rem 7rem";

export default function Organism() {
  const organism = useQuery(api.queries.getOrganism, {});
  const autonomyReviews = useQuery(api.queries.getAutonomyReviews, {});
  const autonomySummary = useQuery(api.queries.getAutonomySummary, {});
  const initialize = useMutation(api.queries.initializeOrganism);
  const setMode = useMutation(api.queries.setOrganismMode);
  const addGoal = useMutation(api.queries.createOrganismGoal);
  const evaluate = useMutation(api.queries.evaluateOrganismExperiment);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalRationale, setGoalRationale] = useState("");
  const [notice, setNotice] = useState("");
  const [provider, setProvider] = useState<ProviderConfig>(EMPTY_PROVIDER_CONFIG);
  const [showApiKey, setShowApiKey] = useState(false);
  const [providerNotice, setProviderNotice] = useState("");

  useEffect(() => {
    if (organism === null) void initialize({});
    try {
      const stored = localStorage.getItem(PROVIDER_SETTINGS_KEY);
      const apiKey = sessionStorage.getItem(PROVIDER_API_KEY_SESSION_KEY) ?? "";
      if (stored) {
        const parsed = JSON.parse(stored) as { baseUrl?: unknown; model?: unknown };
        setProvider({
          baseUrl: typeof parsed.baseUrl === "string" ? parsed.baseUrl : "",
          model: typeof parsed.model === "string" ? parsed.model : "",
          apiKey,
        });
      } else if (apiKey) {
        setProvider((current) => ({ ...current, apiKey }));
      }
    } catch {
      setProviderNotice("Browser storage tidak tersedia; konfigurasi hanya berlaku selama halaman terbuka.");
    }
  }, [initialize, organism]);

  if (organism === undefined) return <PanelLoading />;
  if (organism === null) {
    return (
      <EmptyState
        title="Kernel organism belum aktif"
        description="Aktifkan world model, dynamic goals, memory, dan experiment ledger yang terisolasi dari tool eksternal."
        action={<Button size="sm" onClick={() => void initialize({})}>Aktifkan kernel</Button>}
      />
    );
  }

  const { profile, goals, capabilities, experiments, memories, events } = organism;
  const reviews = autonomyReviews ?? [];
  const activeGoals = goals.filter((goal) => goal.status === "candidate" || goal.status === "selected");
  const nextGoal = activeGoals.find((goal) => goal.status === "selected") ?? activeGoals[0];
  const budgetPct = Math.min(100, Math.round((profile.actionsUsed / Math.max(1, profile.dailyActionBudget)) * 100));

  function saveProviderConfig() {
    const validation = validateProviderConfig(provider);
    if (!validation.ok) {
      setProviderNotice(validation.error);
      return;
    }
    try {
      localStorage.setItem(
        PROVIDER_SETTINGS_KEY,
        JSON.stringify({ baseUrl: validation.value.baseUrl, model: validation.value.model })
      );
      if (validation.value.apiKey) {
        sessionStorage.setItem(PROVIDER_API_KEY_SESSION_KEY, validation.value.apiKey);
      } else {
        sessionStorage.removeItem(PROVIDER_API_KEY_SESSION_KEY);
      }
      setProvider(validation.value);
      setProviderNotice("Konfigurasi tersimpan lokal di browser. API key tidak dikirim ke Convex.");
    } catch {
      setProviderNotice("Gagal menyimpan konfigurasi lokal.");
    }
  }

  function clearProviderConfig() {
    try {
      localStorage.removeItem(PROVIDER_SETTINGS_KEY);
      sessionStorage.removeItem(PROVIDER_API_KEY_SESSION_KEY);
      setProvider(EMPTY_PROVIDER_CONFIG);
      setProviderNotice("Konfigurasi provider lokal sudah dihapus.");
    } catch {
      setProviderNotice("Gagal menghapus konfigurasi lokal.");
    }
  }

  async function handleAddGoal() {
    if (goalTitle.trim().length < 3) {
      setNotice("Judul goal minimal 3 karakter.");
      return;
    }
    try {
      await addGoal({
        title: goalTitle,
        rationale: goalRationale || "Goal dicatat oleh operator untuk dianalisis kernel.",
        impact: 0.6,
        confidence: 0.5,
        learning: 0.7,
        cost: 0.3,
        risk: 0.2,
        feasibility: 0.6,
      });
      setGoalTitle("");
      setGoalRationale("");
      setNotice("Goal baru masuk kandidat; belum ada tool yang dijalankan.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Gagal menyimpan goal.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Organism kernel"
        title="Runtime yang bisaasional memilih arah"
        meta="Fondasi untuk self-directed autonomy: identitas tetap, world model terukur, goal dinamis, memory, dan eksperimen yang harus melewati evaluasi. Tidak ada credential, model, atau tool eksternal yang dijalankan dari halaman ini."
        actions={
          <div className="flex gap-2">
            {profile.mode === "paused" ? (
              <Button variant="outline" size="sm" onClick={() => void setMode({ mode: "observe" })}>
                <Play className="h-3.5 w-3.5" /> Observe
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => void setMode({ mode: "paused" })}>
                <Pause className="h-3.5 w-3.5" /> Pause
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => void setMode({ mode: "review" })}>
              <ShieldAlert className="h-3.5 w-3.5" /> Review
            </Button>
          </div>
        }
      />

      <MetricStrip
        items={[
          { label: "Mode", value: profile.mode, hint: "bounded autonomy" },
          { label: "Goal aktif", value: String(activeGoals.length), hint: `${goals.length} total tercatat` },
          { label: "Capability", value: String(capabilities.length), hint: "trust harus eksplisit" },
          { label: "Memory", value: String(memories.length), hint: "lesson & decision" },
          { label: "Action budget", value: `${profile.actionsUsed}/${profile.dailyActionBudget}`, hint: `${budgetPct}% terpakai` },
        ]}
      />

      <Panel
        title="Campaign autonomy queue"
        meta={`${reviews.length} campaign dievaluasi • ${reviews.filter((review) => review.publishHandoff.status === "review_required").length} handoff perlu review`}
        flush
      >
        {reviews.length === 0 ? (
          <p className="px-4 py-6 text-[13px] text-muted-foreground">Belum ada campaign untuk dievaluasi.</p>
        ) : (
          <div className="divide-y divide-border/60">
            {reviews.slice(0, 12).map((review) => (
              <div key={review.campaignExtId} className="grid gap-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_7rem_8rem_10rem] md:items-center">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium">{review.campaignExtId}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{review.reason}</p>
                </div>
                <Status tone={review.lifecycle === "earning" ? "good" : review.lifecycle === "needs_attention" ? "warn" : "info"}>{review.lifecycle}</Status>
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">{review.decision}</span>
                <Status tone={review.publishHandoff.status === "review_required" ? "info" : "neutral"}>{review.publishHandoff.status}</Status>
              </div>
            ))}
          </div>
        )}
        {autonomySummary?.coverage ? (
          <div className="border-t border-border/60 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            coverage: {autonomySummary.detailFetched} detail brief • {autonomySummary.coverage && typeof autonomySummary.coverage === "object" ? Object.keys(autonomySummary.coverage).length : 0} signal groups
          </div>
        ) : null}
      </Panel>

      {notice && (
        <div className="border border-primary/30 bg-primary/5 px-4 py-3 text-[13px] text-foreground">
          {notice}
        </div>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Panel
          title="Dynamic goal queue"
          meta={nextGoal ? `next: ${nextGoal.title}` : "do nothing adalah keputusan valid"}
          flush
        >
          {goals.length === 0 ? (
            <p className="px-4 py-6 text-[13px] text-muted-foreground">Belum ada goal. Tambahkan sinyal atau masalah yang ingin dipelajari.</p>
          ) : (
            <TableShell cols={GOAL_COLS} minWidth="52rem" head={["goal", "impact", "learn", "risk", "status"]}>
              {goals.slice(0, 12).map((goal) => (
                <TableRow key={goal._id} cols={GOAL_COLS}>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{goal.title}</span>
                    <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{goal.rationale}</span>
                  </span>
                  <Score value={Math.round(goal.impact * 100)} meterClassName="w-10" />
                  <span className="font-mono text-[12px] tabular-nums text-muted-foreground">{Math.round(goal.learning * 100)}</span>
                  <span className="font-mono text-[12px] tabular-nums text-muted-foreground">{Math.round(goal.risk * 100)}</span>
                  <Status tone={goal.status === "selected" ? "info" : goal.status === "rejected" ? "bad" : "neutral"}>
                    {goal.status}
                  </Status>
                </TableRow>
              ))}
            </TableShell>
          )}
        </Panel>

        <Panel title="Identity constitution" meta="immutable-ish">
          <ul className="space-y-3">
            {profile.constitution.map((rule) => (
              <li key={rule} className="flex gap-2 text-[13px] leading-relaxed text-muted-foreground">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                {rule}
              </li>
            ))}
          </ul>
          <div className="mt-5 border-t border-border/60 pt-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">runtime boundary</p>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              Scheduler hanya memilih kandidat untuk review. Reality, evidence, unknowns, dan
              capability gaps membentuk keputusan. Tidak ada shell, browser, filesystem, model provider,
              spending, atau external publish dalam scope kernel ini.
            </p>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
        <Panel title="Capability registry" meta="gaps stay visible" flush>
          <TableShell cols={CAP_COLS} minWidth="40rem" head={["capability", "jenis", "trust", "status"]}>
            {capabilities.map((capability) => (
              <TableRow key={capability._id} cols={CAP_COLS}>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{capability.name}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{capability.notes ?? capability.source}</span>
                </span>
                <span className="truncate font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">{capability.kind}</span>
                <Score value={Math.round(capability.trust * 100)} meterClassName="w-9" />
                <Status tone={capability.status === "available" ? "good" : capability.status === "quarantined" ? "warn" : "bad"}>
                  {capability.status}
                </Status>
              </TableRow>
            ))}
          </TableShell>
        </Panel>

        <Panel title="Experiment ledger" meta="measure before adopt" flush>
          {experiments.length === 0 ? (
            <p className="px-4 py-6 text-[13px] text-muted-foreground">Belum ada experiment.</p>
          ) : (
            <TableShell cols={EXP_COLS} minWidth="40rem" head={["experiment", "score", "risk", "action"]}>
              {experiments.slice(0, 8).map((experiment) => (
                <TableRow key={experiment._id} cols={EXP_COLS}>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{experiment.title}</span>
                    <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{experiment.hypothesis}</span>
                  </span>
                  <span className="font-mono text-[12px] tabular-nums">{experiment.score ? experiment.score.toFixed(2) : "—"}</span>
                  <span className="font-mono text-[12px] tabular-nums">{Math.round(experiment.risk * 100)}</span>
                  {experiment.status === "proposed" || experiment.status === "running" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[11px]"
                      onClick={() => void evaluate({ experimentId: experiment._id, score: 0.7, evidence: "Manual review from the bounded kernel console." })}
                    >
                      Evaluate
                    </Button>
                  ) : (
                    <Status tone={experiment.status === "adopted" ? "good" : "bad"}>{experiment.status}</Status>
                  )}
                </TableRow>
              ))}
            </TableShell>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel title="Catat goal baru" meta="tidak langsung dieksekusi">
          <div className="space-y-3">
            <Input value={goalTitle} onChange={(event) => setGoalTitle(event.target.value)} placeholder="Contoh: validasi variasi hook brief" />
            <textarea
              value={goalRationale}
              onChange={(event) => setGoalRationale(event.target.value)}
              placeholder="Mengapa goal ini penting dan bagaimana kita akan mengukurnya?"
              className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-[13px] outline-none placeholder:text-muted-foreground/60 focus:ring-1 focus:ring-primary"
            />
            <Button size="sm" onClick={() => void handleAddGoal()}>
              <Plus className="h-3.5 w-3.5" /> Simpan kandidat
            </Button>
          </div>
        </Panel>

        <Panel title="Memory & reflection" meta={`${events.length} event terbaru`} flush>
          <div className="divide-y divide-border/60">
            {memories.slice(0, 5).map((memory) => (
              <div key={memory._id} className="flex gap-3 px-4 py-3">
                <Brain className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-[13px] leading-relaxed">{memory.content}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                    {memory.kind} · confidence {Math.round(memory.confidence * 100)} · {timeAgo(memory.createdAt)}
                  </p>
                </div>
              </div>
            ))}
            {events.slice(0, 3).map((event) => (
              <div key={event._id} className="flex gap-3 px-4 py-3">
                <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-[13px] leading-relaxed">{event.message}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                    {event.type} · {timeAgo(event.at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Optional provider config" meta="local browser only">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2">
          <label className="space-y-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Base URL</span>
            <Input
              value={provider.baseUrl}
              onChange={(event) => setProvider((current) => ({ ...current, baseUrl: event.target.value }))}
              placeholder="http://localhost:11434/v1"
              inputMode="url"
            />
          </label>
          <label className="space-y-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Model</span>
            <Input
              value={provider.model}
              onChange={(event) => setProvider((current) => ({ ...current, model: event.target.value }))}
              placeholder="qwen2.5:14b"
            />
          </label>
        </div>
        <label className="mt-3 block space-y-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">API key · optional untuk model lokal</span>
          <div className="relative">
            <Input
              value={provider.apiKey}
              onChange={(event) => setProvider((current) => ({ ...current, apiKey: event.target.value }))}
              type={showApiKey ? "text" : "password"}
              placeholder="Jangan tempel key yang sudah dipakai di repository"
              autoComplete="off"
              className="pr-10"
            />
            <button
              type="button"
              aria-label={showApiKey ? "Sembunyikan API key" : "Tampilkan API key"}
              onClick={() => setShowApiKey((current) => !current)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showApiKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
        </label>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={saveProviderConfig}>
            <KeyRound className="h-3.5 w-3.5" /> Validasi & simpan lokal
          </Button>
          <Button variant="outline" size="sm" onClick={clearProviderConfig}>
            Hapus konfigurasi
          </Button>
          <Status tone={provider.baseUrl && provider.model ? "good" : "neutral"}>
            {provider.baseUrl && provider.model ? "configured locally" : "not configured"}
          </Status>
        </div>
        {providerNotice && (
          <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">{providerNotice}</p>
        )}
        <p className="mt-3 border-t border-border/60 pt-3 text-[12px] leading-relaxed text-muted-foreground">
          Base URL dan model disimpan di localStorage. API key hanya disimpan di sessionStorage browser
          ini dan tidak pernah dikirim ke Convex. Kernel belum memanggil provider ini secara otomatis;
          adapter eksternal tetap membutuhkan explicit opt-in, quota, dan review.
        </p>
      </Panel>

      <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground/60">
        kernel policy: observe → choose → review → measure → remember · no unrestricted self-modification
      </p>
    </div>
  );
}
