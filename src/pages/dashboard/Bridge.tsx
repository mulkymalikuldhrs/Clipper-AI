import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  CopyButton,
  KeyValue,
  KeyValueList,
  MetricStrip,
  PageHeader,
  Panel,
  Status,
  TableRow,
  TableShell,
} from "@/components/shared";
import { formatNumber, timeAgo } from "@/lib/utils";
import { useWorkspace } from "@/lib/useWorkspace";
import { Database, ShieldCheck, Terminal } from "lucide-react";

const LOG_COLS = "5rem minmax(0,0.6fr) minmax(0,1fr) 4.5rem 5rem";

const ENV_SNIPPET = `# .env.local di mesinmu (file ini di-gitignore):
KONTEN_EMAIL=kamu@email.com
KONTEN_PASSWORD=********
# atau mode cookies (tanpa password):
KONTEN_COOKIES_JSON=[{"name":"sb-...","value":"...","domain":".konten.com"}]
CLIPPER_AI_URL=<Convex HTTP actions URL>/ingest
INGEST_TOKEN=<token dari langkah 1>

# Content Rewards Discover (publik, tanpa cookie):
CONTENT_REWARDS_SYNC_EMAIL=kamu@email.com`;

const TOKEN_SNIPPET = `# Buat token acak, lalu daftarkan sebagai env Convex:
openssl rand -hex 24   # -> INGEST_TOKEN
bun convex env set INGEST_TOKEN <token>`;

const RUN_SNIPPET = `bun scripts/bridge-sync.ts               # konten.com, sekali jalan
bun run bridge:content-rewards            # Discover Content Rewards, read-only
# berkala (contoh tiap 30 menit):
*/30 * * * * cd /path/clipper-ai && bun scripts/bridge-sync.ts`;

export default function Bridge() {
  const { args: workspaceArgs } = useWorkspace();
  const snapshot = useQuery(api.queries.getSnapshot, workspaceArgs);
  const logs = useQuery(api.queries.getSyncLogs, workspaceArgs);
  const workspace = useQuery(api.queries.getWorkspaceContext, workspaceArgs);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Bridge"
        title="Sambungan akun konten.com"
        meta="Bridge berjalan di mesinmu dengan Playwright: memakai sesi marketplace milikmu, membaca dashboard clipper, lalu push ke workspace ini."
        actions={<Status tone="good">live bridge only</Status>}
      />

      <MetricStrip
        items={[
          {
            label: "Sync terakhir",
            value: snapshot ? timeAgo(snapshot.fetchedAt) : "belum pernah",
            hint: snapshot?.source ? `sumber ${snapshot.source}` : undefined,
          },
          {
            label: "Campaign cache",
            value: formatNumber((snapshot?.campaigns as unknown[] | undefined)?.length ?? 0),
          },
          { label: "Aktivitas sync", value: String(logs?.length ?? 0) },
          {
            label: "Notifikasi",
            value: snapshot?.notifications != null ? String(snapshot.notifications) : "—",
          },
          {
            label: "Status ingest",
            value: snapshot ? (snapshot.source === "bridge" ? "live" : "external") : "kosong",
          },
        ]}
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        <div className="space-y-6">
          <Panel title="Status snapshot">
            <KeyValueList>
              <KeyValue label="terakhir sync" mono>
                {snapshot ? timeAgo(snapshot.fetchedAt) : "belum pernah"}
              </KeyValue>
              <KeyValue label="sumber" mono>
                {snapshot?.source ?? "—"}
              </KeyValue>
              <KeyValue label="cache campaign" mono>
                {formatNumber((snapshot?.campaigns as unknown[] | undefined)?.length ?? 0)}
              </KeyValue>
              <KeyValue label="joined mirror" mono>
                {formatNumber((snapshot?.joined as unknown[] | undefined)?.length ?? 0)}
              </KeyValue>
              <KeyValue label="notifikasi" mono>
                {snapshot?.notifications != null ? String(snapshot.notifications) : "—"}
              </KeyValue>
            </KeyValueList>
          </Panel>

          <Panel title="Sumber data">
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              Tidak ada data sintetis di console. Campaign, brief, analytics, dan earnings hanya muncul setelah
              bridge lokal membaca sumber nyata dan mengirim snapshot.
            </p>
            <div className="mt-4 border border-border bg-background/40 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
              source policy: bridge / own session only + public Content Rewards discovery
            </div>
          </Panel>

          <Panel title="Prinsip keamanan" className="border-emerald-500/25">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
              <ul className="space-y-2 text-[13px] leading-relaxed text-muted-foreground">
                <li>Kredensial dan cookies hanya ada di mesinmu, tidak pernah masuk repo.</li>
                <li>Bridge hanya membaca dashboard milikmu dan menulis ke workspace-mu.</li>
                <li>Tanpa bot views atau engagement — itu melanggar aturan campaign.</li>
                <li>Submit video tetap dilakukan olehmu di marketplace asal.</li>
                <li>Content Rewards hanya memakai endpoint Discover publik; tidak ada cookie, join, atau submit.</li>
              </ul>
            </div>
          </Panel>
        </div>

        <Panel title="Cara sync" meta="tiga langkah" flush>
          <div className="divide-y divide-border/60">
            <Step n="01" title="Siapkan token ingest">
              <CodeBlock code={TOKEN_SNIPPET} />
            </Step>
            <Step n="02" title="Isi kredensial bridge">
              <CodeBlock code={ENV_SNIPPET} />
            </Step>
            <Step n="03" title="Jalankan sync">
              <CodeBlock code={RUN_SNIPPET} />
            </Step>
          </div>
        </Panel>
      </div>

      <Panel
        title="Riwayat sync"
        meta={`${logs?.length ?? 0} aktivitas`}
        actions={<Database className="h-3.5 w-3.5 text-muted-foreground" />}
        flush
      >
        {!logs || logs.length === 0 ? (
          <p className="px-4 py-6 text-[13px] text-muted-foreground">
            Belum ada aktivitas sync tercatat.
          </p>
        ) : (
          <TableShell
            cols={LOG_COLS}
            minWidth="46rem"
            head={["waktu", "sumber", "pesan", "halaman", "status"]}
          >
            {logs.map((l) => (
              <TableRow key={l._id} cols={LOG_COLS}>
                <span className="font-mono text-[12px] text-muted-foreground">{timeAgo(l.at)}</span>
                <span className="truncate font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                  {l.source}
                </span>
                <span className="truncate text-muted-foreground">{l.message ?? "—"}</span>
                <span className="font-mono text-[12px] tabular-nums text-muted-foreground">
                  {l.pages != null ? l.pages : "—"}
                </span>
                <Status
                  tone={l.status === "ok" ? "good" : l.status === "pending" ? "info" : "bad"}
                >
                  {l.status}
                </Status>
              </TableRow>
            ))}
          </TableShell>
        )}
      </Panel>
    </div>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-2.5">
        <span className="font-mono text-[10px] tabular-nums text-primary">{n}</span>
        <span className="text-[13px] font-medium">{title}</span>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-background/50">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          <Terminal className="h-3 w-3" /> shell
        </span>
        <CopyButton text={code} />
      </div>
      <pre className="overflow-x-auto px-3 py-2.5 font-mono text-[11px] leading-relaxed text-muted-foreground">
        {code}
      </pre>
    </div>
  );
}
