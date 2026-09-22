import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useAuthActions } from "@convex-dev/auth/react";
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scissors, Radar, Rocket, Loader2 } from "lucide-react";

export default function Auth() {
  const { signIn } = useAuthActions();
  const seedDemo = useAction(api.demo.seedDemo);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const returnTo = params.get("returnTo") ?? "/app";

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
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-10 border-r border-border grid-bg">
        <Link to="/" className="flex items-center gap-2 w-fit">
          <div className="h-9 w-9 rounded-lg bg-primary/15 border border-primary/30 grid place-items-center">
            <Scissors className="h-4 w-4 text-primary" />
          </div>
          <span className="font-bold tracking-tight text-lg">Super Clipper</span>
        </Link>

        <div className="max-w-md space-y-6">
          <Badge variant="success" className="font-mono">AI AUTOPILOT • KONTEN.COM</Badge>
          <h1 className="text-4xl font-black leading-tight tracking-tight">
            Mesin clipping yang <span className="text-gradient">bekerja saat kamu tidur.</span>
          </h1>
          <div className="space-y-4 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <Radar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p>Scan seluruh campaign konten.com, skor otomatis, pilih yang paling menguntungkan.</p>
            </div>
            <div className="flex gap-3">
              <Rocket className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <p>Brief diubah jadi rencana produksi: shotlist, hook, caption, hashtag, checklist kepatuhan.</p>
            </div>
          </div>
        </div>

        <p className="font-mono text-xs text-muted-foreground">
          v2.0 — bridge resmi akunmu sendiri. Tanpa API tanpa izin.
        </p>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-glow">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">
              {mode === "signIn" ? "Masuk ke ruang kerja" : "Buat akun clipper"}
            </CardTitle>
            <CardDescription>
              {mode === "signIn"
                ? "Sinkronkan campaign, earnings, dan rencana autopilot-mu."
                : "Gratis. Data demo langsung tersedia setelah daftar."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              {mode === "signUp" && (
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nama</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama kamu" />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kamu@email.com"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="minimal 8 karakter"
                  autoComplete={mode === "signIn" ? "current-password" : "new-password"}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "signIn" ? "Masuk" : "Daftar & isi demo"}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              {mode === "signIn" ? "Belum punya akun? " : "Sudah punya akun? "}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "signIn" ? "signUp" : "signIn");
                  setError(null);
                }}
                className="text-primary hover:underline font-medium"
              >
                {mode === "signIn" ? "Daftar" : "Masuk"}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
