import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared";
import { timeAgo } from "@/lib/utils";
import { Cable, Database, ShieldCheck, Terminal, CheckCircle2, XCircle, Sparkles } from "lucide-react";

export default function Bridge() {
  const snapshot = useQuery(api.queries.getSnapshot, {});
  const logs = useQuery(api.queries.getSyncLogs, {});
  const seedDemo = useAction(api.demo.seedDemo);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Konten Bridge"
        subtitle="Sambungan resmi antara akun konten.com milikmu dan workspace Super Clipper."
        icon={Cable}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Terakhir sync" value={snapshot ? timeAgo(snapshot.fetchedAt) : "belum pernah"} />
            <Row label="Sumber" value={snapshot?.source ?? "-"} />
            <Row
              label="Campaign cache"
              value={String((snapshot?.campaigns as unknown[] | undefined)?.length ?? 0)}
            />
            <Row
              label="Notifikasi"
              value={snapshot?.notifications != null ? String(snapshot.notifications) : "-"}
            />
            <div className="pt-1">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => seedDemo({})}
              >
                <Sparkles className="h-4 w-4" /> Isi Data Demo (crawl nyata)
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                Mengisi workspace dengan 6 campaign asli hasil pemetaan 22 Sep 2026 — untuk mencoba semua fitur tanpa sync.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* How to sync */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Terminal className="h-4 w-4 text-primary" /> Cara Sync
            </CardTitle>
            <CardDescription>
              Bridge berjalan di komputermu dengan Playwright, login pakai kredensial/cookies milikmu, lalu push data ke sini.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">1. Set token ingest (sekali)</p>
              <pre className="rounded-lg border bg-background/60 p-3 text-xs font-mono overflow-x-auto">
{`# Buat token acak, lalu daftarkan sebagai env Convex:
openssl rand -hex 24   # -> INGEST_TOKEN
bun convex env set INGEST_TOKEN <token>`}
              </pre>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">2. Isi kredensial bridge (lokal, tidak masuk repo)</p>
              <pre className="rounded-lg border bg-background/60 p-3 text-xs font-mono overflow-x-auto">
{`# .env.local di folder proyek (file ini di-gitignore):
KONTEN_EMAIL=kamu@email.com
KONTEN_PASSWORD=********
# atau mode cookies (aman, tanpa password):
KONTEN_COOKIES_JSON=[{"name":"sb-...","value":"...","domain":".konten.com", ...}]
SUPERCLIPPER_URL=<Convex HTTP actions URL>/ingest
INGEST_TOKEN=<token dari langkah 1>`}
              </pre>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">3. Jalankan sync</p>
              <pre className="rounded-lg border bg-background/60 p-3 text-xs font-mono overflow-x-auto">
{`bun scripts/bridge-sync.ts        # sekali
# atau berkala (contoh tiap 30 menit via cron):
*/30 * * * * cd /path/super-clipper && bun scripts/bridge-sync.ts`}
              </pre>
            </div>
            <Separator />
            <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-4 flex gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground text-sm mb-1">Prinsip keamanan</p>
                Kredensial hanya ada di mesinmu (.env.local, di-gitignore). Data yang dikirim hanya
                mirror dashboard akunmu sendiri. Tidak ada bot views/engagement — sesuai aturan campaign.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sync log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" /> Riwayat Sync
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {(logs ?? []).length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">Belum ada aktivitas sync.</p>
          ) : (
            <div className="divide-y divide-border">
              {(logs ?? []).map((l) => (
                <div key={l._id} className="flex items-center gap-3 px-6 py-3">
                  {l.status === "ok" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive shrink-0" />
                  )}
                  <Badge variant="secondary" className="font-mono shrink-0">{l.source}</Badge>
                  <p className="text-sm flex-1 min-w-0 truncate">{l.message ?? "-"}</p>
                  {l.pages != null && (
                    <span className="text-xs text-muted-foreground shrink-0">{l.pages} hal.</span>
                  )}
                  <span className="text-xs text-muted-foreground shrink-0 w-20 text-right">
                    {timeAgo(l.at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
