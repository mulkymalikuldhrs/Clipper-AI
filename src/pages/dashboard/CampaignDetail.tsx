import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader, ScoreRing } from "@/components/shared";
import { formatRupiah, formatNumber } from "@/lib/utils";
import {
  Clapperboard,
  ExternalLink,
  BookmarkPlus,
  BookmarkCheck,
  ArrowLeft,
  Hash,
  Clock,
  Users,
  Wallet,
  Eye,
} from "lucide-react";

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const campaign = useQuery(api.queries.getCampaign, id ? { id: id as Id<"kontenCampaigns"> } : "skip");
  const toggleJoined = useMutation(api.campaigns.toggleJoined);
  const createPlan = useMutation(api.brief.createPlan);
  const [busy, setBusy] = useState(false);

  if (campaign === undefined) {
    return <div className="h-64 animate-pulse rounded-xl bg-muted" />;
  }
  if (campaign === null) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/app/scanner">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Scanner
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground">Campaign tidak ditemukan.</p>
      </div>
    );
  }

  const c = campaign;
  const remainingPct =
    c.budget != null && c.budget > 0
      ? Math.max(0, Math.round(((c.budget - (c.spent ?? 0)) / c.budget) * 100))
      : c.remainingPct;
  const raw = (c.raw ?? {}) as {
    brief_detail?: {
      cta?: string;
      narasi?: string;
      captionWajib?: string;
      elemenWajib?: string;
      targetAudiens?: string;
      tujuanCampaign?: string;
      materi?: { title?: string; url?: string }[];
      bolehDilakukan?: string[];
      dilarangDilakukan?: string[];
    };
  };
  const bd = raw.brief_detail;
  const materi = (bd?.materi ?? []).filter((m) => m?.url);
  const toList = (v?: string[] | string) =>
    (Array.isArray(v) ? v : (v ?? "").split("\n"))
      .map((x) => x.replace(/^[-•*–\d.)\s]+/, "").trim())
      .filter((x) => x.length > 2);
  const boleh = toList(bd?.bolehDilakukan);
  const dilarang = toList(bd?.dilarangDilakukan);

  async function handleCreatePlan() {
    setBusy(true);
    try {
      await createPlan({ campaignId: c._id });
      navigate("/app/autopilot");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/app/scanner">
          <ArrowLeft className="h-4 w-4" /> Scanner
        </Link>
      </Button>

      <PageHeader
        title={c.title}
        subtitle={`${c.brand} • ${c.category ?? "Umum"} • ${(c.platforms ?? []).join(" / ")}`}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleJoined({ campaignId: c._id })}
            >
              {c.joined ? <BookmarkCheck className="h-4 w-4" /> : <BookmarkPlus className="h-4 w-4" />}
              {c.joined ? "Diikuti" : "Tandai Diikuti"}
            </Button>
            <Button asChild size="sm">
              <a
                href={`https://konten.com/clipper-campaigns/${c.slug}`}
                target="_blank"
                rel="noreferrer"
              >
                Buka di konten.com <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Skor Autopilot</CardTitle>
            <CardDescription>
              35% CPM • 30% likuiditas budget • 20% kompetisi • 15% syarat views
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <ScoreRing score={c.score} size={92} />
            <div className="grid flex-1 grid-cols-2 md:grid-cols-3 gap-4">
              <Stat icon={Wallet} label="CPM" value={formatRupiah(c.ratePerMillion)} />
              <Stat icon={Wallet} label="Budget" value={formatRupiah(c.budget)} />
              <Stat
                icon={Wallet}
                label="Terpakai"
                value={`${formatRupiah(c.spent)}${remainingPct != null ? ` (${remainingPct}% sisa)` : ""}`}
              />
              <Stat icon={Users} label="Kompetisi" value={`${formatNumber(c.clippers)} clipper`} />
              <Stat icon={Eye} label="Min Views" value={formatNumber(c.minViews)} />
              <Stat icon={Clock} label="Durasi Min." value={c.minDuration ? `${c.minDuration} dtk` : "-"} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tipe</span>
              <Badge variant="info">{(c.campaignType ?? "cpm").toUpperCase()}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={c.status === "active" ? "success" : "secondary"}>
                {c.status ?? "-"}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Deadline</span>
              <span className="font-medium">{c.deadline ?? "Tidak ada"}</span>
            </div>
            <div className="pt-2">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Hash className="h-3 w-3" /> Hashtag wajib
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(c.hashtags ?? []).map((h) => (
                  <Badge key={h} variant="outline" className="font-mono text-[10px]">
                    #{h}
                  </Badge>
                ))}
              </div>
            </div>
            <Button className="w-full mt-2" onClick={handleCreatePlan} disabled={busy}>
              <Clapperboard className="h-4 w-4" />
              Susun Rencana Autopilot
            </Button>
          </CardContent>
        </Card>
      </div>

      {(bd?.cta || bd?.narasi || materi.length > 0 || boleh.length > 0 || dilarang.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Brief campaign (dari bridge)</CardTitle>
            <CardDescription>
              Dibaca otomatis dari halaman detail campaign di konten.com. Rencana produksi lengkap dibuat di Brief Autopilot.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-1.5">
              {bd?.targetAudiens && <Badge variant="secondary">Audiens: {bd.targetAudiens}</Badge>}
              {bd?.tujuanCampaign && <Badge variant="secondary">Tujuan: {bd.tujuanCampaign}</Badge>}
              {materi.length > 0 && <Badge variant="info">{materi.length} materi</Badge>}
            </div>

            {bd?.cta && (
              <div>
                <p className="font-mono text-[10px] uppercase text-muted-foreground mb-1">CTA</p>
                <p className="whitespace-pre-line">{bd.cta}</p>
              </div>
            )}
            {bd?.narasi && (
              <div>
                <p className="font-mono text-[10px] uppercase text-muted-foreground mb-1">Narasi wajib</p>
                <p className="whitespace-pre-line text-muted-foreground">{bd.narasi.slice(0, 600)}</p>
              </div>
            )}

            {materi.length > 0 && (
              <div>
                <p className="font-mono text-[10px] uppercase text-muted-foreground mb-2">
                  Materi yang disediakan
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {materi.slice(0, 8).map((m) => (
                    <a
                      key={m.url}
                      href={m.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-lg border p-2.5 hover:border-primary/40 transition-colors"
                    >
                      <span className="text-xs font-medium truncate">{m.title ?? "Materi"}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {(boleh.length > 0 || dilarang.length > 0) && (
              <div className="grid gap-3 sm:grid-cols-2">
                {boleh.length > 0 && (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                    <p className="text-[10px] font-mono uppercase text-emerald-300 mb-2">Boleh</p>
                    <ul className="space-y-1.5 text-xs text-muted-foreground">
                      {boleh.slice(0, 5).map((b, i) => (
                        <li key={i}>• {b}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {dilarang.length > 0 && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                    <p className="text-[10px] font-mono uppercase text-destructive mb-2">Dilarang</p>
                    <ul className="space-y-1.5 text-xs text-muted-foreground">
                      {dilarang.slice(0, 5).map((d, i) => (
                        <li key={i}>• {d}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-mono uppercase text-muted-foreground flex items-center gap-1">
        <Icon className="h-3 w-3" /> {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold">{value || "-"}</p>
    </div>
  );
}
