import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader, EmptyState } from "@/components/shared";
import { cn } from "@/lib/utils";
import {
  Clapperboard,
  Zap,
  CheckCircle2,
  Circle,
  ExternalLink,
  FileText,
  ListChecks,
  Clock,
} from "lucide-react";

export default function Autopilot() {
  const joined = useQuery(api.queries.listCampaigns, { joined: true });
  const [selectedExtId, setSelectedExtId] = useState<string | null>(null);
  const createPlan = useMutation(api.brief.createPlan);
  const toggleTask = useMutation(api.brief.toggleTask);
  const setPlanStatus = useMutation(api.brief.setPlanStatus);

  // Active campaign defaults to the first joined campaign so the query always runs.
  const activeExtId = selectedExtId ?? joined?.[0]?.extId ?? null;
  const active = joined?.find((c) => c.extId === activeExtId) ?? null;
  const planData = useQuery(
    api.queries.getPlanForCampaign,
    activeExtId ? { campaignExtId: activeExtId } : "skip"
  );

  // Autopilot: susun rencana otomatis begitu campaign terpilih (sekali per campaign).
  const attempted = useRef<Set<string>>(new Set());
  const creating = useRef(false);
  useEffect(() => {
    if (!active || planData !== null || creating.current) return;
    if (attempted.current.has(active.extId)) return;
    attempted.current.add(active.extId);
    creating.current = true;
    createPlan({ campaignId: active._id })
      .catch(() => {})
      .finally(() => {
        creating.current = false;
      });
  }, [active, planData, createPlan]);

  const loading = joined === undefined;

  if (loading) {
    return <div className="h-64 animate-pulse rounded-xl bg-muted" />;
  }

  if (!joined || joined.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Brief Autopilot"
          subtitle="Ubah brief campaign jadi rencana produksi siap eksekusi."
          icon={Clapperboard}
        />
        <EmptyState
          icon={Clapperboard}
          title="Belum ada campaign diikuti"
          description="Tandai campaign sebagai diikuti di Scanner dulu, lalu buat rencana produksinya di sini."
          action={
            <Button asChild>
              <Link to="/app/scanner">Buka Scanner</Link>
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
        title="Brief Autopilot"
        subtitle="Rencana produksi otomatis dari brief campaign: hook, shotlist, caption, checklist kepatuhan."
        icon={Clapperboard}
      />

      {/* Campaign selector */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {joined.map((c) => (
          <button
            key={c._id}
            onClick={() => setSelectedExtId(c.extId)}
            data-testid="campaign-tab"
            className={cn(
              "shrink-0 rounded-lg border px-4 py-2 text-left transition-colors max-w-xs",
              activeExtId === c.extId
                ? "border-primary/50 bg-primary/10"
                : "hover:border-primary/30 bg-card"
            )}
          >
            <p className="text-sm font-medium truncate">{c.title}</p>
            <p className="text-xs text-muted-foreground truncate">
              {c.brand} • skor {c.score}
            </p>
          </button>
        ))}
      </div>

      {!extId ? null : !plan ? (
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      ) : plan === null ? (
        <EmptyState
          icon={Zap}
          title="Rencana belum dibuat"
          description={`Autopilot akan membaca brief "${active?.title ?? "campaign"}" lalu menyusun shotlist, hook, caption, dan checklist lengkap.`}
          action={
            <Button
              onClick={() => active && createPlan({ campaignId: active._id })}
              disabled={!active}
            >
              <Zap className="h-4 w-4" /> Susun Rencana Sekarang
            </Button>
          }
        />
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

  return (
    <div className="space-y-6">
      {/* Header card */}
      <Card className="border-glow">
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-lg">{plan.title}</CardTitle>
            <CardDescription className="mt-1">
              {plan.brand} • durasi target {plan.durasiMin}–{plan.durasiMax} detik
            </CardDescription>
            {(plan.targetAudience || plan.goal || plan.platforms?.length) && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {plan.targetAudience && (
                  <Badge variant="secondary" className="text-[10px]">
                    Audiens: {plan.targetAudience}
                  </Badge>
                )}
                {plan.goal && (
                  <Badge variant="secondary" className="text-[10px]">
                    Tujuan: {plan.goal}
                  </Badge>
                )}
                {(plan.platforms ?? []).map((p) => (
                  <Badge key={p} variant="outline" className="text-[10px] uppercase">
                    {p}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={plan.status === "done" ? "success" : plan.status === "draft" ? "warning" : "info"}
            >
              {plan.status.toUpperCase()}
            </Badge>
            <select
              value={plan.status}
              onChange={(e) => onSetStatus(e.target.value)}
              className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
            >
              <option value="draft">draft</option>
              <option value="ready">ready</option>
              <option value="shooting">shooting</option>
              <option value="done">done</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Progres produksi</span>
              <span className="font-mono">
                {doneCount}/{tasks.length} • skor kepatuhan {plan.complianceScore}
              </span>
            </div>
            <Progress value={progress} />
          </div>

          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <p className="text-[10px] font-mono uppercase text-primary mb-1">Hook rekomendasi (3 dtk pertama)</p>
            <p className="text-sm">{plan.hook}</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="shotlist">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="shotlist">Shotlist</TabsTrigger>
          <TabsTrigger value="narasi">Narasi & CTA</TabsTrigger>
          <TabsTrigger value="caption">Caption</TabsTrigger>
          <TabsTrigger value="materi">Materi ({plan.materi.length})</TabsTrigger>
          <TabsTrigger value="tasks">Checklist ({doneCount}/{tasks.length})</TabsTrigger>
          <TabsTrigger value="rules">Aturan</TabsTrigger>
        </TabsList>

        <TabsContent value="shotlist">
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {plan.shotlist.map((s, i) => (
                  <div key={i} className="flex gap-4 p-4">
                    <Badge variant="outline" className="font-mono shrink-0 w-fit">
                      {s.detik}
                    </Badge>
                    <p className="text-sm">{s.aksi}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="narasi">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Narasi wajib
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(plan.narasiPoints?.length ?? 0) > 0 ? (
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {plan.narasiPoints!.map((n, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-primary">▸</span>
                        <span>{n}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm whitespace-pre-line text-muted-foreground">{plan.narasi}</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" /> CTA akhir video
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium whitespace-pre-line">{plan.cta}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="caption">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Caption siap tempel</CardTitle>
              <CardDescription>Sudah termasuk hook, ajakan, dan semua hashtag wajib.</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap rounded-lg border bg-background/60 p-4 text-sm font-mono">
                {plan.caption}
              </pre>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {plan.hashtags.map((h) => (
                  <Badge key={h} variant="outline" className="font-mono text-[10px]">
                    #{h}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materi">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Materi & referensi</CardTitle>
              <CardDescription>Buka satu per satu, tandai di checklist setelah diunduh.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {plan.materi.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Detail materi tidak tersedia di snapshot — buka halaman campaign untuk daftar lengkap.
                </p>
              )}
              {plan.materi.map((m) => (
                <a
                  key={m.url}
                  href={m.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-lg border p-3 hover:border-primary/40 transition-colors"
                >
                  <span className="text-sm font-medium">{m.title}</span>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-primary" /> Checklist produksi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {tasks.map((t) => (
                <button
                  key={t._id}
                  onClick={() => onToggleTask(t._id)}
                  className="flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left hover:border-primary/40 transition-colors"
                >
                  {t.done ? (
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span className={cn("text-sm flex-1", t.done && "line-through text-muted-foreground")}>
                    {t.label}
                  </span>
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {t.category}
                  </Badge>
                </button>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Elemen wajib</CardTitle>
                  <CardDescription>Harus ada di video kamu.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {plan.elemenWajib.length === 0 && (
                      <li className="text-muted-foreground">Tidak ada data dari brief.</li>
                    )}
                    {plan.elemenWajib.map((e, i) => (
                      <li key={i} className="flex gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{e}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base text-emerald-300">Yang BOLEH dilakukan</CardTitle>
                  <CardDescription>Diambil langsung dari brief campaign.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {(plan.boleh ?? []).length === 0 && (
                      <li className="text-muted-foreground">Brief tidak mencantumkan poin khusus.</li>
                    )}
                    {(plan.boleh ?? []).map((b, i) => (
                      <li key={i} className="flex gap-2">
                        <Badge variant="success" className="mt-0.5 h-fit shrink-0 text-[10px]">
                          BOLEH
                        </Badge>
                        <span className="text-muted-foreground">{b}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card className="border-destructive/40">
              <CardHeader>
                <CardTitle className="text-base text-destructive">Yang DILARANG</CardTitle>
                <CardDescription>
                  Clip yang melanggar ini berisiko ditolak dan tidak dibayar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {(plan.dilarang ?? []).length === 0 && (
                    <li className="text-muted-foreground">
                      Brief tidak mencantumkan larangan khusus — tetap patuhi aturan platform.
                    </li>
                  )}
                  {(plan.dilarang ?? []).map((d, i) => (
                    <li key={i} className="flex gap-2">
                      <Badge variant="destructive" className="mt-0.5 h-fit shrink-0 text-[10px]">
                        JANGAN
                      </Badge>
                      <span className="text-muted-foreground">{d}</span>
                    </li>
                  ))}
                </ul>
                {(plan.dilarang ?? []).length === 0 && (
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {plan.doDonts.map((d, i) => (
                      <li key={i}>• {d}</li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Referensi brief</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {plan.judulFile && (
                  <p>
                    <span className="text-muted-foreground">Judul file: </span>
                    <span className="font-medium">{plan.judulFile}</span>
                  </p>
                )}
                {plan.instruksiBrief && (
                  <p>
                    <span className="text-muted-foreground">Instruksi: </span>
                    {plan.instruksiBrief}
                  </p>
                )}
                {plan.captionWajib && (
                  <p>
                    <span className="text-muted-foreground">Caption wajib: </span>
                    {plan.captionWajib}
                  </p>
                )}
                <Button asChild variant="outline" size="sm" className="mt-2">
                  <a
                    href={`https://konten.com/clipper-campaigns/${plan.campaignSlug}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Brief lengkap di konten.com <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
