import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BackendUnreachable,
  CopyButton,
  KeyValue,
  KeyValueList,
  MetricStrip,
  Meter,
  MonoLabel,
  PageHeader,
  Panel,
  PanelLoading,
  Status,
  TableRow,
  TableShell,
} from "@/components/shared";
import { formatNumber, timeAgo } from "@/lib/utils";
import { useBackendReachable, useWorkspace } from "@/lib/useWorkspace";
import { apiBaseUrl } from "@/lib/convexUrl";
import { generateApiKey, isApiKeySecret } from "@/lib/apiKeys";
import { PLANS, planFor } from "@/lib/plans";
import { Eye, EyeOff, KeyRound, Plus, ShieldAlert, Trash2 } from "lucide-react";

const KEY_COLS = "minmax(0,1fr) 8rem 6rem 8rem 5rem";

function maskedWorkspaceKey(key: string): string {
  return key.length <= 12 ? key : `${key.slice(0, 6)}…${key.slice(-4)}`;
}

function errorText(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message.replace("Uncaught Error: ", "") : fallback;
}

export default function Platform() {
  const { key: workspaceKey, args: workspaceArgs } = useWorkspace();
  const reachable = useBackendReachable();
  const overview = useQuery(api.platform.getPlatformOverview, workspaceArgs);
  const keyRows = useQuery(api.platform.listApiKeys, workspaceArgs);
  const createApiKey = useMutation(api.platform.createApiKey);
  const revokeApiKey = useMutation(api.platform.revokeApiKey);

  const [label, setLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<{ secret: string; prefix: string; label: string } | null>(null);
  const [revealKey, setRevealKey] = useState(false);

  async function handleCreate() {
    if (creating) return;
    setCreating(true);
    setError(null);
    try {
      // The plaintext is minted and hashed here; only the hash travels to the server.
      const generated = await generateApiKey();
      const created = await createApiKey({
        label: label.trim() || "Console key",
        prefix: generated.prefix,
        hash: generated.hash,
        scopes: ["read"],
        ...workspaceArgs,
      });
      setIssued({ secret: generated.secret, prefix: created.prefix, label: created.label });
      setLabel("");
    } catch (err) {
      setError(errorText(err, "API key tidak bisa dibuat."));
    } finally {
      setCreating(false);
    }
  }

  if (!reachable) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Platform" title="Workspace, plan, dan API" />
        <BackendUnreachable />
      </div>
    );
  }

  if (overview === undefined || keyRows === undefined) {
    return (
      <div className="space-y-6">
        <div className="h-16 border-b border-border" />
        <PanelLoading />
      </div>
    );
  }

  const plan = overview.hasWorkspace ? overview.plan : planFor(undefined);
  const usage = overview.hasWorkspace ? overview.usage : { plans: 0, goals: 0, activeApiKeys: 0, totalApiKeys: 0, apiRequests24h: 0 };
  const activeKeys = keyRows.filter((row) => !row.revokedAt);
  const base = apiBaseUrl();
  const curl = `curl -s "${base}/workspace" \\
  -H "Authorization: Bearer <api-key>"`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform"
        title="Workspace, plan, dan API"
        meta="Identitas, kuota yang benar-benar ditegakkan, dan API baca untuk automation. Tidak ada billing di sini: limit dijalankan oleh kode, bukan ditagihkan."
        actions={<Status tone={overview.hasWorkspace ? "good" : "warn"}>{overview.hasWorkspace ? "workspace aktif" : "workspace belum tertulis"}</Status>}
      />

      <MetricStrip
        items={[
          { label: "Plan", value: plan.name, hint: `maks ${formatNumber(plan.maxPlans)} rencana` },
          { label: "Rencana", value: `${formatNumber(usage.plans)}/${formatNumber(plan.maxPlans)}`, hint: "produksi tersimpan" },
          { label: "Goal", value: `${formatNumber(usage.goals)}/${formatNumber(plan.maxGoals)}`, hint: "organism queue" },
          { label: "API key", value: `${formatNumber(usage.activeApiKeys)}/${formatNumber(plan.maxApiKeys)}`, hint: `${usage.totalApiKeys} total terdaftar` },
          { label: "API 24 jam", value: formatNumber(usage.apiRequests24h), hint: `kuota ${formatNumber(plan.apiRequestsPerDay)}/hari` },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Panel title="Identitas workspace">
          <KeyValueList>
            <KeyValue label="workspace key" mono>
              <span className="inline-flex items-center gap-2">
                {revealKey ? workspaceKey : maskedWorkspaceKey(workspaceKey)}
                <button
                  type="button"
                  onClick={() => setRevealKey((value) => !value)}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={revealKey ? "Sembunyikan workspace key" : "Tampilkan workspace key"}
                >
                  {revealKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </span>
            </KeyValue>
            <KeyValue label="plan" mono>
              {plan.id}
            </KeyValue>
            <KeyValue label="scope baca" mono>
              discovery publik + mirror milikmu
            </KeyValue>
          </KeyValueList>
          <div className="mt-4 flex gap-3 border border-amber-500/25 bg-amber-300/5 px-3 py-2.5">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              Workspace key adalah capability, bukan tampilan. Siapa pun yang memegangnya bisa menulis ke
              workspace ini. Jangan tempelkan ke issue, chat, atau screenshot. Menghapus data situs berarti
              workspace baru dan state lama tidak bisa dipulihkan.
            </p>
          </div>
        </Panel>

        <Panel title="Kuota plan" meta="ditegakkan di mutation, bukan di copy">
          <div className="space-y-4">
            {[
              { label: "Rencana produksi", used: usage.plans, max: plan.maxPlans },
              { label: "Goal organisme", used: usage.goals, max: plan.maxGoals },
              { label: "API key aktif", used: usage.activeApiKeys, max: plan.maxApiKeys },
              { label: "API request 24 jam", used: usage.apiRequests24h, max: plan.apiRequestsPerDay },
            ].map((row) => {
              const pct = row.max > 0 ? Math.round((row.used / row.max) * 100) : 0;
              return (
                <div key={row.label}>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                      {row.label}
                    </span>
                    <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                      {formatNumber(row.used)} / {formatNumber(row.max)}
                    </span>
                  </div>
                  <Meter value={pct} tone={pct >= 90 ? "bad" : pct >= 70 ? "warn" : "good"} className="mt-2" />
                </div>
              );
            })}
          </div>
          <div className="mt-5 divide-y divide-border/60 border-t border-border pt-1">
            {Object.values(PLANS).map((candidate) => (
              <div key={candidate.id} className="flex items-baseline justify-between gap-4 py-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.1em]">
                  {candidate.name}
                  {candidate.id === plan.id ? " ← aktif" : ""}
                </span>
                <span className="text-right text-[11px] text-muted-foreground">{candidate.summary}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">
            Perpindahan plan dilakukan operator, bukan tombol upgrade, karena belum ada payment provider
            yang terpasang. Console tidak akan menampilkan tombol yang tidak bisa menagih.
          </p>
        </Panel>
      </div>

      <Panel
        title="API key"
        meta={`${activeKeys.length} aktif • hash SHA-256 saja yang disimpan`}
        actions={
          <div className="flex items-center gap-2">
            <Input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Label key"
              aria-label="Label API key"
              className="h-7 w-40 text-[12px]"
            />
            <Button size="sm" onClick={handleCreate} disabled={creating}>
              <Plus className="h-3.5 w-3.5" /> {creating ? "Membuat…" : "Buat API key"}
            </Button>
          </div>
        }
        flush
      >
        {error && (
          <div role="alert" className="border-b border-red-300/30 bg-red-300/5 px-4 py-2.5 text-[12px] text-red-200">
            {error}
          </div>
        )}

        {issued && (
          <div className="border-b border-primary/30 bg-primary/5 px-4 py-3">
            <MonoLabel>API key baru — hanya tampil sekali</MonoLabel>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <code className="min-w-0 break-all font-mono text-[12px] text-primary">
                {isApiKeySecret(issued.secret) ? issued.secret : issued.prefix}
              </code>
              <CopyButton text={issued.secret} label="Salin key" />
              <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px]" onClick={() => setIssued(null)}>
                Sudah kusimpan
              </Button>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
              Server hanya menyimpan hash-nya. Kalau key ini hilang, buat key baru dan cabut yang lama.
            </p>
          </div>
        )}

        {keyRows.length === 0 ? (
          <div className="px-4 py-6">
            <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <KeyRound className="h-4 w-4" /> Belum ada API key untuk workspace ini.
            </p>
          </div>
        ) : (
          <TableShell cols={KEY_COLS} head={["label", "prefix", "scope", "dipakai", "status"]} minWidth="44rem">
            {keyRows.map((row) => (
              <TableRow key={row._id} cols={KEY_COLS}>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{row.label}</span>
                  <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">
                    dibuat {timeAgo(row.createdAt)}
                  </span>
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">{row.prefix}…</span>
                <span className="font-mono text-[11px] text-muted-foreground">{row.scopes.join(", ")}</span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {row.lastUsedAt ? timeAgo(row.lastUsedAt) : "belum"}
                </span>
                {row.revokedAt ? (
                  <Status tone="neutral">dicabut</Status>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 justify-start px-1 text-[11px] text-muted-foreground hover:text-red-200"
                    onClick={() => {
                      setError(null);
                      revokeApiKey({ keyId: row._id, ...workspaceArgs }).catch((err) =>
                        setError(errorText(err, "Gagal mencabut API key."))
                      );
                    }}
                  >
                    <Trash2 className="h-3 w-3" /> Cabut
                  </Button>
                )}
              </TableRow>
            ))}
          </TableShell>
        )}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Panel title="HTTP API v1" meta="read-only, bearer key, termeter">
          <div className="space-y-3">
            <KeyValueList>
              <KeyValue label="GET" mono>{`${base}/workspace`}</KeyValue>
              <KeyValue label="GET" mono>{`${base}/campaigns?limit=25`}</KeyValue>
              <KeyValue label="GET" mono>{`${base}/plans?limit=25`}</KeyValue>
            </KeyValueList>
            <div className="overflow-hidden rounded-md border border-border bg-background/50">
              <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
                <MonoLabel>shell</MonoLabel>
                <CopyButton text={curl} />
              </div>
              <pre className="overflow-x-auto px-3 py-2.5 font-mono text-[11px] leading-relaxed text-muted-foreground">
                {curl}
              </pre>
            </div>
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              Setiap request dihitung ke kuota harian plan dan dicatat di usage meter. Respons
              menyertakan <span className="font-mono">apiVersion</span>; key yang dicabut langsung
              ditolak dengan 401, dan kuota habis menghasilkan 429.
            </p>
          </div>
        </Panel>

        <Panel title="Batas yang jujur" className="border-amber-500/25">
          <ul className="space-y-2.5 text-[13px] leading-relaxed text-muted-foreground">
            <li>
              <span className="text-foreground">Belum ada billing.</span> Plan ada, limitnya nyata,
              tetapi tidak ada tagihan, invoice, atau payment provider terpasang.
            </li>
            <li>
              <span className="text-foreground">Bukan IaaS.</span> Tidak ada compute, container, atau
              storage yang di-provision. Satu-satunya eksekusi berat tetap proses lokal operator
              (bridge dan daemon).
            </li>
            <li>
              <span className="text-foreground">API read-only.</span> Automation boleh membaca campaign
              dan rencana; publish, submit, dan spending tetap keputusan manusia.
            </li>
            <li>
              <span className="text-foreground">Belum ada tenancy keras.</span> Isolasi data berbasis
              scope di aplikasi, bukan cluster atau database per tenant.
            </li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}
