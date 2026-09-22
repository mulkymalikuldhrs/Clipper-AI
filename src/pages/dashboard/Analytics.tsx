import { useQuery } from "convex/react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader, EmptyState } from "@/components/shared";
import { formatNumber, formatRupiah } from "@/lib/utils";
import { BarChart3 } from "lucide-react";

const COLORS = ["#34d399", "#22d3ee", "#fbbf24", "#f87171", "#a78bfa"];

export default function Analytics() {
  const snapshot = useQuery(api.queries.getSnapshot, {});
  const earnings = useQuery(api.queries.getEarnings, {});

  const loading = snapshot === undefined || earnings === undefined;

  if (loading) {
    return <div className="h-64 animate-pulse rounded-xl bg-muted" />;
  }

  const ts = (snapshot?.timeseries as { buckets?: { ts: number; views: number }[] } | undefined)
    ?.buckets ?? [];
  const chartData = ts.map((b) => ({
    date: new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(new Date(b.ts)),
    views: b.views,
  }));

  const byCampaign = new Map<string, { views: number; amount: number }>();
  const byPlatform = new Map<string, number>();
  for (const e of earnings ?? []) {
    const key = e.campaignTitle ?? "Lainnya";
    const cur = byCampaign.get(key) ?? { views: 0, amount: 0 };
    cur.views += e.views;
    cur.amount += e.amount;
    byCampaign.set(key, cur);
    byPlatform.set(e.platform ?? "?", (byPlatform.get(e.platform ?? "?") ?? 0) + e.views);
  }
  const campaignBars = [...byCampaign.entries()]
    .map(([name, v]) => ({ name: name.length > 22 ? name.slice(0, 22) + "…" : name, ...v }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);
  const platformPie = [...byPlatform.entries()].map(([name, value]) => ({ name, value }));

  if (!snapshot) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analitik" icon={BarChart3} />
        <EmptyState
          icon={BarChart3}
          title="Belum ada data analitik"
          description="Jalankan bridge sync atau isi demo data dari halaman Bridge."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analitik Views"
        subtitle="Tren views harian (mirror timeseries konten.com) dan performa per campaign."
        icon={BarChart3}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Views Harian — 30 hari terakhir</CardTitle>
          <CardDescription>Sumber: /api/clipper/views-timeseries via bridge</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          {chartData.length === 0 ? (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">
              Tidak ada data timeseries.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="vGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(185 30% 16%)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#7d9a94" }} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#7d9a94" }}
                  tickLine={false}
                  tickFormatter={(v: number) => formatNumber(v)}
                  width={56}
                />
                <Tooltip
                  contentStyle={{ background: "hsl(192 42% 6%)", border: "1px solid hsl(185 30% 16%)", borderRadius: 8 }}
                  formatter={(v) => [formatNumber(Number(v)), "views"]}
                />
                <Area type="monotone" dataKey="views" stroke="#34d399" strokeWidth={2} fill="url(#vGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Earnings per Campaign</CardTitle>
            <CardDescription>Dari baris earnings tersinkron</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {campaignBars.length === 0 ? (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">
                Belum ada earnings.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={campaignBars} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(185 30% 16%)" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#7d9a94" }}
                    tickFormatter={(v: number) => formatNumber(v)}
                  />
                  <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11, fill: "#a3c2bb" }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(192 42% 6%)", border: "1px solid hsl(185 30% 16%)", borderRadius: 8 }}
                    formatter={(v, k) =>
                      k === "amount" ? [formatRupiah(Number(v)), "earnings"] : [formatNumber(Number(v)), "views"]
                    }
                  />
                  <Bar dataKey="amount" fill="#22d3ee" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribusi Views per Platform</CardTitle>
            <CardDescription>Pastikan kamu posting di platform yang diizinkan campaign</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {platformPie.length === 0 ? (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">
                Belum ada data.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={platformPie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                    {platformPie.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend formatter={(v) => <span style={{ fontSize: 12, color: "#a3c2bb" }}>{v}</span>} />
                  <Tooltip
                    contentStyle={{ background: "hsl(192 42% 6%)", border: "1px solid hsl(185 30% 16%)", borderRadius: 8 }}
                    formatter={(v) => [formatNumber(Number(v)), "views"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
