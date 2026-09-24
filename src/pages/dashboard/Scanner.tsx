import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  EmptyState,
  Meter,
  PageHeader,
  Panel,
  PanelLoading,
  Score,
  Status,
  TableRow,
  TableShell,
} from "@/components/shared";
import { cn, formatNumber, formatRupiah } from "@/lib/utils";
import { ArrowDown, ArrowUp, RefreshCw, Search } from "lucide-react";

type SortKey = "score" | "cpm" | "remaining" | "clippers" | "minViews";

const COLS = "minmax(0,1fr) 6.5rem 5.5rem 7.5rem 5rem 5.5rem";

const remainingOf = (c: { budget?: number; spent?: number; remainingPct?: number }) =>
  c.budget != null && c.budget > 0
    ? Math.max(0, Math.round(((c.budget - (c.spent ?? 0)) / c.budget) * 100))
    : (c.remainingPct ?? null);

type SortHeadProps = {
  label: string;
  sortKey: SortKey;
  activeSort: SortKey;
  direction: "asc" | "desc";
  onSort: (key: SortKey) => void;
  align?: "right";
};

function SortHead({
  label,
  sortKey,
  activeSort,
  direction,
  onSort,
  align,
}: SortHeadProps) {
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={cn(
        "inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors hover:text-foreground",
        activeSort === sortKey ? "text-foreground" : "text-muted-foreground",
        align === "right" && "justify-end"
      )}
    >
      {label}
      {activeSort === sortKey &&
        (direction === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
    </button>
  );
}

export default function Scanner() {
  const campaigns = useQuery(api.queries.listCampaigns, {});
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | "joined">("all");
  const [sort, setSort] = useState<SortKey>("score");
  const [dir, setDir] = useState<"asc" | "desc">("desc");

  const rows = useMemo(() => {
    let list = campaigns ?? [];
    if (tab === "joined") list = list.filter((c) => c.joined);
    if (q.trim()) {
      const needle = q.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(needle) ||
          c.brand.toLowerCase().includes(needle) ||
          (c.category ?? "").toLowerCase().includes(needle)
      );
    }
    const value = (c: (typeof list)[number]) => {
      switch (sort) {
        case "cpm":
          return c.ratePerMillion ?? 0;
        case "remaining":
          return remainingOf(c) ?? -1;
        case "clippers":
          return c.clippers ?? 0;
        case "minViews":
          return c.minViews ?? 0;
        default:
          return c.score;
      }
    };
    const sorted = [...list].sort((a, b) => value(b) - value(a));
    return dir === "asc" ? sorted.reverse() : sorted;
  }, [campaigns, q, tab, sort, dir]);

  const total = campaigns?.length ?? 0;
  const joinedCount = (campaigns ?? []).filter((c) => c.joined).length;

  function sortBy(key: SortKey) {
    if (key === sort) {
      setDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSort(key);
      setDir("desc");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Scanner"
        title="Semua campaign terpantau"
        meta={`Skor 0–100 dari CPM (35%) • sisa budget (30%) • kompetisi (20%) • syarat views (15%). ${total} campaign • ${joinedCount} diikuti.`}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/app/bridge">
              <RefreshCw className="h-3.5 w-3.5" /> Sync ulang
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[13rem] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari judul, brand, atau kategori"
            className="h-9 pl-8 text-[13px]"
          />
        </div>
        {(
          [
            { key: "all", label: "Semua", count: total },
            { key: "joined", label: "Diikuti", count: joinedCount },
          ] as const
        ).map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setTab(f.key)}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-md border px-3 text-[12px] transition-colors",
              tab === f.key
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
            <span className="font-mono text-[10px] tabular-nums opacity-70">{f.count}</span>
          </button>
        ))}
      </div>

      {campaigns === undefined ? (
        <PanelLoading />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Tidak ada campaign cocok"
          description="Ubah kata kunci atau filter, atau tarik data terbaru dari halaman Bridge."
          action={
            <Button asChild size="sm" variant="outline">
              <Link to="/app/bridge">Buka Bridge</Link>
            </Button>
          }
        />
      ) : (
        <Panel flush>
          <TableShell
            cols={COLS}
            minWidth="52rem"
            head={[
              "campaign",
              <SortHead
                key="s"
                label="skor"
                sortKey="score"
                activeSort={sort}
                direction={dir}
                onSort={sortBy}
              />,
              <SortHead
                key="c"
                label="cpm"
                sortKey="cpm"
                activeSort={sort}
                direction={dir}
                onSort={sortBy}
              />,
              <SortHead
                key="r"
                label="sisa budget"
                sortKey="remaining"
                activeSort={sort}
                direction={dir}
                onSort={sortBy}
              />,
              <SortHead
                key="p"
                label="pesaing"
                sortKey="clippers"
                activeSort={sort}
                direction={dir}
                onSort={sortBy}
              />,
              <SortHead
                key="v"
                label="min views"
                sortKey="minViews"
                activeSort={sort}
                direction={dir}
                onSort={sortBy}
              />,
            ]}
          >
            {rows.map((c) => {
              const remaining = remainingOf(c);
              return (
                <TableRow key={c._id} cols={COLS} to={`/app/campaign/${c._id}`}>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-medium">{c.title}</span>
                      {c.joined && <Status tone="info">diikuti</Status>}
                    </span>
                    <span className="mt-0.5 block truncate font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground/70">
                      {c.brand}
                      {c.category ? ` • ${c.category}` : ""}
                      {c.platforms?.length ? ` • ${c.platforms.join("/")}` : ""}
                      {c.status ? ` • ${c.status}` : ""}
                    </span>
                  </span>
                  <Score value={c.score} />
                  <span className="font-mono text-[12px] tabular-nums">
                    {formatRupiah(c.ratePerMillion)}
                  </span>
                  <span className="flex items-center gap-2">
                    <Meter
                      value={remaining}
                      tone={(remaining ?? 0) >= 50 ? "good" : (remaining ?? 0) >= 20 ? "warn" : "bad"}
                      className="w-10"
                    />
                    <span className="font-mono text-[12px] tabular-nums text-muted-foreground">
                      {remaining != null ? `${remaining}%` : "—"}
                    </span>
                  </span>
                  <span className="font-mono text-[12px] tabular-nums text-muted-foreground">
                    {formatNumber(c.clippers)}
                  </span>
                  <span className="font-mono text-[12px] tabular-nums text-muted-foreground">
                    {formatNumber(c.minViews)}
                  </span>
                </TableRow>
              );
            })}
          </TableShell>
        </Panel>
      )}
    </div>
  );
}
