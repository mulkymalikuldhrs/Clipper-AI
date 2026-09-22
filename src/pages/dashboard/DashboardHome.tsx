import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader, KpiCard, ScoreRing, EmptyState } from "@/components/shared";
import { formatRupiah, formatNumber, timeAgo } from "@/lib/utils";
import {
  Wallet,
  Eye,
  Clock,
  TrendingUp,
  Radar,
  Clapperboard,
  Cable,
  CircleDot,
  Flame,
} from "lucide-react";

export default function DashboardHome() {
  const snapshot = useQuery(api.queries.getSnapshot, {});
  const campaigns = useQuery(api.queries.listCampaigns, {});
  const logs = useQuery(api.queries.getSyncLogs, {});

  const s = snapshot?.earningsSummary as Record<string, number> | undefined;
  const flags = (snapshot?.featureFlags as { settings?: Record<string, unknown> } | undefined)?.settings;
  const loading = snapshot === undefined;

  const top = (campaigns ?? []).filter((c) => !c.joined).slice(0, 3);
  const joined = (campaigns ?? []).filter((c) => c.joined);
  const lastLog = logs?.[0];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const hasData = !!snapshot;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mission Control"
        subtitle={
          lastLog
            ? `Sync terakhir: ${lastLog.source} • ${timeAgo(lastLog.at)} • ${lastLog.status === "ok" ? "sehat" : "error"}`
            : "Belum ada sinkronisasi — mulai dengan data demo atau bridge."
        }
        icon={CircleDot}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link to="/app/bridge">
                <Cable className="h-4 w-4" /> Bridge
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/app/scanner">
                <Radar className="h-4 w-4" /> Scan Campaign
              </Link>
            </Button>
          </>
        }
      />

      {!hasData ? (
        <EmptyState
          icon={Cable}
          title="Workspace masih kosong"
          description="Hubungkan bridge untuk menarik data konten.com milikmu, atau isi data demo hasil crawl nyata untuk melihat cara kerja autopilot."
          action={
            <Button asChild>
              <Link to="/app/bridge">Setup Bridge / Demo</Link>
            </Button>
          }
        />
      ) : (
        <>
          {/* KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Total Earned"
              value={formatRupiah(s?.totalEarned)}
              sub={`bulan ini ${formatRupiah(s?.thisMonth)}`}
              icon={Wallet}
            />
            <KpiCard
              label="Siap Withdraw"
              value={formatRupiah(s?.available)}
              sub={`min withdraw ${formatRupiah(Number(flags?.min_withdrawal_idr ?? 50000))}`}
              icon={TrendingUp}
              accent="cyan"
            />
            <KpiCard
              label="On Hold / Diproses"
              value={formatRupiah((s?.onHold ?? 0) + (s?.sedangDiproses ?? 0))}
              sub="menunggu approval views"
              icon={Clock}
              accent="amber"
            />
            <KpiCard
              label="Total Views"
              value={formatNumber(s?.totalViews)}
              sub={`${formatNumber(s?.viewsBerjalan)} views berjalan`}
              icon={Eye}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Top opportunities */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Flame className="h-4 w-4 text-primary" /> Peluang Terbaik Hari Ini
                  </CardTitle>
                  <CardDescription>Diurutkan skor autopilot: CPM × sisa budget × kompetisi</CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/app/scanner">Lihat semua</Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {top.length === 0 && (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    Belum ada campaign terpantau. Jalankan bridge sync.
                  </p>
                )}
                {top.map((c) => (
                  <Link
                    key={c._id}
                    to={`/app/campaign/${c._id}`}
                    className="flex items-center gap-4 rounded-lg border bg-background/40 p-4 hover:border-primary/40 transition-colors"
                  >
                    <ScoreRing score={c.score} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{c.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {c.brand} • CPM {formatRupiah(c.ratePerMillion)} •{" "}
                        {c.clippers != null && `${formatNumber(c.clippers)} clipper`}
                      </p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">sisa budget</p>
                      <p className="text-sm font-semibold">
                        {c.budget != null
                          ? `${Math.max(0, Math.round(((c.budget - (c.spent ?? 0)) / c.budget) * 100))}%`
                          : "-"}
                      </p>
                    </div>
                    <Badge variant={c.score >= 70 ? "success" : c.score >= 45 ? "warning" : "destructive"}>
                      {c.score >= 70 ? "LAYAK" : c.score >= 45 ? "CEK" : "ZONK"}
                    </Badge>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Joined + quick actions */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Campaign Diikuti</CardTitle>
                  <CardDescription>{joined.length} aktif</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {joined.length === 0 && (
                    <p className="text-sm text-muted-foreground">Belum join campaign.</p>
                  )}
                  {joined.map((c) => (
                    <Link
                      key={c._id}
                      to={`/app/campaign/${c._id}`}
                      className="block rounded-lg border p-3 hover:border-primary/40 transition-colors"
                    >
                      <p className="text-sm font-medium truncate">{c.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {c.brand} • skor {c.score}
                      </p>
                    </Link>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Aksi Cepat</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2">
                  <Button asChild variant="outline" className="justify-start">
                    <Link to="/app/autopilot">
                      <Clapperboard className="h-4 w-4" /> Susun rencana produksi
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link to="/app/earnings">
                      <Wallet className="h-4 w-4" /> Cek status payout
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link to="/app/analytics">
                      <TrendingUp className="h-4 w-4" /> Lihat tren views
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
