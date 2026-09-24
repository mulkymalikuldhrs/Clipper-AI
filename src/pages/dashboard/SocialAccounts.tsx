import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, Panel, Status, TableRow, TableShell, MonoLabel } from "@/components/shared";
import { ExternalLink, Plus, ShieldCheck, Trash2 } from "lucide-react";
import {
  loadSocialAccounts,
  removeSocialAccount,
  saveSocialAccounts,
  type SocialAccount,
  type SocialPlatform,
} from "@/lib/socialAccounts";

const ACCOUNT_COLS = "7rem minmax(0,1fr) 8rem 8rem 8rem 2rem";

export default function SocialAccounts() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [platform, setPlatform] = useState<SocialPlatform>("tiktok");
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => setAccounts(loadSocialAccounts()), []);

  const readyCount = useMemo(() => accounts.filter((account) => account.connection === "ready").length, [accounts]);

  function addAccount() {
    const name = displayName.trim();
    const normalizedHandle = handle.trim().replace(/^@/, "");
    if (!name || !normalizedHandle) {
      setNotice("Nama tampilan dan handle wajib diisi.");
      return;
    }
    if (profileUrl.trim()) {
      try {
        const parsed = new URL(profileUrl.trim());
        if (parsed.protocol !== "https:") throw new Error("unsafe protocol");
      } catch {
        setNotice("Profile URL harus memakai HTTPS.");
        return;
      }
    }
    const next: SocialAccount = {
      id: `${platform}-${Date.now()}`,
      platform,
      displayName: name.slice(0, 80),
      handle: `@${normalizedHandle.slice(0, 80)}`,
      profileUrl: profileUrl.trim(),
      connection: "not_configured",
      publishMode: "review_required",
      lastVerifiedAt: null,
    };
    const updated = [...accounts, next];
    saveSocialAccounts(updated);
    setAccounts(updated);
    setDisplayName("");
    setHandle("");
    setProfileUrl("");
    setNotice("Akun disimpan lokal. OAuth resmi masih diperlukan sebelum publish.");
  }

  function remove(id: string) {
    removeSocialAccount(id);
    setAccounts(loadSocialAccounts());
    setNotice("Akun dihapus dari konfigurasi browser.");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Social accounts"
        title="Konfigurasi akun publisher"
        meta="Simpan metadata akun lokal, lalu hubungkan melalui OAuth resmi. Token akses tidak pernah ditulis ke localStorage atau repository."
        actions={<Status tone={readyCount === accounts.length && accounts.length > 0 ? "good" : "info"}>{readyCount}/{accounts.length || 0} official-ready</Status>}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Panel title="Tambah akun" meta="metadata lokal">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="social-platform" className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Platform</Label>
              <select id="social-platform" value={platform} onChange={(event) => setPlatform(event.target.value as SocialPlatform)} className="h-9 w-full border border-border bg-background px-3 text-[13px] outline-none focus:border-primary">
                <option value="tiktok">TikTok</option>
                <option value="instagram">Instagram</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="social-name" className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Nama akun</Label>
              <Input id="social-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Nama tampilan" className="h-9 shadow-none" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="social-handle" className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Handle</Label>
              <Input id="social-handle" value={handle} onChange={(event) => setHandle(event.target.value)} placeholder="@handle" className="h-9 shadow-none" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="social-url" className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Profile URL</Label>
              <Input id="social-url" value={profileUrl} onChange={(event) => setProfileUrl(event.target.value)} placeholder="https://..." className="h-9 shadow-none" />
            </div>
            <Button onClick={addAccount} className="w-full shadow-none"><Plus className="h-4 w-4" /> Simpan akun</Button>
            {notice && <p className="border border-primary/30 bg-primary/5 px-3 py-2 text-[12px] leading-relaxed">{notice}</p>}
          </div>
        </Panel>

        <Panel title="Publish boundary" meta="official APIs only" flush>
          <div className="divide-y divide-border/60">
            <div className="p-4">
              <Status tone="info">review_required</Status>
              <p className="mt-2 text-[13px] leading-6 text-muted-foreground">Caption, media, dan campaign compliance harus disetujui sebelum request publish dikirim melalui API resmi.</p>
            </div>
            <div className="p-4">
              <Status tone="bad">not connected</Status>
              <p className="mt-2 text-[13px] leading-6 text-muted-foreground">Akun lokal belum memiliki OAuth token. Tombol koneksi resmi diaktifkan setelah app credentials dan redirect URI dikonfigurasi.</p>
            </div>
            <div className="p-4">
              <Status tone="good">safe by default</Status>
              <p className="mt-2 text-[13px] leading-6 text-muted-foreground">Tidak ada scraping credential, account takeover, fake engagement, atau upload otomatis dari UI ini.</p>
            </div>
          </div>
          <div className="border-t border-border/60 p-4">
            <MonoLabel>required setup</MonoLabel>
            <ul className="mt-2 space-y-1 text-[12px] leading-5 text-muted-foreground">
              <li>• TikTok Content Posting API app + OAuth approval</li>
              <li>• Meta Instagram API access + professional account</li>
              <li>• Server-side token exchange, audit log, rate limit, dan rollback</li>
            </ul>
          </div>
        </Panel>
      </div>

      <Panel title="Configured accounts" meta={`${accounts.length} account`} flush>
        {accounts.length === 0 ? (
          <p className="px-4 py-6 text-[13px] text-muted-foreground">Belum ada akun yang dikonfigurasi.</p>
        ) : (
          <TableShell cols={ACCOUNT_COLS} minWidth="54rem" head={["platform", "account", "handle", "connection", "publish mode", ""]}>
            {accounts.map((account) => (
              <TableRow key={account.id} cols={ACCOUNT_COLS}>
                <Status tone={account.platform === "tiktok" ? "info" : "primary"}>{account.platform}</Status>
                <span className="min-w-0"><span className="block truncate font-medium">{account.displayName}</span>{account.profileUrl && <a href={account.profileUrl} target="_blank" rel="noreferrer" className="mt-0.5 flex items-center gap-1 truncate text-[10px] text-primary hover:underline">profile <ExternalLink className="h-3 w-3" /></a>}</span>
                <span className="font-mono text-[11px]">{account.handle}</span>
                <Status tone={account.connection === "ready" ? "good" : "neutral"}>{account.connection === "ready" ? "official-ready" : "not_configured"}</Status>
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">{account.publishMode}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => remove(account.id)} aria-label={`Hapus ${account.displayName}`}><Trash2 className="h-3.5 w-3.5" /></Button>
              </TableRow>
            ))}
          </TableShell>
        )}
      </Panel>

      <div className="flex items-start gap-3 border border-border bg-card/30 p-4">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
        <p className="text-[12px] leading-5 text-muted-foreground">Autonomy dapat menyiapkan queue dan manifest secara otomatis. Eksekusi publish tetap review-gated sampai OAuth resmi, media valid, dan policy platform tersedia.</p>
      </div>
    </div>
  );
}
