import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader, KpiCard, EmptyState } from "@/components/shared";
import { formatRupiah, formatNumber, timeAgo } from "@/lib/utils";
import { Wallet, Clock, TrendingUp, Eye, ExternalLink, ShieldAlert, CircleDot } from "lucide-react";

export default function EarningsPage() {
  const snapshot = useQuery(api.queries.getSnapshot, {});
  const earnings = useQuery(api.queries.getEarnings, {});
  const loading = snapshot === undefined || earnings === undefined;

  if (loading) {
    return <div className="h-64 animate-pulse rounded-xl bg-muted" />;
  }

  if (!snapshot) {
    return (
      <div className="space-y-6">
        <PageHeader title="Earnings" icon={Wallet} />
        <EmptyState
          icon={Wallet}
          title="Belum ada data earnings"
          description="Jalankan bridge sync atau isi demo data dari halaman Bridge."
        />
      </div>
    );
  }

  const s = (snapshot.earningsSummary ?? {}) as Record<string, number>;
  const settings = (
    snapshot.featureFlags as { settings?: Record<string, unknown> } | undefined
  )?.settings;
  const minWithdraw = Number(settings?.min_withdrawal_idr ?? 50000);
  const fee = Number(settings?.withdrawal_fee_idr ?? 10000);
  const available = s.available ?? 0;
  const canWithdraw = available >= minWithdraw;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Earnings & Payout"
        subtitle="Mirror wallet konten.com: earned, on hold, siap withdraw."
        icon={Wallet}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Earned" value={formatRupiah(s.totalEarned)} sub={`bulan ini ${formatRupiah(s.thisMonth)}`} icon={TrendingUp} />
        <KpiCard label="Siap Withdraw" value={formatRupiah(available)} icon={Wallet} accent="cyan" />
        <KpiCard label="On Hold" value={formatRupiah(s.onHold)} sub="belum melewati views floor" icon={Clock} accent="amber" />
        <KpiCard label="Total Views" value={formatNumber(s.totalViews)} icon={Eye} />
      </div>

      <Card className={canWithdraw ? "border-emerald-500/30" : "border-amber-500/30"}>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              {canWithdraw ? <CircleDot className="h-4 w-4 text-emerald-400" /> : <ShieldAlert className="h-4 w-4 text-amber-400" />}
              Kesiapan Withdraw
            </CardTitle>
            <CardDescription>
              Aturan platform: minimum {formatRupiah(minWithdraw)} + fee {formatRupiah(fee)} per penarikan.
            </CardDescription>
          </div>
          <Badge variant={canWithdraw ? "success" : "warning"}>
            {canWithdraw ? "SIAP" : "BELUM CUKUP"}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Saldo tersedia</span>
            <span className="text-2xl font-bold">{formatRupiah(available)}</span>
          </div>
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">Estimasi diterima jika withdraw sekarang</span>
            <span className="font-semibold">{formatRupiah(Math.max(0, available - fee))}</span>
          </div>
          {!canWithdraw && (
            <p className="text-xs text-muted-foreground">
              Butuh {formatRupiah(minWithdraw - available)} lagi untuk mencapai minimum penarikan.
            </p>
          )}
          <Button asChild variant="outline" size="sm">
            <a href="https://konten.com/clipper-earnings" target="_blank" rel="noreferrer">
              Buka halaman earnings konten.com <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Riwayat Earnings</CardTitle>
          <CardDescription>{earnings?.length ?? 0} baris tersinkron</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {(earnings ?? []).length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">Belum ada baris earnings.</p>
          ) : (
            <div className="divide-y divide-border">
              {earnings!.map((e) => (
                <div key={e._id} className="flex items-center gap-4 px-6 py-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{e.campaignTitle ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.platform ?? "-"} • {formatNumber(e.views)} views • {timeAgo(e.earnedAt)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      e.status === "approved" ? "success" : e.status === "diproses" ? "info" : "warning"
                    }
                  >
                    {e.status ?? "-"}
                  </Badge>
                  <p className="text-sm font-semibold w-28 text-right">{formatRupiah(e.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
