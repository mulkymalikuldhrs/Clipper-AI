import { useQuery } from "convex/react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../../convex/_generated/api";
import {
  EmptyState,
  MetricStrip,
  PageHeader,
  Panel,
  PanelLoading,
  TableRow,
  TableShell,
  Meter,
} from "@/components/shared";
import { formatNumber, formatRupiah } from "@/lib/utils";

const GRID = "hsl(185 30% 16%)";
const AXIS = "#7d9a94";
const AXIS_STRONG = "#a3c2bb";
const MONO = "JetBrains Mono, ui-monospace, monospace";
const SERIES = ["#34d399", "#22d3ee", "#fbbf24", "#f87171", "#a78bfa"];

const TOOLTIP_STYLE = {
  background: "hsl(192 42% 6%)",
  border: "1px solid hsl(185 30% 16%)",
  borderRadius: 6,
  fontSize: 12,
} as const;

const DIST_COLS = "minmax(0,1fr) 6rem 6rem";

export default function Analytics() {
  const snapshot = useQuery(api.queries.getSnapshot, {});
  const earnings = useQuery(api.queries.getEarnings, {});

  if (snapshot === undefined || earnings === undefined) {
    return (
      <div className="space-y-6">
        <div className="h-16 border-b border-border" />
        <PanelLoading />
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Analitik" title="Tren views & earnings" />
        <EmptyState
          title="Belum ada data analitik"
          description="Jalankan bridge sync atau isi data demo dari halaman Bridge untuk melihat timeseries views dan earnings per campaign."
        />
      </div>
    );
  }

  const buckets =
    (snapshot.timeseries as { buckets?: { ts: number; views: number }[] } | undefined)?.buckets ?? [];

  const chartData = buckets.map((b) => ({
    date: new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(
      new Date(b.ts)
    ),
    views: b.views,
  }));

  const totalViews = buckets.reduce((sum, b) => sum + b.views, 0);
  const bestBuckets = [...buckets].sort((a, b) => b.views - a.views).slice(0, 3);

  const byCampaign = new Map<string, { views: number; amount: number }>();
  const byPlatform = new Map<string, number>();
  let totalAmount = 0;
  for (const e of earnings) {
    const key = e.campaignTitle ?? "Lainnya";
    const cur = byCampaign.get(key) ?? { views: 0, amount: 0 };
    cur.views += e.views;
    cur.amount += e.amount;
    byCampaign.set(key, cur);
    const pf = e.platform ?? "lainnya";
    byPlatform.set(pf, (byPlatform.get(pf) ?? 0) + e.views);
    totalAmount += e.amount;
  }

  const campaignBars = [...byCampaign.entries()]
    .map(([name, v]) => ({ name: name.length > 26 ? `${name.slice(0, 26)}…` : name, ...v }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);

  const platformPie = [...byPlatform.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  const platformTotal = platformPie.reduce((sum, p) => sum + p.value, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analitik"
        title="Tren views & earnings"
        meta={`${chartData.length} titik timeseries • ${earnings.length} baris earnings tersinkron`}
      />

      <MetricStrip
        items={[
          { label: "views (periode)", value: formatNumber(totalViews) },
          {
            label: "rata-rata / titik",
            value: formatNumber(chartData.length ? Math.round(totalViews / chartData.length) : 0),
          },
          {
            label: "puncak",
            value: formatNumber(bestBuckets[0]?.views ?? 0),
            hint: bestBuckets[0]
              ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(
                  new Date(bestBuckets[0].ts)
                )
              : undefined,
          },
          { label: "earnings tercatat", value: formatRupiah(totalAmount) },
          { label: "platform aktif", value: String(platformPie.length) },
        ]}
      />

      <Panel
        title="Views harian"
        meta="mirror /api/clipper/views-timeseries"
        bodyClassName="h-72 px-4 py-4"
      >
        {chartData.length === 0 ? (
          <div className="grid h-full place-items-center text-[13px] text-muted-foreground">
            Tidak ada timeseries pada snapshot ini.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: AXIS, fontFamily: MONO }}
                tickLine={false}
                axisLine={{ stroke: GRID }}
                minTickGap={24}
              />
              <YAxis
                tick={{ fontSize: 10, fill: AXIS, fontFamily: MONO }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => formatNumber(v)}
                width={56}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: AXIS_STRONG, fontFamily: MONO, fontSize: 11 }}
                formatter={(v) => [formatNumber(Number(v)), "views"]}
              />
              <Area
                type="monotone"
                dataKey="views"
                stroke="#34d399"
                strokeWidth={1.5}
                fill="#34d399"
                fillOpacity={0.08}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Panel>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
        <Panel
          title="Earnings per campaign"
          meta="6 teratas"
          bodyClassName="h-80 px-4 py-4"
        >
          {campaignBars.length === 0 ? (
            <div className="grid h-full place-items-center text-[13px] text-muted-foreground">
              Belum ada earnings.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campaignBars} layout="vertical" margin={{ left: 4, right: 8 }}>
                <CartesianGrid stroke={GRID} horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: AXIS, fontFamily: MONO }}
                  tickFormatter={(v: number) => formatNumber(v)}
                  axisLine={{ stroke: GRID }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={148}
                  tick={{ fontSize: 10, fill: AXIS_STRONG }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={{ color: AXIS_STRONG, fontSize: 11 }}
                  formatter={(v, k) =>
                    k === "amount"
                      ? [formatRupiah(Number(v)), "earnings"]
                      : [formatNumber(Number(v)), "views"]
                  }
                />
                <Bar dataKey="amount" fill="#22d3ee" fillOpacity={0.7} radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title="Distribusi platform" className="lg:h-[19rem]">
            {platformPie.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">Belum ada data platform.</p>
            ) : (
              <div className="flex items-center gap-4">
                <div className="h-36 w-36 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={platformPie}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={38}
                        outerRadius={62}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {platformPie.map((_, i) => (
                          <Cell key={i} fill={SERIES[i % SERIES.length]} fillOpacity={0.8} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        formatter={(v) => [formatNumber(Number(v)), "views"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="min-w-0 flex-1 space-y-2">
                  {platformPie.map((p, i) => (
                    <li key={p.name} className="flex items-center gap-2.5 text-[12px]">
                      <span
                        className="h-2 w-2 shrink-0 rounded-sm"
                        style={{ background: SERIES[i % SERIES.length], opacity: 0.8 }}
                      />
                      <span className="min-w-0 flex-1 truncate uppercase tracking-[0.08em] text-muted-foreground">
                        {p.name}
                      </span>
                      <span className="font-mono tabular-nums text-muted-foreground">
                        {platformTotal ? Math.round((p.value / platformTotal) * 100) : 0}%
                      </span>
                      <span className="w-16 text-right font-mono tabular-nums">
                        {formatNumber(p.value)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Panel>

          <Panel title="Hari terbaik" meta="3 titik teratas" flush>
            {bestBuckets.length === 0 ? (
              <p className="px-4 py-5 text-[13px] text-muted-foreground">Belum ada data.</p>
            ) : (
              <TableShell cols={DIST_COLS} minWidth="22rem" head={["tanggal", "views", "share"]}>
                {bestBuckets.map((b) => (
                  <TableRow key={b.ts} cols={DIST_COLS}>
                    <span className="font-mono text-[12px] text-muted-foreground">
                      {new Intl.DateTimeFormat("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }).format(new Date(b.ts))}
                    </span>
                    <span className="font-mono text-[12px] tabular-nums">
                      {formatNumber(b.views)}
                    </span>
                    <span className="flex items-center gap-2">
                      <Meter
                        value={bestBuckets[0].views ? (b.views / bestBuckets[0].views) * 100 : 0}
                        tone="good"
                        className="w-10"
                      />
                      <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                        {bestBuckets[0].views
                          ? Math.round((b.views / bestBuckets[0].views) * 100)
                          : 0}
                        %
                      </span>
                    </span>
                  </TableRow>
                ))}
              </TableShell>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
