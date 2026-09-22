import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useConvexAuth } from "convex/react";
import {
  Scissors,
  Radar,
  Clapperboard,
  BarChart3,
  Wallet,
  Cable,
  ArrowRight,
  Zap,
  ShieldCheck,
  TrendingUp,
  Target,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const FEATURES = [
  {
    icon: Radar,
    title: "Campaign Scanner",
    desc: "Tarik semua campaign aktif konten.com, hitung skor peluang: CPM, sisa budget, kompetisi clipper, dan syarat minimum views.",
  },
  {
    icon: Clapperboard,
    title: "Brief Autopilot",
    desc: "Brief campaign diubah otomatis jadi rencana produksi: hook, shotlist per detik, narasi wajib, caption + hashtag, checklist kepatuhan.",
  },
  {
    icon: BarChart3,
    title: "Analitik Views",
    desc: "Mirror timeseries views harian dan leaderboard top-clips untuk tahu apa yang sedang menang di campaign.",
  },
  {
    icon: Wallet,
    title: "Earnings Real-time",
    desc: "Pantau pending, diproses, dan withdraw-ready langsung dari dashboard — plus proyeksi payout per campaign.",
  },
  {
    icon: Cable,
    title: "Bridge Aman",
    desc: "Sinkronisasi lewat sesi akunmu sendiri (email/password atau cookies) via bridge lokal. Tanpa API tanpa izin, tanpa data pihak ketiga.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance Guard",
    desc: "Cek do & don'ts dari setiap brief sebelum kamu buang waktu produksi: elemen wajib, durasi, platform, aturan brand.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Hubungkan akun",
    desc: "Login atau tempel cookies sesi konten.com milikmu. Bridge menarik data campaign, earnings, dan analitik secara berkala.",
  },
  {
    n: "02",
    title: "Pilih campaign terbaik",
    desc: "Scanner memberi skor 0–100 untuk tiap campaign. Join yang layak, lewati yang jebakan. Join bisa dilakukan otomatis dari halaman detail.",
  },
  {
    n: "03",
    title: "Produksi ikut autopilot",
    desc: "Brief dipecah jadi shotlist, hook, caption, dan checklist. Kau tinggal eksekusi; submit ke konten.com, dan earnings tampil real-time.",
  },
];

const STATS = [
  { value: "Rp5.000", label: "CPM tertinggi terpantau" },
  { value: "Rp3.200.000", label: "Payout top clip terverifikasi" },
  { value: "11.900+", label: "Clipper di 1 campaign besar" },
  { value: "0", label: "Detik buang waktu di campaign zonk" },
];

export default function Landing() {
  const { isAuthenticated } = useConvexAuth();

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/15 border border-primary/30 grid place-items-center">
              <Scissors className="h-4 w-4 text-primary" />
            </div>
            <span className="font-bold tracking-tight">Super Clipper</span>
            <Badge variant="success" className="ml-1 hidden sm:inline-flex font-mono text-[10px]">
              v2.0
            </Badge>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#fitur" className="hover:text-foreground transition-colors">Fitur</a>
            <a href="#cara" className="hover:text-foreground transition-colors">Cara Kerja</a>
            <a href="#statistik" className="hover:text-foreground transition-colors">Data Lapangan</a>
          </nav>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Button asChild size="sm">
                <Link to="/app">Buka Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <Link to="/auth">Masuk</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/auth">Mulai Gratis</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-60" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-[42rem] rounded-full bg-primary/15 blur-3xl animate-pulse-glow" />
        <div className="container relative py-20 md:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center"
            >
              <Badge variant="outline" className="font-mono text-xs border-primary/40 text-primary gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
                AUTOPILOT UNTUK MARKETPLACE CLIPPING KONTEN.COM
              </Badge>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="mt-6 text-4xl md:text-6xl font-black tracking-tight leading-[1.05]"
            >
              Berhenti menebak campaign.
              <br />
              <span className="text-gradient">Mulai potong yang menghasilkan.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16 }}
              className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              Super Clipper menyelami dashboard konten.com untukmu: fetch campaign, baca brief,
              susun rencana produksi, pantau analitik dan earnings — otomatis, terstruktur,
              dan berbasis data lapangan nyata.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.24 }}
              className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <Button asChild size="lg" className="text-base px-8 h-12">
                <Link to="/auth">
                  Aktifkan Autopilot <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base">
                <a href="#fitur">Lihat Kemampuan</a>
              </Button>
            </motion.div>
            <p className="mt-4 text-xs font-mono text-muted-foreground">
              Gratis • data demo langsung aktif • bridge pakai sesi akunmu sendiri
            </p>
          </div>

          {/* Hero mock */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="mt-16 max-w-4xl mx-auto"
          >
            <Card className="border-glow overflow-hidden">
              <div className="flex items-center gap-1.5 border-b border-border bg-secondary/40 px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
                <span className="ml-3 font-mono text-[11px] text-muted-foreground">
                  super-clipper / scanner — 6 campaign terpantau
                </span>
              </div>
              <CardContent className="p-0">
                <div className="divide-y divide-border font-mono text-xs md:text-sm">
                  {[
                    { t: "Owner — Artha ldt", s: 92, cpm: "Rp5rb", b: "100%", c: "135" },
                    { t: "Growlab — Beyond The Podcast", s: 81, cpm: "Rp3rb", b: "100%", c: "154" },
                    { t: "Bevan — Education Clips", s: 64, cpm: "Rp3rb", b: "91%", c: "4.681" },
                    { t: "IBU, Bagaimana aku Tanpamu", s: 41, cpm: "Rp2rb", b: "31%", c: "11.936" },
                  ].map((r) => (
                    <div key={r.t} className="flex items-center gap-3 px-4 md:px-6 py-3.5">
                      <span
                        className="h-8 w-8 rounded-full grid place-items-center text-[11px] font-bold shrink-0"
                        style={{
                          background: `conic-gradient(${r.s >= 70 ? "#34d399" : r.s >= 45 ? "#fbbf24" : "#f87171"} ${r.s * 3.6}deg, hsl(190 30% 14%) 0deg)`,
                        }}
                      >
                        <span className="h-6 w-6 rounded-full bg-card grid place-items-center">{r.s}</span>
                      </span>
                      <span className="flex-1 truncate font-sans font-medium">{r.t}</span>
                      <span className="hidden sm:inline text-muted-foreground">CPM {r.cpm}</span>
                      <span className="hidden md:inline text-muted-foreground">budget {r.b}</span>
                      <span className="hidden lg:inline text-muted-foreground">{r.c} clipper</span>
                      <Badge variant={r.s >= 70 ? "success" : r.s >= 45 ? "warning" : "destructive"}>
                        {r.s >= 70 ? "LAYAK" : r.s >= 45 ? "Pertimbangkan" : "Zonk"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="fitur" className="container py-20">
        <div className="max-w-2xl">
          <Badge variant="outline" className="font-mono text-xs">FITUR</Badge>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">
            Satu autopilot, seluruh siklus clipping.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Dirancang dari hasil pemetaan nyata halaman clipper konten.com — bukan tebakan fitur.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <Card className="h-full hover:border-primary/40 transition-colors">
                <CardContent className="p-6">
                  <div className="h-10 w-10 rounded-xl bg-primary/12 border border-primary/25 grid place-items-center">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mt-4 font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="cara" className="border-y border-border bg-card/30">
        <div className="container py-20">
          <div className="max-w-2xl">
            <Badge variant="outline" className="font-mono text-xs">CARA KERJA</Badge>
            <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">
              Dari login sampai Rupahan, tiga langkah.
            </h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="relative rounded-xl border bg-card p-6"
              >
                <span className="font-mono text-4xl font-bold text-primary/25">{s.n}</span>
                <h3 className="mt-3 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                {i < 2 && (
                  <ArrowRight className="hidden md:block absolute -right-4 top-1/2 h-5 w-5 text-primary/40" />
                )}
              </motion.div>
            ))}
          </div>

          {/* Compliance strip */}
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-5">
              <div className="flex items-center gap-2 text-emerald-300 font-semibold text-sm">
                <CheckCircle2 className="h-4 w-4" /> Yang autopilot kerjakan
              </div>
              <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                <li>• Baca brief: elemen wajib, narasi, CTA, hashtag, durasi</li>
                <li>• Skor & urutkan campaign berdasarkan peluang payout</li>
                <li>• Susun shotlist per detik + checklist produksi</li>
                <li>• Mirror earnings & views setiap kali bridge sync</li>
              </ul>
            </div>
            <div className="rounded-xl border border-red-500/25 bg-red-500/5 p-5">
              <div className="flex items-center gap-2 text-red-300 font-semibold text-sm">
                <XCircle className="h-4 w-4" /> Yang kami tidak lakukan
              </div>
              <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                <li>• Tanpa bot views / engagement (melanggar aturan campaign)</li>
                <li>• Tanpa akses akun orang lain — hanya sesimu sendiri</li>
                <li>• Tanpa submit otomatis tanpa konfirmasi kamu</li>
                <li>• Tanpa menyimpan password di cloud — ada di bridge lokal</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="statistik" className="container py-20">
        <div className="max-w-2xl">
          <Badge variant="outline" className="font-mono text-xs">DATA LAPANGAN</Badge>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">
            Angka nyata dari crawl 22 Sep 2026.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Autopilot ini dilatih memahami struktur asli platform: budget, CPM, kompetisi, sampai closure budget.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="rounded-xl border bg-card p-6 text-center"
            >
              <p className="text-2xl md:text-3xl font-black text-gradient">{s.value}</p>
              <p className="mt-2 text-xs text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-24">
        <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-cyan-500/10 p-10 md:p-16 text-center">
          <div className="absolute inset-0 grid-bg opacity-40" />
          <div className="relative">
            <Zap className="mx-auto h-8 w-8 text-primary" />
            <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">
              Campaign berikutnya buka pagi ini.
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Yang siap duluan yang menang budget. Pasang autopilotmu sekarang — gratis, dan datamu tetap milikmu.
            </p>
            <Button asChild size="lg" className="mt-8 h-12 px-10 text-base">
              <Link to="/auth">
                <Target className="h-4 w-4" /> Mulai Sekarang
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Scissors className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">Super Clipper</span>
            <span className="font-mono text-xs">v2.0 — AI Autopilot Clipping</span>
          </div>
          <p className="font-mono text-xs">
            Bukan afiliasi konten.com • Gunakan sesi akunmu sendiri • Tanpa bot
          </p>
        </div>
      </footer>
    </div>
  );
}
