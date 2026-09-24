import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Bullets,
  CopyButton,
  EmptyState,
  Meter,
  MonoLabel,
  PageHeader,
  Panel,
  PanelLoading,
  Status,
  TableRow,
  TableShell,
  toneForScore,
} from "@/components/shared";
import { cn } from "@/lib/utils";
import { buildAutoShortsManifest } from "@/lib/autoshorts";
import { Check, ExternalLink, Play, Zap } from "lucide-react";

const MATERI_COLS = "minmax(0,1fr) 7rem 5rem";

function planErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message.replace("Uncaught Error: ", "")
    : "Rencana belum bisa disusun. Coba lagi.";
}

export default function Autopilot() {
  const joined = useQuery(api.queries.listCampaigns, { joined: true });
  const [selectedExtId, setSelectedExtId] = useState<string | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const createPlan = useMutation(api.brief.createPlan);
  const toggleTask = useMutation(api.brief.toggleTask);
  const setPlanStatus = useMutation(api.brief.setPlanStatus);

  const activeExtId = selectedExtId ?? joined?.[0]?.extId ?? null;
  const active = joined?.find((c) => c.extId === activeExtId) ?? null;
  const planData = useQuery(
    api.queries.getPlanForCampaign,
    activeExtId ? { campaignExtId: activeExtId } : "skip"
  );

  // Autopilot: susun rencana otomatis begitu campaign terpilih (sekali per campaign).
  const attempted = useRef<Set<string>>(new Set());
  const creatingRef = useRef(false);
  useEffect(() => {
    if (!active || planData !== null || creatingRef.current) return;
    if (attempted.current.has(active.extId)) return;
    attempted.current.add(active.extId);
    creatingRef.current = true;
    setCreating(true);
    setPlanError(null);
    createPlan({ campaignId: active._id })
      .catch((error) => {
        setPlanError(planErrorMessage(error));
      })
      .finally(() => {
        creatingRef.current = false;
        setCreating(false);
      });
  }, [active, planData, createPlan]);

  async function handleManualCreate() {
    if (!active || creating) return;
    setCreating(true);
    setPlanError(null);
    try {
      await createPlan({ campaignId: active._id });
    } catch (error) {
      setPlanError(planErrorMessage(error));
    } finally {
      setCreating(false);
    }
  }

  if (joined === undefined) {
    return (
      <div className="space-y-6">
        <div className="h-16 border-b border-border" />
        <PanelLoading />
      </div>
    );
  }

  if (joined.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Autopilot"
          title="Rencana produksi"
          meta="Brief campaign dipecah jadi shotlist, hook, caption, dan checklist kepatuhan."
        />
        <EmptyState
          title="Belum ada campaign diikuti"
          description="Tandai satu campaign sebagai diikuti di Scanner. Autopilot lalu membaca brief-nya dan menyusun rencana produksi siap eksekusi."
          action={
            <Button asChild size="sm">
              <Link to="/app/scanner">Buka scanner</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const extId = active?.extId ?? null;
  const plan = planData;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Autopilot"
        title="Rencana produksi"
        meta={`${joined.length} campaign diikuti • rencana dibuat otomatis dari brief asli konten.com`}
        actions={
          active && (
            <Button asChild variant="ghost" size="sm">
              <Link to={`/app/campaign/${active._id}`}>
                Brief lengkap <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </Button>
          )
        }
      />

      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {joined.map((c) => (
          <button
            key={c._id}
            onClick={() => setSelectedExtId(c.extId)}
            data-testid="campaign-tab"
            className={cn(
              "shrink-0 rounded-md border px-3 py-1.5 text-left transition-colors",
              activeExtId === c.extId
                ? "border-primary/40 bg-primary/10"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="block max-w-56 truncate text-[12px]">{c.title}</span>
            <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/70">
              {c.brand} • skor {c.score}
            </span>
          </button>
        ))}
      </div>

      {!extId ? null : !plan ? (
        <PanelLoading />
      ) : plan === null ? (
        <div className="space-y-3">
          {planError && (
            <div role="alert" className="border border-red-300/40 bg-red-300/5 px-4 py-3 text-[13px] text-red-200">
              {planError}
            </div>
          )}
          <EmptyState
            title="Rencana belum dibuat"
            description={`Autopilot akan membaca brief "${active?.title ?? "campaign"}" lalu menyusun shotlist, hook, caption, dan checklist kepatuhan.`}
            action={
              <Button onClick={handleManualCreate} disabled={!active || creating} size="sm">
                <Zap className="h-3.5 w-3.5" /> {creating ? "Menyusun…" : "Susun rencana sekarang"}
              </Button>
            }
          />
        </div>
      ) : (
        <PlanView
          data={plan}
          onToggleTask={(taskId) => toggleTask({ taskId })}
          onSetStatus={(status) => setPlanStatus({ planId: plan.plan._id, status })}
        />
      )}
    </div>
  );
}

type PlanData = {
  plan: {
    _id: string;
    title: string;
    brand: string;
    hook: string;
    narasi: string;
    cta: string;
    caption: string;
    hashtags: string[];
    durasiMin: number;
    durasiMax: number;
    materi: { title: string; url: string }[];
    elemenWajib: string[];
    doDonts: string[];
    boleh?: string[];
    dilarang?: string[];
    narasiPoints?: string[];
    captionWajib?: string;
    targetAudience?: string;
    goal?: string;
    instruksiBrief?: string;
    judulFile?: string;
    platforms?: string[];
    shotlist: { detik: string; aksi: string }[];
    complianceScore: number;
    status: string;
    campaignSlug: string;
  };
  tasks: { _id: Id<"planTasks">; label: string; category: string; done: boolean; order: number }[];
};

function PlanView({
  data,
  onToggleTask,
  onSetStatus,
}: {
  data: PlanData;
  onToggleTask: (taskId: Id<"planTasks">) => void;
  onSetStatus: (status: string) => void;
}) {
  const { plan, tasks } = data;
  const doneCount = tasks.filter((t) => t.done).length;
  const progress = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;

  const groups = useMemo(() => {
    const map = new Map<string, typeof tasks>();
    for (const t of tasks) {
      const list = map.get(t.category) ?? [];
      list.push(t);
      map.set(t.category, list);
    }
    return [...map.entries()];
  }, [tasks]);

  return (
    <div className="space-y-6">
      <Panel
        title="Rencana aktif"
        meta={`${plan.durasiMin}–${plan.durasiMax} detik`}
        actions={
          <label className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              status
            </span>
            <select
              value={plan.status}
              onChange={(e) => onSetStatus(e.target.value)}
              className="h-7 rounded-md border border-input bg-transparent px-2 font-mono text-[11px] uppercase tracking-[0.1em] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="draft">draft</option>
              <option value="ready">ready</option>
              <option value="shooting">shooting</option>
              <option value="done">done</option>
            </select>
          </label>
        }
      >
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold tracking-tight">{plan.title}</h3>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              {plan.brand}
              {plan.platforms?.length ? ` • ${plan.platforms.join("/")}` : ""}
              {plan.targetAudience ? ` • audiens: ${plan.targetAudience}` : ""}
              {plan.goal ? ` • tujuan: ${plan.goal}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <MonoLabel>kepatuhan</MonoLabel>
              <p
                className={cn(
                  "mt-1 font-mono text-lg font-semibold tabular-nums",
                  toneForScore(plan.complianceScore) === "good"
                    ? "text-emerald-300"
                    : toneForScore(plan.complianceScore) === "warn"
                      ? "text-amber-300"
                      : "text-red-300"
                )}
              >
                {plan.complianceScore}
              </p>
            </div>
            <div className="w-40">
              <MonoLabel>progres {progress}%</MonoLabel>
              <Meter value={progress} tone={progress === 100 ? "good" : "primary"} className="mt-2" />
              <p className="mt-1.5 font-mono text-[10px] text-muted-foreground">
                {doneCount}/{tasks.length} tugas
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 border-l-2 border-primary/60 pl-3.5">
          <MonoLabel className="text-primary">hook 3 detik pertama</MonoLabel>
          <p className="mt-1 text-[13px] leading-relaxed">{plan.hook}</p>
        </div>
        <AutoShortsHandoff plan={plan} />
      </Panel>

      <Tabs defaultValue="shotlist">
        <TabsList className="no-scrollbar h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b border-border bg-transparent p-0">
          {[
            { v: "shotlist", label: `Shotlist ${plan.shotlist.length}` },
            { v: "narasi", label: "Narasi & CTA" },
            { v: "caption", label: "Caption" },
            { v: "materi", label: `Materi ${plan.materi.length}` },
            { v: "tasks", label: `Checklist ${doneCount}/${tasks.length}` },
            { v: "rules", label: "Aturan" },
          ].map((t) => (
            <TabsTrigger
              key={t.v}
              value={t.v}
              className="rounded-none border-b-2 border-transparent bg-transparent px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="shotlist">
          <Panel
            title="Shotlist"
            meta={`total ${plan.durasiMax} detik`}
            flush
          >
            {plan.shotlist.length === 0 ? (
              <p className="px-4 py-5 text-[13px] text-muted-foreground">
                Brief ini tidak mencantumkan struktur shot.
              </p>
            ) : (
              <ol className="divide-y divide-border/60">
                {plan.shotlist.map((s, i) => (
                  <li
                    key={i}
                    className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-start gap-4 px-4 py-3"
                  >
                    <span className="flex items-center gap-2 font-mono text-[11px] tabular-nums text-muted-foreground">
                      <Play className="h-3 w-3 text-primary/70" />
                      {s.detik}
                    </span>
                    <span className="text-[13px] leading-relaxed">{s.aksi}</span>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="narasi">
          <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
            <Panel title="Narasi wajib" meta="aturan brief">
              {(plan.narasiPoints?.length ?? 0) > 0 ? (
                <Bullets items={plan.narasiPoints!} ordered />
              ) : (
                <p className="whitespace-pre-line text-[13px] leading-relaxed text-muted-foreground">
                  {plan.narasi}
                </p>
              )}
            </Panel>
            <Panel title="CTA akhir video" meta="harus terlihat">
              <p className="text-[13px] leading-relaxed text-foreground">{plan.cta}</p>
              {plan.captionWajib && (
                <div className="mt-4 border-t border-border pt-4">
                  <MonoLabel>caption wajib dari brand</MonoLabel>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                    {plan.captionWajib}
                  </p>
                </div>
              )}
            </Panel>
          </div>
        </TabsContent>

        <TabsContent value="caption">
          <Panel
            title="Caption siap tempel"
            meta="hook + ajakan + hashtag"
            actions={<CopyButton text={plan.caption} />}
          >
            <pre className="whitespace-pre-wrap rounded-md border border-border bg-background/50 p-3.5 font-mono text-[12px] leading-relaxed">
              {plan.caption}
            </pre>
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
              {plan.hashtags.map((h) => (
                <span key={h} className="font-mono text-[11px] text-primary">
                  #{h}
                </span>
              ))}
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="materi">
          <Panel
            title="Materi & referensi"
            meta={`${plan.materi.length} file dari brief`}
            flush
          >
            {plan.materi.length === 0 ? (
              <p className="px-4 py-5 text-[13px] text-muted-foreground">
                Snapshot ini tidak menyertakan daftar materi. Buka halaman campaign untuk brief
                lengkap.
              </p>
            ) : (
              <TableShell cols={MATERI_COLS} minWidth="30rem" head={["materi", "sumber", "aksi"]}>
                {plan.materi.map((m) => (
                  <TableRow key={m.url} cols={MATERI_COLS}>
                    <span className="truncate text-[13px]">{m.title}</span>
                    <span className="truncate font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground/70">
                      {host(m.url)}
                    </span>
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-primary"
                    >
                      buka <ExternalLink className="h-3 w-3" />
                    </a>
                  </TableRow>
                ))}
              </TableShell>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="tasks">
          <Panel
            title="Checklist produksi"
            meta={`${doneCount}/${tasks.length} selesai`}
            actions={
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                {progress}%
              </span>
            }
          >
            {groups.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">Belum ada tugas.</p>
            ) : (
              <div className="space-y-5">
                {groups.map(([category, list]) => (
                  <div key={category}>
                    <MonoLabel>
                      {category} • {list.filter((t) => t.done).length}/{list.length}
                    </MonoLabel>
                    <div className="mt-2 divide-y divide-border/60 border-y border-border/60">
                      {list.map((t) => (
                        <button
                          key={t._id}
                          onClick={() => onToggleTask(t._id)}
                          className="flex w-full items-start gap-3 py-2.5 text-left transition-colors hover:bg-secondary/30"
                        >
                          <span
                            className={cn(
                              "mt-0.5 grid h-3.5 w-3.5 shrink-0 place-items-center rounded-sm border",
                              t.done ? "border-primary bg-primary/20" : "border-border"
                            )}
                          >
                            {t.done && <Check className="h-2.5 w-2.5 text-primary" />}
                          </span>
                          <span
                            className={cn(
                              "text-[13px] leading-relaxed",
                              t.done ? "text-muted-foreground/60 line-through" : "text-muted-foreground"
                            )}
                          >
                            {t.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="rules">
          <div className="space-y-6">
            <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
              <Panel title="Elemen wajib" meta="harus ada di video">
                <Bullets items={plan.elemenWajib} ordered empty="Brief tidak mencantumkan elemen wajib." />
              </Panel>
              <Panel title="Boleh dilakukan" meta="dari brief brand">
                <Bullets items={plan.boleh ?? []} tone="good" empty="Brief tidak mencantumkan poin khusus." />
              </Panel>
            </div>

            <Panel
              title="Dilarang"
              meta="clip yang melanggar berisiko ditolak & tidak dibayar"
              className="border-red-500/25"
            >
              {(plan.dilarang ?? []).length > 0 ? (
                <Bullets items={plan.dilarang ?? []} tone="bad" />
              ) : plan.doDonts.length > 0 ? (
                <Bullets items={plan.doDonts} tone="bad" />
              ) : (
                <p className="text-[13px] text-muted-foreground">
                  Brief tidak mencantumkan larangan khusus — tetap patuhi aturan platform.
                </p>
              )}
            </Panel>

            <Panel title="Referensi brief">
              <div className="grid gap-4 sm:grid-cols-2">
                {plan.judulFile && (
                  <div>
                    <MonoLabel>judul file</MonoLabel>
                    <p className="mt-1.5 text-[13px] text-muted-foreground">{plan.judulFile}</p>
                  </div>
                )}
                <div>
                  <MonoLabel>status rencana</MonoLabel>
                  <p className="mt-1.5">
                    <Status tone={plan.status === "done" ? "good" : "info"}>{plan.status}</Status>
                  </p>
                </div>
                {plan.instruksiBrief && (
                  <div className="sm:col-span-2">
                    <MonoLabel>instruksi</MonoLabel>
                    <p className="mt-1.5 whitespace-pre-line text-[13px] leading-relaxed text-muted-foreground">
                      {plan.instruksiBrief}
                    </p>
                  </div>
                )}
              </div>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <a
                  href={`https://konten.com/clipper-campaigns/${plan.campaignSlug}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Brief lengkap di konten.com <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            </Panel>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AutoShortsHandoff({ plan }: { plan: PlanData["plan"] }) {
  const manifest = buildAutoShortsManifest({
    title: plan.title,
    brand: plan.brand,
    campaignSlug: plan.campaignSlug,
    hook: plan.hook,
    durasiMin: plan.durasiMin,
    durasiMax: plan.durasiMax,
    materi: plan.materi,
    narasi: plan.narasi,
    cta: plan.cta,
    platforms: plan.platforms,
  });
  const [copied, setCopied] = useState(false);

  async function copyManifest() {
    await navigator.clipboard.writeText(JSON.stringify(manifest, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="mt-5 border-t border-border/60 pt-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <MonoLabel>AutoShorts handoff</MonoLabel>
          <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
            {manifest.candidates.length} kandidat 9:16 siap specification. Manifest ini hanya
            handing off pekerjaan lokal; tidak menjalankan renderer atau memposting video.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void copyManifest()}>
          {copied ? "Tersalin" : "Copy manifest JSON"}
        </Button>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {manifest.candidates.map((candidate) => (
          <div key={candidate.id} className="border border-border/70 bg-background/40 p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-primary">
              {candidate.label}
            </p>
            <p className="mt-1 font-mono text-[12px] tabular-nums text-muted-foreground">
              {candidate.startSec}s–{candidate.endSec}s • {candidate.durationSec}s
            </p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
              {candidate.hook}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function host(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "konten.com";
  }
}
