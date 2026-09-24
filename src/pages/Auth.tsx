import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useAuthActions } from "@convex-dev/auth/react";
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyValue, KeyValueList, MonoLabel, Status } from "@/components/shared";
import { ArrowLeft, Loader2, Scissors } from "lucide-react";

const SPECS: [string, string][] = [
  ["bridge", "playwright di mesinmu"],
  ["cakupan crawl", "124 halaman / 186 endpoint"],
  ["data demo", "20 campaign asli + 114 materi"],
  ["submission", "kamu yang submit di konten.com"],
];

export default function Auth() {
  const { signIn } = useAuthActions();
  const seedDemo = useAction(api.demo.seedDemo);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const requestedReturnTo = params.get("returnTo");
  const returnTo =
    requestedReturnTo && requestedReturnTo.startsWith("/") && !requestedReturnTo.startsWith("//")
      ? requestedReturnTo
      : "/app";

  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "signUp") {
        await signIn("password", { email, password, name, flow: "signUp" });
      } else {
        await signIn("password", { email, password, flow: "signIn" });
      }
      // Give the auth store a beat to attach tokens to the client before the action call.
      await new Promise((r) => setTimeout(r, 2200));
      try {
        await seedDemo({});
      } catch {
        /* demo seed optional — bisa diulang dari halaman Bridge */
      }
      navigate(returnTo, { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message.replace("Uncaught Error: ", "")
          : "Terjadi kesalahan. Coba lagi."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-[minmax(0,1fr)] lg:grid-cols-2">
      {/* Left: brand panel */}
      <aside className="hidden flex-col justify-between border-r border-border p-10 lg:flex">
        <Link to="/" className="flex w-fit items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-md border border-primary/25 bg-primary/10">
            <Scissors className="h-3.5 w-3.5 text-primary" />
          </span>
          <span className="leading-none">
            <span className="block text-[13px] font-semibold tracking-tight">Super Clipper</span>
            <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
              console v2
            </span>
          </span>
        </Link>

        <div className="max-w-md">
          <MonoLabel>Akses</MonoLabel>
          <h1 className="mt-2.5 text-2xl font-semibold leading-snug tracking-tight">
            Ruang kerja clipper, satu konsol.
          </h1>
          <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
            Campaign, brief, analitik, dan earnings dari dashboard konten.com milikmu dirapikan jadi
            satu alur kerja. Bridge berjalan di mesinmu; konsol ini hanya menampilkan hasilnya.
          </p>
          <div className="mt-6 border-t border-border pt-1">
            <KeyValueList>
              {SPECS.map(([k, v]) => (
                <KeyValue key={k} label={k}>
                  {v}
                </KeyValue>
              ))}
            </KeyValueList>
          </div>
        </div>

        <p className="font-mono text-[10px] leading-relaxed text-muted-foreground/60">
          bukan afiliasi konten.com
          <br />
          kredensial bridge tidak pernah meninggalkan mesinmu
        </p>
      </aside>

      {/* Right: form */}
      <main className="flex min-w-0 items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground lg:hidden"
          >
            <ArrowLeft className="h-3 w-3" /> beranda
          </Link>

          <div className="mt-6 flex items-center justify-between gap-3 border-b border-border pb-3 lg:mt-0">
            <MonoLabel>Akses akun</MonoLabel>
            <Status tone={busy ? "warn" : mode === "signIn" ? "neutral" : "primary"}>
              {busy ? "memproses" : mode === "signIn" ? "masuk" : "daftar"}
            </Status>
          </div>

          <h2 className="mt-5 text-lg font-semibold tracking-tight">
            {mode === "signIn" ? "Masuk ke ruang kerja" : "Buat akun clipper"}
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
            {mode === "signIn"
              ? "Lanjutkan dari campaign, earnings, dan rencana autopilot terakhirmu."
              : "Gratis. Data demo langsung terisi setelah akun dibuat."}
          </p>

          <form onSubmit={submit} className="mt-5 space-y-4">
            {mode === "signUp" && (
              <div className="space-y-1.5">
                <Label htmlFor="name" className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  Nama
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama kamu"
                  className="h-9 rounded-md shadow-none"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kamu@email.com"
                autoComplete="email"
                className="h-9 rounded-md shadow-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="minimal 8 karakter"
                autoComplete={mode === "signIn" ? "current-password" : "new-password"}
                className="h-9 rounded-md shadow-none"
              />
            </div>

            {error && (
              <p className="border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] leading-relaxed text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" className="h-9 w-full shadow-none" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signIn" ? "Masuk ke konsol" : "Buat akun & isi demo"}
            </Button>
          </form>

          <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
            <p className="text-[12px] text-muted-foreground">
              {mode === "signIn" ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "signIn" ? "signUp" : "signIn");
                  setError(null);
                }}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {mode === "signIn" ? "Daftar" : "Masuk"}
              </button>
            </p>
            <p className="font-mono text-[10px] text-muted-foreground/60">
              {mode === "signIn" ? "min. 8 karakter" : "langsung terisi demo"}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
