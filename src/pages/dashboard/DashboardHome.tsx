import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  MetricStrip,
  Meter,
  PageHeader,
  Panel,
  PanelLoading,
  Score,
  Status,
  TableRow,
  TableShell,
  KeyValue,
  KeyValueList,
  toneForScore,
} from "@/components/shared";
import { formatRupiah, formatNumber, timeAgo } from "@/lib/utils";
import { ArrowUpRight, Cable, Radar } from "lucide-react";

const OPPORTUNITY_COLS = "minmax(0,1fr) 5rem 7.5rem 4.5rem 5.5rem";
const LOG_COLS = "4.5rem 5.5rem minmax(0,1fr) 4.5rem";

export default function DashboardHome() {
  const snapshot = useQuery(api.queries.getSnapshot, {});
  const campaigns = useQuery(api.queries.listCampaigns, {});
  const logs = useQuery(api.queries.getSyncLogs, {});

  const loading = snapshot === undefined || campaigns === undefined;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-16 border-b border-border" />
        <div className="h-24 rounded-lg border border-border bg-card/40" />
        <PanelLoading />
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Ringkasan"
          title="Workspace kosong"
          meta="Belum ada data konten.com yang tersinkron ke workspace ini."
        />
        <EmptyState
          title="Hubungkan sumber data"
          description="Bridge menarik campaign, earnings, dan analitik dari sesi konten.com milikmu sendiri. Jalankan sync lokal untuk mengisi workspace dengan data nyata."
          action={
            <>
              <Button asChild size="sm">
                <Link to="/app/bridge">
                  <Cable className="h-3.5 w-3.5" /> Buka Bridge
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/app/scanner">Lihat scanner</Link>
              </Button>
            </>
          }
        />
      </div>
    );
  }

  const s = (snapshot.earningsSummary ?? {}) as Record<string, number>;
  const settings = (snapshot.featureFlags as { settings?: Record<string, unknown> } | undefined)
    ?.settings;
  const minWithdraw = Number(settings?.min_withdrawal_idr ?? 50000);
  const pending = (s.onHold ?? 0) + (s.sedangDiproses ?? 0);

  const open = (campaigns ?? []).filter((c) => !c.joined);
  const joined = (campaigns ?? []).filter((c) => c.joined);
  const lastLog = logs?.[0];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ringkasan"
        title="Kondisi workspace"
        meta={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>
              {formatNumber(campaigns?.length)} campaign terpantau • {formatNumber(joined.length)}{" "}
              diikuti
            </span>
            <Status tone={snapshot.source === "bridge" ? "good" : "info"}>
              sumber {snapshot.source}
            </Status>
          </span>
        }
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link to="/app/bridge">
                <Cable className="h-3.5 w-3.5" /> Bridge
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/app/scanner">
                <Radar className="h-3.5 w-3.5" /> Buka scanner
              </Link>
            </Button>
          </>
        }
      />

      <MetricStrip
        items={[
          {
            label: "Total earned",
            value: formatRupiah(s.totalEarned),
            hint: `bulan ini ${formatRupiah(s.thisMonth)}`,
          },
          {
            label: "Siap withdraw",
            value: formatRupiah(s.available),
            hint: `minimum ${formatRupiah(minWithdraw)}`,
          },
          {
            label: "Diproses",
            value: formatRupiah(pending),
            hint: `on hold ${formatRupiah(s.onHold)}`,
          },
          {
            label: "Views berjalan",
            value: formatNumber(s.viewsBerjalan),
            hint: "menunggu kualifikasi",
          },
          {
            label: "Total views",
            value: formatNumber(s.totalViews),
            hint: `${logs?.length ?? 0} aktivitas sync`,
          },
        ]}
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <Panel
          title="Peluang terbuka"
          meta={`${open.length} campaign belum diikuti`}
          flush
          actions={
            <Button asChild variant="ghost" size="sm" className="h-6 px-2 text-[11px]">
              <Link to="/app/scanner">semua <ArrowUpRight className="h-3 w-3" /></Link>
            </Button>
          }
        >
          {open.length === 0 ? (
            <p className="px-4 py-6 text-[13px] text-muted-foreground">
              Semua campaign sudah ditandai diikuti. Buka scanner untuk memeriksa ulang skornya.
            </p>
          ) : (
            <TableShell
              cols={OPPORTUNITY_COLS}
              head={[
                "campaign",
                "cpm",
                "sisa budget",
                "pesaing",
                "skor",
              ]}
            >
              {open.slice(0, 6).map((c) => {
                const remaining =
                  c.budget != null && c.budget > 0
                    ? Math.max(0, Math.round(((c.budget - (c.spent ?? 0)) / c.budget) * 100))
                    : c.remainingPct;
                return (
                  <TableRow key={c._id} cols={OPPORTUNITY_COLS} to={`/app/campaign/${c._id}`}>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{c.title}</span>
                      <span className="mt-0.5 block truncate font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground/70">
                        {c.brand}
                        {c.category ? ` • ${c.category}` : ""}
                        {c.platforms?.length ? ` • ${c.platforms.join("/")}` : ""}
                      </span>
                    </span>
                    <span className="font-mono text-[12px] tabular-nums">
                      {formatRupiah(c.ratePerMillion)}
                    </span>
                    <span className="flex items-center gap-2">
                      <Meter value={remaining} tone={(remaining ?? 0) >= 50 ? "good" : "warn"} className="w-10" />
                      <span className="font-mono text-[12px] tabular-nums text-muted-foreground">
                        {remaining != null ? `${remaining}%` : "—"}
                      </span>
                    </span>
                    <span className="font-mono text-[12px] tabular-nums text-muted-foreground">
                      {formatNumber(c.clippers)}
                    </span>
                    <Score value={c.score} />
                  </TableRow>
                );
              })}
            </TableShell>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title="Sedang dikerjakan" meta={`${joined.length} diikuti`} flush>
            {joined.length === 0 ? (
              <p className="px-4 py-5 text-[13px] text-muted-foreground">
                Belum ada campaign diikuti. Tandai satu dari scanner untuk membuka Autopilot.
              </p>
            ) : (
              <KeyValueList className="px-4 py-1">
                {joined.slice(0, 6).map((c) => (
                  <Link
                    key={c._id}
                    to={`/app/campaign/${c._id}`}
                    className="flex items-center justify-between gap-3 py-2.5 transition-colors hover:text-primary"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium">{c.title}</span>
                      <span className="mt-0.5 block truncate font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground/70">
                        {c.brand}
                      </span>
                    </span>
                    <Status tone={toneForScore(c.score)}>skor {c.score}</Status>
                  </Link>
                ))}
              </KeyValueList>
            )}
          </Panel>

          <Panel title="Status sinkronisasi">
            <KeyValueList>
              <KeyValue label="sync terakhir" mono>
                {timeAgo(snapshot.fetchedAt)}
              </KeyValue>
              <KeyValue label="sumber" mono>
                {snapshot.source}
              </KeyValue>
              <KeyValue label="cache campaign" mono>
                {formatNumber((snapshot.campaigns as unknown[] | undefined)?.length ?? 0)}
              </KeyValue>
              <KeyValue label="notifikasi" mono>
                {snapshot.notifications != null ? String(snapshot.notifications) : "—"}
              </KeyValue>
              <KeyValue label="hasil terakhir" mono>
                {lastLog ? `${lastLog.source} • ${lastLog.status}` : "—"}
              </KeyValue>
            </KeyValueList>
          </Panel>

          <Panel title="Langkah berikutnya" flush>
            <div className="divide-y divide-border/60">
              {[
                { to: "/app/autopilot", label: "Susun rencana produksi", hint: "brief → shotlist" },
                { to: "/app/earnings", label: "Periksa kesiapan withdraw", hint: "minimum & fee" },
                { to: "/app/analytics", label: "Baca tren views", hint: "30 hari" },
              ].map((row) => (
                <Link
                  key={row.to}
                  to={row.to}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-secondary/30"
                >
                  <span className="text-[13px]">{row.label}</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground/70">
                    {row.hint}
                  </span>
                </Link>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <Panel title="Aktivitas sync" meta={`${logs?.length ?? 0} terakhir`} flush>
        {!logs || logs.length === 0 ? (
          <p className="px-4 py-6 text-[13px] text-muted-foreground">
            Belum ada aktivitas sync tercatat.
          </p>
        ) : (
          <TableShell cols={LOG_COLS} head={["waktu", "sumber", "pesan", "status"]} minWidth="38rem">
            {logs.slice(0, 6).map((l) => (
              <TableRow key={l._id} cols={LOG_COLS}>
                <span className="font-mono text-[12px] text-muted-foreground">{timeAgo(l.at)}</span>
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                  {l.source}
                </span>
                <span className="truncate text-muted-foreground">{l.message ?? "—"}</span>
                <Status tone={l.status === "ok" ? "good" : "bad"}>{l.status}</Status>
              </TableRow>
            ))}
          </TableShell>
        )}
      </Panel>
    </div>
  );
}
