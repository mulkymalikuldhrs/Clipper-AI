import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Bullets,
  MonoLabel,
  Panel,
  Score,
  Status,
  TableRow,
  TableShell,
} from "@/components/shared";
import { ArrowRight, Check, CirclePlay, Scissors, Sparkles } from "lucide-react";

const SHELL = "mx-auto w-full max-w-6xl px-4 md:px-8";
const PREVIEW_COLS = "7rem minmax(0,1fr) 4rem 6rem 7rem";

const NAV = [
  { href: "#command-center", label: "Command center" },
  { href: "#alur", label: "Alur kerja" },
  { href: "#batas", label: "Batas aman" },
];

const SAMPLE = [
  { id: "C-204", title: "IBU — Reaksi & Testimoni", score: 92, cpm: "Rp2.000", state: "ready_for_review" },
  { id: "C-198", title: "Growlab — Beyond The Podcast", score: 81, cpm: "Rp3.000", state: "planned" },
  { id: "C-176", title: "Bevan — Education Clips", score: 64, cpm: "Rp3.000", state: "earning" },
  { id: "C-155", title: "Sariwangi — Kampanye Edukasi", score: 41, cpm: "Rp2.000", state: "observe" },
];

const SIGNALS = [
  { label: "Campaign terpantau", value: "20", hint: "dari feed workspace" },
  { label: "Brief terambil", value: "45", hint: "detail siap dipecah" },
  { label: "Materi demo", value: "114", hint: "asset terindeks" },
  { label: "Decision queue", value: "∞", hint: "selalu bisa do nothing" },
];

const FLOW = [
  {
    step: "01",
    title: "Tarik sinyal",
    text: "Bridge membaca sesi konten.com milikmu sendiri, lalu menyimpan campaign, detail brief, joined state, earnings, dan analytics ke workspace.",
  },
  {
    step: "02",
    title: "Pilih campaign",
    text: "Scanner memberi skor CPM, sisa budget, kompetisi, dan view floor. Setiap campaign dinilai berdasarkan brief dan ekonominya sendiri.",
  },
  {
    step: "03",
    title: "Rancang/spec",
    text: "Brief menjadi hook, shotlist, narasi, CTA, caption, aturan comply, dan manifest kandidat 9:16 per campaign.",
  },
  {
    step: "04",
    title: "Ukur hasil",
    text: "Earnings dan views masuk ke evaluation queue. Eksperimen hanya diadopsi jika ada improvement dan risiko rendah.",
  },
];

const BOUNDARIES = [
  "Tidak mengambil alih akun marketplace.",
  "Tidak menyimpan password/cookies di cloud.",
  "Tidak membuat fake views atau engagement.",
  "Tidak mengirim posting sosial tanpa review operator.",
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className={`${SHELL} flex h-16 items-center justify-between gap-4`}>
          <Link to="/" className="flex items-center gap-3" aria-label="Super Clipper home">
            <span className="grid h-8 w-8 place-items-center border border-primary/30 bg-primary/10">
              <Scissors className="h-4 w-4 text-primary" />
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-tight">Super Clipper</span>
              <span className="block font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                venture operating system
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className="text-[13px] text-muted-foreground transition-colors hover:text-foreground">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden shadow-none sm:inline-flex">
              <a href="#command-center">Lihat preview</a>
            </Button>
            <Button asChild size="sm" className="shadow-none">
              <Link to="/app">
                Buka workspace <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-border">
          <div className={`${SHELL} grid gap-12 py-16 md:py-24 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center`}>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Status tone="primary">live product preview</Status>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">public product preview</span>
              </div>
              <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-[1.04] tracking-[-0.04em] md:text-6xl">
                Your next winning clip,
                <span className="block text-primary">already has a system.</span>
              </h1>
              <p className="mt-6 max-w-xl text-[15px] leading-7 text-muted-foreground">
                Super Clipper mengubah dashboard clipper menjadi operating loop: discover campaign, baca brief, rancang produksi, ukur performance, dan siapkan social handoff yang bisa direview.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="shadow-none">
                  <a href="#command-center">
                    Jelajahi command center <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg" className="shadow-none">
                  <Link to="/app">Mulai eksplorasi</Link>
                </Button>
              </div>
              <p className="mt-4 font-mono text-[11px] text-muted-foreground/80">
                explore freely • open the public console
              </p>
            </div>

            <div id="command-center" className="scroll-mt-24 min-w-0 border border-border bg-card/40">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <MonoLabel>super-clipper / command center</MonoLabel>
                  <p className="mt-1 text-[12px] text-muted-foreground">Preview operating loop tanpa autentikasi</p>
                </div>
                <Status tone="good">signal ready</Status>
              </div>
              <div className="grid grid-cols-2 border-b border-border sm:grid-cols-4">
                {SIGNALS.map((signal) => (
                  <div key={signal.label} className="border-r border-border px-3 py-3 last:border-r-0">
                    <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">{signal.label}</p>
                    <p className="mt-1 font-mono text-lg font-semibold tabular-nums">{signal.value}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{signal.hint}</p>
                  </div>
                ))}
              </div>
              <TableShell cols={PREVIEW_COLS} minWidth="38rem" head={["campaign", "brief", "skor", "cpm", "state"]}>
                {SAMPLE.map((row) => (
                  <TableRow key={row.id} cols={PREVIEW_COLS}>
                    <span className="font-mono text-[10px] text-muted-foreground">{row.id}</span>
                    <span className="truncate font-medium">{row.title}</span>
                    <Score value={row.score} meterClassName="w-8" />
                    <span className="font-mono text-[11px] tabular-nums">{row.cpm}</span>
                    <Status tone={row.state === "ready_for_review" ? "info" : row.state === "earning" ? "good" : "neutral"}>
                      {row.state}
                    </Status>
                  </TableRow>
                ))}
              </TableShell>
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <span className="font-mono text-[10px] text-muted-foreground">4 signal diproses • 1 perlu review</span>
                <span className="font-mono text-[10px] text-primary">bounded autonomy →</span>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border">
          <div className={`${SHELL} py-14 md:py-20`}>
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <MonoLabel>operating loop</MonoLabel>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Dari feed jadi keputusan.</h2>
              </div>
              <p className="max-w-md text-[13px] leading-6 text-muted-foreground">Tidak ada layar yang berdiri sendiri. Semua output kembali ke campaign, plan, dan evaluation state yang bisa diaudit.</p>
            </div>
            <div className="mt-9 grid gap-px border border-border bg-border md:grid-cols-4">
              {FLOW.map((item) => (
                <article key={item.step} className="bg-card p-5">
                  <span className="font-mono text-[10px] text-primary">{item.step}</span>
                  <h3 className="mt-5 text-sm font-semibold">{item.title}</h3>
                  <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="alur" className="scroll-mt-24 border-b border-border">
          <div className={`${SHELL} grid gap-8 py-14 md:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]`}>
            <div>
              <MonoLabel>what ships</MonoLabel>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Produksi dimulai dari brief, bukan dari tebakan.</h2>
              <p className="mt-3 max-w-2xl text-[13px] leading-6 text-muted-foreground">Setiap campaign punya brief, aturan, dan spesifikasi sendiri. Autopilot tidak menyamakan semua campaign menjadi satu template.</p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {["Hook per campaign", "Shotlist berbasis durasi", "Boleh / dilarang", "Caption + hashtag", "Manifest 9:16", "Evaluation queue"].map((item) => (
                  <div key={item} className="flex items-center gap-2 border border-border bg-card/40 px-3 py-2.5 text-[12px]">
                    <Check className="h-3.5 w-3.5 text-emerald-400" /> {item}
                  </div>
                ))}
              </div>
            </div>
            <Panel title="Decision boundary" meta="human-visible by design" flush>
              <div className="divide-y divide-border/60">
                <div className="p-4">
                  <Status tone="good">autonomous</Status>
                  <p className="mt-2 text-[13px] leading-6 text-muted-foreground">Menghitung lifecycle, readiness, economic signal, plan, manifest, dan experiment candidate.</p>
                </div>
                <div className="p-4">
                  <Status tone="info">review required</Status>
                  <p className="mt-2 text-[13px] leading-6 text-muted-foreground">Media final, compliance, dan social publishing menunggu approval manusia serta API resmi.</p>
                </div>
                <div className="p-4">
                  <Status tone="bad">blocked</Status>
                  <p className="mt-2 text-[13px] leading-6 text-muted-foreground">Credential cloud, fake engagement, account takeover, dan uncontrolled spending.</p>
                </div>
              </div>
            </Panel>
          </div>
        </section>

        <section id="batas" className="scroll-mt-24 border-b border-border">
          <div className={`${SHELL} grid gap-8 py-14 md:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]`}>
            <div>
              <MonoLabel>trust boundary</MonoLabel>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Autonomous, bukan tanpa kontrol.</h2>
              <p className="mt-3 max-w-xl text-[13px] leading-6 text-muted-foreground">Sistem bisa bergerak lebih cepat tanpa mempercayakan keputusan irreversibel kepada model atau cron.</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Panel title="Bisa dikerjakan" actions={<Status tone="good">safe</Status>}>
                <Bullets items={["Scoring dan campaign discovery", "Brief → production plan", "Clip manifest 9:16", "Earnings evaluation dan memory", "Review queue dan do-nothing"]} tone="good" />
              </Panel>
              <Panel title="Perlu approval" actions={<Status tone="info">gated</Status>}>
                <Bullets items={["Render media final", "Upload ke platform", "Posting TikTok / Instagram", "Mengubah credential", "Mengubah spending akun"]} tone="info" />
              </Panel>
            </div>
          </div>
        </section>

        <section>
          <div className={`${SHELL} py-14 md:py-20`}>
            <div className="border border-border bg-card/40 p-6 md:flex md:items-center md:justify-between md:gap-8 md:p-9">
              <div>
                <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /><MonoLabel>start with signal</MonoLabel></div>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight">Buka workspace saat kamu siap.</h2>
                <p className="mt-2 max-w-xl text-[13px] leading-6 text-muted-foreground">Preview publik tetap terbuka. Jelajahi console, data contoh, dan operating loop tanpa akun.</p>
              </div>
              <div className="mt-6 flex flex-wrap gap-2 md:mt-0">
                <Button asChild className="shadow-none"><Link to="/app">Buka console <ArrowRight className="h-4 w-4" /></Link></Button>
                <Button asChild variant="outline" className="shadow-none"><a href="#command-center"><CirclePlay className="h-4 w-4" /> Lihat lagi</a></Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className={`${SHELL} flex flex-col gap-2 py-6 text-muted-foreground md:flex-row md:items-center md:justify-between`}>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em]">Super Clipper • venture operating system</p>
          <p className="font-mono text-[10px]">Dhaher Labs • bukan afiliasi konten.com • data dan credential tetap milikmu</p>
        </div>
      </footer>
    </div>
  );
}
