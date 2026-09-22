import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, ScoreRing, EmptyState } from "@/components/shared";
import { formatRupiah, formatNumber } from "@/lib/utils";
import { Radar, Search, RefreshCw } from "lucide-react";

type SortKey = "score" | "cpm" | "budget" | "competition";

export default function Scanner() {
  const campaigns = useQuery(api.queries.listCampaigns, {});
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | "joined">("all");
  const [sort, setSort] = useState<SortKey>("score");

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
    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sort) {
        case "cpm":
          return (b.ratePerMillion ?? 0) - (a.ratePerMillion ?? 0);
        case "budget":
          return (b.budget ?? 0) - (a.spent ?? 0) - ((a.budget ?? 0) - (b.spent ?? 0));
        case "competition":
          return (a.clippers ?? 0) - (b.clippers ?? 0);
        default:
          return b.score - a.score;
      }
    });
    return sorted;
  }, [campaigns, q, tab, sort]);

  const loading = campaigns === undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaign Scanner"
        subtitle="Semua campaign terpantau, diskor otomatis dari CPM, sisa budget, kompetisi, dan syarat views."
        icon={Radar}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/app/bridge">
              <RefreshCw className="h-4 w-4" /> Sync ulang
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari judul, brand, kategori…"
            className="pl-9"
          />
        </div>
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="all">Semua</TabsTrigger>
            <TabsTrigger value="joined">Diikuti</TabsTrigger>
          </TabsList>
        </Tabs>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="score">Urut: Skor</option>
          <option value="cpm">Urut: CPM tertinggi</option>
          <option value="budget">Urut: Sisa budget</option>
          <option value="competition">Urut: Paling sedikit pesaing</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Radar}
          title="Tidak ada campaign"
          description="Jalankan bridge sync atau isi demo data dari halaman Bridge."
        />
      ) : (
        <div className="space-y-3">
          {rows.map((c) => {
            const remainingPct =
              c.budget != null && c.budget > 0
                ? Math.max(0, Math.round(((c.budget - (c.spent ?? 0)) / c.budget) * 100))
                : c.remainingPct;
            return (
              <Card key={c._id} className="hover:border-primary/40 transition-colors">
                <CardContent className="p-4">
                  <Link to={`/app/campaign/${c._id}`} className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <ScoreRing score={c.score} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold truncate">{c.title}</p>
                          {c.joined && <Badge variant="info">DIIKUTI</Badge>}
                          {c.status === "active" && !c.joined && (
                            <Badge variant="success">AKTIF</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {c.brand} • {c.category ?? "Umum"} •{" "}
                          {(c.platforms ?? []).join(", ")}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-6 text-right">
                      <div>
                        <p className="text-[10px] font-mono uppercase text-muted-foreground">CPM</p>
                        <p className="text-sm font-semibold">{formatRupiah(c.ratePerMillion)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-mono uppercase text-muted-foreground">Sisa Budget</p>
                        <p className="text-sm font-semibold">
                          {remainingPct != null ? `${remainingPct}%` : "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-mono uppercase text-muted-foreground">Clipper</p>
                        <p className="text-sm font-semibold">{formatNumber(c.clippers)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-mono uppercase text-muted-foreground">Min Views</p>
                        <p className="text-sm font-semibold">{formatNumber(c.minViews)}</p>
                      </div>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
