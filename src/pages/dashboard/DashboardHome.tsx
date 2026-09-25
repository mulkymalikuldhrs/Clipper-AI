import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { BackendUnreachable, EmptyState, KeyValue, KeyValueList, MetricStrip, Meter, PageHeader, Panel, PanelLoading, Score, Status, TableRow, TableShell, toneForScore } from "@/components/shared";
import { formatCampaignMoney, formatNumber, formatRupiah, timeAgo } from "@/lib/utils";
import { useBackendReachable, useWorkspace } from "@/lib/useWorkspace";
import { ArrowUpRight, Cable, Radar, Terminal } from "lucide-react";

const OPPORTUNITY_COLS = "minmax(0,1fr) 7.5rem 7.5rem 5rem 5.5rem";
const LOG_COLS = "4.5rem 6rem minmax(0,1fr) 5rem";

export default function DashboardHome() {
  const { args: workspaceArgs } = useWorkspace();
  const reachable = useBackendReachable();
  const snapshot = useQuery(api.queries.getSnapshot, workspaceArgs);
  const campaigns = useQuery(api.queries.listCampaigns, workspaceArgs);
  const logs = useQuery(api.queries.getSyncLogs, workspaceArgs);
  const workspace = useQuery(api.queries.getWorkspaceContext, workspaceArgs);

  if (!reachable) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Control room" title="Ringkasan" />
        <BackendUnreachable />
      </div>
    );
  }

  if (snapshot === undefined || campaigns === undefined || workspace === undefined) {
    return <div className="space-y-6"><div className="h-16 border-b border-border" /><PanelLoading /></div>;
  }

  if (!snapshot) {
    return <div className="space-y-6">
      <PageHeader eyebrow="Control room" title="No source attached" meta="The console is ready. Connect a real source before reading campaign state." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <EmptyState title="Belum ada sumber data" description="Console ini berjalan tanpa akun. Tidak ada campaign atau earnings sampai kamu menjalankan bridge lokal (sesi marketplace milikmu) atau sync Discover publik Content Rewards." action={<Button asChild size="sm"><Link to="/app/bridge"><Cable className="h-3.5 w-3.5" /> Buka setup sumber</Link></Button>} />
        <Panel title="$ connect --list" meta="available sources" flush><div className="divide-y divide-border/60 font-mono text-[12px]"><div className="flex justify-between gap-4 px-4 py-3"><span className="text-primary">konten</span><span className="text-muted-foreground">own-session bridge · authenticated locally</span></div><div className="flex justify-between gap-4 px-4 py-3"><span className="text-primary">content-rewards</span><span className="text-muted-foreground">public Discover JSON · read-only</span></div><div className="flex justify-between gap-4 px-4 py-3"><span className="text-primary">model-provider</span><span className="text-muted-foreground">configured inside Agent Swarm</span></div></div></Panel>
      </div>
    </div>;
  }

  const isKonten = snapshot.source === "bridge";
  const earnings = isKonten ? (snapshot.earningsSummary ?? {}) as Record<string, number> : {};
  const open = campaigns.filter((campaign) => !campaign.joined);
  const joined = campaigns.filter((campaign) => campaign.joined);
  const lastLog = logs?.[0];

  return <div className="space-y-6">
    <PageHeader eyebrow="Control room" title="Live workspace state" meta={<span className="flex flex-wrap items-center gap-3"><span>{formatNumber(campaigns.length)} campaigns • {formatNumber(joined.length)} marked</span><Status tone={isKonten ? "good" : "info"}>source {snapshot.source}</Status><Status tone={workspace?.dataMode === "own-session" ? "good" : "info"}>{workspace?.dataMode === "own-session" ? "own session mirror" : "public discovery data"}</Status></span>} actions={<><Button asChild variant="outline" size="sm"><Link to="/app/bridge"><Cable className="h-3.5 w-3.5" /> Sources</Link></Button><Button asChild size="sm"><Link to="/app/scanner"><Radar className="h-3.5 w-3.5" /> Scanner</Link></Button></>} />

    <MetricStrip items={[
      { label: "Source", value: snapshot.source, hint: snapshot.coverage ? "coverage recorded" : "coverage unknown" },
      { label: "Campaigns", value: formatNumber(campaigns.length), hint: `${open.length} open` },
      { label: "Marked", value: formatNumber(joined.length), hint: "local queue only" },
      { label: "Last sync", value: timeAgo(snapshot.fetchedAt), hint: lastLog ? `${lastLog.source} · ${lastLog.status}` : "no log" },
      isKonten ? { label: "Total earned", value: formatRupiah(Number(earnings.totalEarned ?? 0)), hint: "IDR · Konten" } : { label: "Economy", value: "USD", hint: "Content Rewards" },
    ]} />

    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,0.75fr)]">
      <Panel title="Open opportunities" meta={`${open.length} campaigns`} actions={<Button asChild variant="ghost" size="sm" className="h-6 px-2 text-[11px]"><Link to="/app/scanner">open scanner <ArrowUpRight className="h-3 w-3" /></Link></Button>} flush>
        {open.length === 0 ? <p className="px-4 py-6 text-[13px] text-muted-foreground">No open campaign rows in the current source snapshot.</p> : <TableShell cols={OPPORTUNITY_COLS} head={["campaign", "rate / 1m", "remaining", "clippers", "score"]} minWidth="46rem">{open.slice(0, 8).map((campaign) => { const remaining = campaign.budget != null && campaign.budget > 0 ? Math.max(0, Math.round(((campaign.budget - (campaign.spent ?? 0)) / campaign.budget) * 100)) : campaign.remainingPct; return <TableRow key={campaign._id} cols={OPPORTUNITY_COLS} to={`/app/campaign/${campaign._id}`}><span className="min-w-0"><span className="block truncate font-medium">{campaign.title}</span><span className="mt-0.5 block truncate font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">{campaign.marketplace ?? "unknown"} • {campaign.brand}</span></span><span className="font-mono text-[12px] tabular-nums">{formatCampaignMoney(campaign.ratePerMillion, campaign.marketplace)}</span><span className="flex items-center gap-2"><Meter value={remaining} tone={(remaining ?? 0) >= 50 ? "good" : "warn"} className="w-10" /><span className="font-mono text-[11px]">{remaining != null ? `${remaining}%` : "—"}</span></span><span className="font-mono text-[12px] tabular-nums">{formatNumber(campaign.clippers)}</span><Score value={campaign.score} /></TableRow>; })}</TableShell>}
      </Panel>

      <div className="space-y-6">
        <Panel title="$ source status"><KeyValueList><KeyValue label="active source" mono>{snapshot.source}</KeyValue><KeyValue label="fetched" mono>{timeAgo(snapshot.fetchedAt)}</KeyValue><KeyValue label="campaign rows" mono>{formatNumber(campaigns.length)}</KeyValue><KeyValue label="detail coverage" mono>{snapshot.detailFetched != null ? String(snapshot.detailFetched) : "—"}</KeyValue><KeyValue label="earnings source" mono>{isKonten ? "available" : "not provided"}</KeyValue><KeyValue label="joined source" mono>{isKonten ? "mirror" : "not provided"}</KeyValue></KeyValueList></Panel>
        <Panel title="$ next" flush><div className="divide-y divide-border/60">{[{ to: "/app/swarm", label: "Configure swarm", hint: "provider + roles" }, { to: "/app/autopilot", label: "Open production queue", hint: `${joined.length} marked` }, { to: "/app/bridge", label: "Manage sources", hint: "sync + credentials" }].map((item) => <Link key={item.to} to={item.to} className="flex items-center justify-between gap-3 px-4 py-3 text-[13px] hover:bg-secondary/40"><span>{item.label}</span><span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">{item.hint}</span></Link>)}</div></Panel>
        <Panel title="Source boundary" className="border-amber-500/25"><div className="flex gap-3"><Terminal className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" /><p className="text-[12px] leading-relaxed text-muted-foreground">Content Rewards tidak menyediakan joined state atau earnings. UI tidak mengarang nilai tersebut. Konten economics tetap IDR; Content Rewards economics USD.</p></div></Panel>
      </div>
    </div>

    <Panel title="$ sync log" meta={`${logs?.length ?? 0} entries`} flush>{!logs || logs.length === 0 ? <p className="px-4 py-6 text-[13px] text-muted-foreground">No sync log entries.</p> : <TableShell cols={LOG_COLS} head={["time", "source", "message", "status"]} minWidth="38rem">{logs.slice(0, 8).map((log) => <TableRow key={log._id} cols={LOG_COLS}><span className="font-mono text-[11px] text-muted-foreground">{timeAgo(log.at)}</span><span className="font-mono text-[11px] uppercase">{log.source}</span><span className="truncate text-muted-foreground">{log.message ?? "—"}</span><Status tone={log.status === "ok" ? "good" : log.status === "pending" ? "info" : "bad"}>{log.status}</Status></TableRow>)}</TableShell>}</Panel>
  </div>;
}
