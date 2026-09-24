import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Bullets,
  Field,
  KeyValue,
  KeyValueList,
  Meter,
  PageHeader,
  Panel,
  PanelLoading,
  Score,
  Status,
  TableRow,
  TableShell,
  toneForScore,
} from "@/components/shared";
import { formatNumber, formatRupiah } from "@/lib/utils";
import { ArrowLeft, BookmarkCheck, BookmarkPlus, ExternalLink, Zap } from "lucide-react";

const METRIC_COLS = "repeat(auto-fit, minmax(9rem, 1fr))";
const MATERI_COLS = "minmax(0,1fr) 6rem";

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const campaign = useQuery(
    api.queries.getCampaign,
    id ? { id: id as Id<"kontenCampaigns"> } : "skip"
  );
  const toggleJoined = useMutation(api.campaigns.toggleJoined);
  const createPlan = useMutation(api.brief.createPlan);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (campaign === undefined) {
    return (
      <div className="space-y-6">
        <div className="h-16 border-b border-border" />
        <PanelLoading />
      </div>
    );
  }

  if (campaign === null) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Campaign" title="Tidak ditemukan" />
        <Button asChild variant="outline" size="sm">
          <Link to="/app/scanner">
            <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke scanner
          </Link>
        </Button>
      </div>
    );
  }

  const c = campaign;
  const remaining =
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
      bolehDilakukan?: string[] | string;
      dilarangDilakukan?: string[] | string;
    };
  };
  const bd = raw.brief_detail;
  const materi = (bd?.materi ?? []).filter((m) => m?.url);
  const toList = (v?: string[] | string) =>
    (Array.isArray(v) ? v : (v ?? "").split("\n"))
      .map((x) => String(x ?? "").replace(/^[-•*–\d.)\s]+/, "").trim())
      .filter((x) => x.length > 2);
  const boleh = toList(bd?.bolehDilakukan);
  const dilarang = toList(bd?.dilarangDilakukan);
  const elemen = toList(bd?.elemenWajib);
  const hasBrief =
    Boolean(bd?.cta || bd?.narasi || bd?.captionWajib || bd?.targetAudiens) ||
    materi.length > 0 ||
    boleh.length > 0 ||
    dilarang.length > 0 ||
    elemen.length > 0;

  async function handleCreatePlan() {
    setBusy(true);
    setError(null);
    try {
      await createPlan({ campaignId: c._id });
      navigate("/app/autopilot");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message.replace("Uncaught Error: ", "")
          : "Rencana belum bisa disusun. Coba lagi."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Campaign"
        title={c.title}
        meta={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-mono text-[11px] uppercase tracking-[0.1em]">
              {c.brand}
              {c.category ? ` • ${c.category}` : ""}
              {c.platforms?.length ? ` • ${c.platforms.join("/")}` : ""}
            </span>
            <Status tone={c.joined ? "info" : "neutral"}>
              {c.joined ? "diikuti" : "belum diikuti"}
            </Status>
            <Status tone={c.status === "active" ? "good" : "neutral"}>{c.status ?? "—"}</Status>
          </span>
        }
        actions={
          <>
            <Button asChild variant="ghost" size="sm">
              <Link to="/app/scanner">
                <ArrowLeft className="h-3.5 w-3.5" /> Scanner
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleJoined({ campaignId: c._id })}
            >
              {c.joined ? (
                <BookmarkCheck className="h-3.5 w-3.5" />
              ) : (
                <BookmarkPlus className="h-3.5 w-3.5" />
              )}
              {c.joined ? "Batalkan ikut" : "Tandai diikuti"}
            </Button>
            <Button size="sm" onClick={handleCreatePlan} disabled={busy}>
              <Zap className="h-3.5 w-3.5" /> Susun rencana
            </Button>
          </>
        }
      />

      {error && (
        <div
          role="alert"
          className="border border-red-300/40 bg-red-300/5 px-4 py-3 text-[13px] text-red-200"
        >
          {error}
        </div>
      )}

      <Panel title="Skor & ekonomi" meta="bobot 35/30/20/15" flush>
        <div className="grid gap-px bg-border/70" style={{ gridTemplateColumns: METRIC_COLS }}>
          <div className="flex items-center justify-between gap-4 bg-card px-4 py-3.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              skor
            </span>
            <Score value={c.score} meterClassName="w-16" />
          </div>
          {[
            { label: "cpm", value: formatRupiah(c.ratePerMillion) },
            { label: "budget", value: formatRupiah(c.budget) },
            { label: "terpakai", value: formatRupiah(c.spent) },
            { label: "pesaing", value: `${formatNumber(c.clippers)} clipper` },
            { label: "min views", value: formatNumber(c.minViews) },
            { label: "durasi min", value: c.minDuration ? `${c.minDuration} dtk` : "—" },
            { label: "tipe", value: (c.campaignType ?? "cpm").toUpperCase() },
            { label: "deadline", value: c.deadline ?? "—" },
          ].map((m) => (
            <div
              key={m.label}
              className="flex items-center justify-between gap-4 bg-card px-4 py-3.5"
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {m.label}
              </span>
              <span className="font-mono text-[12px] tabular-nums">{m.value}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 border-t border-border px-4 py-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            sisa budget
          </span>
          <Meter
            value={remaining}
            tone={(remaining ?? 0) >= 50 ? "good" : (remaining ?? 0) >= 20 ? "warn" : "bad"}
            className="max-w-64"
          />
          <span className="font-mono text-[12px] tabular-nums">{remaining ?? "—"}%</span>
        </div>
      </Panel>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel
          title="Brief campaign"
          meta={hasBrief ? "dibaca dari konten.com" : "belum tersinkron"}
          flush
        >
          {!hasBrief ? (
            <div className="px-4 py-6 text-[13px] text-muted-foreground">
              <p>Detail brief belum ada di cache lokal.</p>
              <p className="mt-1.5">
                Jalankan bridge sync supaya Autopilot bisa menyusun rencana dari aturan asli
                campaign ini.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link to="/app/bridge">Buka bridge</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-5 px-4 py-4">
              <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
                {bd?.targetAudiens && (
                  <Field label="Target audiens">{bd.targetAudiens}</Field>
                )}
                {bd?.tujuanCampaign && <Field label="Tujuan">{bd.tujuanCampaign}</Field>}
              </div>

              {bd?.narasi && <Field label="Narasi wajib">{bd.narasi.slice(0, 900)}</Field>}
              {bd?.cta && (
                <Field label="CTA akhir video">
                  <span className="text-foreground">{bd.cta}</span>
                </Field>
              )}
              {bd?.captionWajib && <Field label="Caption wajib">{bd.captionWajib}</Field>}

              {elemen.length > 0 && (
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    Elemen wajib
                  </p>
                  <Bullets items={elemen} ordered className="mt-2.5" />
                </div>
              )}

              {(boleh.length > 0 || dilarang.length > 0) && (
                <div className="grid grid-cols-[minmax(0,1fr)] gap-5 border-t border-border pt-5 sm:grid-cols-2">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-emerald-300">
                      Boleh
                    </p>
                    <Bullets items={boleh} tone="good" empty="Brief tidak mencantumkan poin boleh." className="mt-2.5" />
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-red-300">
                      Dilarang
                    </p>
                    <Bullets items={dilarang} tone="bad" empty="Brief tidak mencantumkan larangan." className="mt-2.5" />
                  </div>
                </div>
              )}
            </div>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title="Materi disediakan" meta={`${materi.length} file`} flush>
            {materi.length === 0 ? (
              <p className="px-4 py-5 text-[13px] text-muted-foreground">
                Tidak ada materi terlampir pada brief ini.
              </p>
            ) : (
              <TableShell cols={MATERI_COLS} minWidth="24rem" head={["materi", "aksi"]}>
                {materi.slice(0, 12).map((m) => (
                  <TableRow key={m.url} cols={MATERI_COLS}>
                    <span className="truncate text-[13px]">{m.title ?? "Materi"}</span>
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-primary"
                    >
                      buka <ExternalLink className="h-3 w-3" />
                    </a>
                  </TableRow>
                ))}
              </TableShell>
            )}
          </Panel>

          <Panel title="Kepatuhan">
            <KeyValueList>
              <KeyValue label="status">
                <Status tone={c.status === "active" ? "good" : "neutral"}>{c.status ?? "—"}</Status>
              </KeyValue>
              <KeyValue label="skor autopilot">
                <Status tone={toneForScore(c.score)}>{c.score} / 100</Status>
              </KeyValue>
              <KeyValue label="hashtag wajib" mono>
                {(c.hashtags ?? []).length > 0
                  ? (c.hashtags ?? []).map((h) => `#${h}`).join(" ")
                  : "—"}
              </KeyValue>
              <KeyValue label="do & don't" mono>
                {boleh.length} boleh • {dilarang.length} dilarang
              </KeyValue>
            </KeyValueList>
            <Button asChild size="sm" className="mt-4 w-full">
              <a
                href={`https://konten.com/clipper-campaigns/${c.slug}`}
                target="_blank"
                rel="noreferrer"
              >
                Buka brief di konten.com <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </Panel>
        </div>
      </div>
    </div>
  );
}
