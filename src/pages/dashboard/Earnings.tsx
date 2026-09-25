import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  BackendUnreachable,
  EmptyState,
  KeyValue,
  KeyValueList,
  Meter,
  MetricStrip,
  PageHeader,
  Panel,
  PanelLoading,
  Status,
  TableRow,
  TableShell,
} from "@/components/shared";
import { formatNumber, formatRupiah, timeAgo } from "@/lib/utils";
import { useBackendReachable, useWorkspace } from "@/lib/useWorkspace";
import { Cable, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

const ROW_COLS = "minmax(0,1fr) 6.5rem 7rem 7rem 8rem";

function statusTone(status?: string) {
  if (status === "approved") return "good" as const;
  if (status === "diproses") return "info" as const;
  return "warn" as const;
}

export default function EarningsPage() {
  const { args: workspaceArgs } = useWorkspace();
  const reachable = useBackendReachable();
  const snapshot = useQuery(api.queries.getSnapshot, workspaceArgs);
  const earnings = useQuery(api.queries.getEarnings, workspaceArgs);
  const workspace = useQuery(api.queries.getWorkspaceContext, workspaceArgs);

  if (!reachable) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Earnings" title="Saldo & payout" />
        <BackendUnreachable />
      </div>
    );
  }

  if (snapshot === undefined || earnings === undefined || workspace === undefined) {
    return (
      <div className="space-y-6">
        <div className="h-16 border-b border-border" />
        <PanelLoading />
      </div>
    );
  }

  // Earnings only exist for an own-session bridge mirror. Showing zeros for public
  // discovery data would read as "you earned nothing", which would be a false claim.
  if (!snapshot || workspace?.dataMode !== "own-session") {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Earnings" title="Saldo & payout" />
        <EmptyState
          title="Earnings hanya dari bridge milikmu"
          description="Saldo, status pemrosesan, dan kesiapan withdraw berasal dari mirror sesi marketplace milikmu sendiri. Console publik tidak menampilkan saldo siapa pun, dan tidak mengarang angka nol sebagai hasil."
          action={
            <Button asChild size="sm">
              <Link to="/app/bridge">
                <Cable className="h-3.5 w-3.5" /> Buka setup bridge
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  const s = (snapshot.earningsSummary ?? {}) as Record<string, number>;
  const settings = (snapshot.featureFlags as { settings?: Record<string, unknown> } | undefined)
    ?.settings;
  const minWithdraw = Number(settings?.min_withdrawal_idr ?? 50000);
  const fee = Number(settings?.withdrawal_fee_idr ?? 10000);
  const available = s.available ?? 0;
  const canWithdraw = available >= minWithdraw;
  const progressToMin = minWithdraw > 0 ? (available / minWithdraw) * 100 : 100;
  const rows = earnings ?? [];
  const totalAmount = rows.reduce((sum, e) => sum + e.amount, 0);
  const totalViews = rows.reduce((sum, e) => sum + e.views, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Earnings"
        title="Saldo & payout"
        meta={`${rows.length} baris earnings tersinkron • aturan platform: minimum ${formatRupiah(minWithdraw)} dan fee ${formatRupiah(fee)} per penarikan`}
        actions={
          <Button asChild variant="outline" size="sm">
            <a href="https://konten.com/clipper-earnings" target="_blank" rel="noreferrer">
              Halaman earnings konten.com <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
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
            value: formatRupiah(available),
            hint: canWithdraw ? "memenuhi minimum" : `kurang ${formatRupiah(Math.max(0, minWithdraw - available))}`,
          },
          {
            label: "On hold",
            value: formatRupiah(s.onHold),
            hint: "belum melewati views floor",
          },
          {
            label: "Views dibayar",
            value: formatNumber(totalViews),
            hint: `${rows.length} baris`,
          },
          {
            label: "Nilai baris",
            value: formatRupiah(totalAmount),
            hint: "akumulasi 100 baris terakhir",
          },
        ]}
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Panel title="Kesiapan withdraw">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              saldo tersedia
            </span>
            <span className="font-mono text-xl font-semibold tabular-nums">
              {formatRupiah(available)}
            </span>
          </div>
          <Meter
            value={Math.min(100, progressToMin)}
            tone={canWithdraw ? "good" : "warn"}
            className="mt-3 h-1.5"
          />
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            {canWithdraw
              ? "ambang minimum tercapai"
              : `${Math.min(100, Math.round(progressToMin))}% dari ${formatRupiah(minWithdraw)}`}
          </p>

          <KeyValueList className="mt-4">
            <KeyValue label="estimasi diterima" mono>
              {formatRupiah(Math.max(0, available - fee))}
            </KeyValue>
            <KeyValue label="fee per penarikan" mono>
              {formatRupiah(fee)}
            </KeyValue>
            <KeyValue label="status">
              <Status tone={canWithdraw ? "good" : "warn"}>
                {canWithdraw ? "siap ditarik" : "belum cukup"}
              </Status>
            </KeyValue>
            <KeyValue label="platform" mono>
              konten.com
            </KeyValue>
          </KeyValueList>
        </Panel>

        <Panel title="Baris earnings" meta={`${rows.length} baris`} flush>
          {rows.length === 0 ? (
            <p className="px-4 py-6 text-[13px] text-muted-foreground">
              Belum ada baris earnings. Sync bridge untuk menarik riwayat dari akunmu.
            </p>
          ) : (
            <TableShell
              cols={ROW_COLS}
              minWidth="46rem"
              head={[
                "campaign",
                "platform",
                "views",
                "waktu",
                <span key="n" className="block text-right">
                  nominal
                </span>,
              ]}
            >
              {rows.slice(0, 40).map((e) => (
                <TableRow key={e._id} cols={ROW_COLS}>
                  <span className="min-w-0">
                    <span className="block truncate">{e.campaignTitle ?? "—"}</span>
                    <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground/70">
                      <Status tone={statusTone(e.status)}>{e.status ?? "—"}</Status>
                    </span>
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                    {e.platform ?? "—"}
                  </span>
                  <span className="font-mono text-[12px] tabular-nums text-muted-foreground">
                    {formatNumber(e.views)}
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {timeAgo(e.earnedAt)}
                  </span>
                  <span className="text-right font-mono text-[12px] font-semibold tabular-nums">
                    {formatRupiah(e.amount)}
                  </span>
                </TableRow>
              ))}
            </TableShell>
          )}
        </Panel>
      </div>
    </div>
  );
}
