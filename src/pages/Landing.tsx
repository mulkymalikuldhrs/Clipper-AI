import { Link } from "react-router-dom";
import { useConvexAuth } from "convex/react";
import { Button } from "@/components/ui/button";
import {
  Bullets,
  KeyValue,
  KeyValueList,
  MetricStrip,
  MonoLabel,
  Panel,
  Score,
  Status,
  TableRow,
  TableShell,
} from "@/components/shared";
import { ArrowRight, Scissors } from "lucide-react";

const SHELL = "mx-auto w-full max-w-6xl px-4 md:px-8";

const NAV = [
  { href: "#fitur", label: "Fitur" },
  { href: "#cara", label: "Cara kerja" },
  { href: "#statistik", label: "Data lapangan" },
];

const SAMPLE = [
  { title: "Owner — Artha ldt", score: 92, cpm: "Rp5.000", budget: "100%", clippers: "135" },
  { title: "Growlab — Beyond The Podcast", score: 81, cpm: "Rp3.000", budget: "100%", clippers: "154" },
  { title: "Bevan — Education Clips", score: 64, cpm: "Rp3.000", budget: "91%", clippers: "4.681" },
  { title: "IBU, Bagaimana aku Tanpamu", score: 41, cpm: "Rp2.000", budget: "31%", clippers: "11.936" },
];

const HERO_COLS = "8rem minmax(0,1fr) 4.5rem 5rem 4.5rem 5.5rem";

const FACTS = [
  { label: "Crawl terverifikasi", value: "124", hint: "halaman clipper konten.com" },
  { label: "Endpoint dipetakan", value: "186", hint: "campaign, brief, earnings, analitik" },
  { label: "Campaign ber-brief", value: "45", hint: "brief_detail lengkap" },
  { label: "Data demo", value: "20 / 114", hint: "campaign asli / materi" },
];

const FEATURES = [
  {
    id: "01",
    title: "Campaign scanner",
    desc: "Seluruh campaign aktif konten.com ditarik dan diberi skor 0–100: CPM, sisa budget, jumlah clipper pesaing, dan syarat minimum views.",
  },
  {
    id: "02",
    title: "Brief autopilot",
    desc: "Brief diubah jadi rencana produksi: hook, shotlist per detik, narasi wajib, caption + hashtag, dan checklist kepatuhan.",
  },
  {
    id: "03",
    title: "Analitik views",
    desc: "Timeseries views harian dan leaderboard top-clip, supaya jelas apa yang sedang menang di tiap campaign.",
  },
  {
    id: "04",
    title: "Earnings mirror",
    desc: "Pending, diproses, dan withdraw-ready tercermin langsung dari dashboard, plus proyeksi payout per campaign.",
  },
  {
    id: "05",
    title: "Bridge sesi sendiri",
    desc: "Sync lewat sesi akunmu (email/password atau cookies) dari mesinmu sendiri. Tanpa API tanpa izin, tanpa data pihak ketiga.",
  },
  {
    id: "06",
    title: "Compliance guard",
    desc: "Do & don'ts tiap brief diperiksa sebelum masuk produksi: elemen wajib, durasi, platform, dan aturan brand.",
  },
];

const STEPS = [
  {
    id: "01",
    title: "Hubungkan akun",
    desc: "Masuk, lalu jalankan bridge di mesinmu dengan kredensial atau cookies konten.com milikmu. Bridge membaca dashboard clipper secara berkala.",
  },
  {
    id: "02",
    title: "Saring campaign",
    desc: "Scanner mengurutkan peluang berdasarkan skor. Join yang layak langsung dari halaman detail; lewati yang cuma menghabiskan waktu.",
  },
  {
    id: "03",
    title: "Produksi ikut rencana",
    desc: "Brief dipecah jadi shotlist, hook, caption, dan checklist. Video tetap kamu submit di konten.com — earnings-nya muncul di sini.",
  },
];

const CAPABILITIES = [
  "Baca brief: elemen wajib, narasi, CTA, hashtag, durasi",
  "Skor dan urutkan campaign berdasarkan peluang payout",
  "Susun shotlist per detik plus checklist produksi",
  "Mirror earnings dan views setiap bridge sync",
];

const LIMITS = [
  "Tanpa bot views atau engagement — melanggar aturan campaign",
  "Tanpa akses akun orang lain — hanya sesimu sendiri",
  "Tanpa submit otomatis tanpa konfirmasi kamu",
  "Tanpa menyimpan password di cloud — ada di bridge lokal",
];

export default function Landing() {
  const { isAuthenticated } = useConvexAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className={`${SHELL} flex h-14 items-center justify-between gap-4`}>
          <Link to="/" className="flex items-center gap-2.5">
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

          <nav className="hidden items-center gap-6 md:flex">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
              >
                {n.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Button asChild size="sm" className="shadow-none">
                <Link to="/app">
                  Buka dashboard <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden shadow-none sm:inline-flex">
                  <Link to="/auth">Masuk</Link>
                </Button>
                <Button asChild size="sm" className="shadow-none">
                  <Link to="/auth">Mulai gratis</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border">
          <div className={`${SHELL} grid gap-10 py-14 md:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start lg:gap-14`}>
            <div className="min-w-0">
              <Status tone="primary">Autopilot untuk marketplace clipping konten.com</Status>
              <h1 className="mt-5 text-3xl font-semibold leading-[1.1] tracking-tight md:text-[2.75rem]">
                Berhenti menebak campaign.
                <br />
                Mulai memotong yang menghasilkan.
              </h1>
              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                Super Clipper menyelami dashboard clipper konten.com milikmu: menarik campaign,
                membaca brief, menyusun rencana produksi, lalu memantau analitik dan earnings —
                terstruktur, dan berbasis data lapangan nyata.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-2">
                <Button asChild size="lg" className="h-10 shadow-none">
                  <Link to="/auth">
                    Aktifkan autopilot <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-10 shadow-none">
                  <a href="#fitur">Lihat kemampuan</a>
                </Button>
              </div>

              <p className="mt-4 font-mono text-[11px] text-muted-foreground/80">
                gratis • data demo langsung aktif • bridge memakai sesi akunmu sendiri
              </p>

              <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border/70 sm:grid-cols-4">
                {FACTS.map((f) => (
                  <div key={f.label} className="bg-card px-4 py-3.5">
                    <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      {f.label}
                    </dt>
                    <dd className="mt-1.5 font-mono text-[17px] font-semibold tabular-nums tracking-tight">
                      {f.value}
                    </dd>
                    <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground/80">
                      {f.hint}
                    </p>
                  </div>
                ))}
              </dl>
            </div>

            {/* Product surface — built from the same primitives as the console itself */}
            <div className="min-w-0 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <MonoLabel>super-clipper / scanner</MonoLabel>
                <span className="font-mono text-[10px] text-muted-foreground/70">
                  4 dari 45 campaign
                </span>
              </div>
              <Panel
                flush
                className="border-border"
                meta="pratinjau tampilan asli dashboard"
                title="Peluang terbuka"
              >
                <TableShell
                  cols={HERO_COLS}
                  minWidth="38rem"
                  head={["id", "campaign", "skor", "cpm", "budget", "clipper"]}
                >
                  {SAMPLE.map((r, i) => (
                    <TableRow key={r.title} cols={HERO_COLS}>
                      <span className="font-mono text-[11px] tabular-nums text-muted-foreground/70">
                        {String(i + 1).padStart(3, "0")}
                      </span>
                      <span className="truncate font-medium">{r.title}</span>
                      <Score value={r.score} meterClassName="w-8" />
                      <span className="font-mono text-[12px] tabular-nums text-muted-foreground">
                        {r.cpm}
                      </span>
                      <span className="font-mono text-[12px] tabular-nums text-muted-foreground">
                        {r.budget}
                      </span>
                      <span className="font-mono text-[12px] tabular-nums text-muted-foreground">
                        {r.clippers}
                      </span>
                    </TableRow>
                  ))}
                </TableShell>
              </Panel>
              <p className="font-mono text-[10px] leading-relaxed text-muted-foreground/70">
                contoh baris dari crawl 22 Sep 2026 — skor, CPM, dan sisa budget dihitung dari data
                clipper asli
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="fitur" className="scroll-mt-16 border-b border-border">
          <div className={`${SHELL} py-14 md:py-20`}>
            <SectionHead
              eyebrow="Fitur"
              title="Satu konsol, seluruh siklus clipping."
              lead="Disusun dari pemetaan nyata halaman clipper konten.com — bukan tebakan fitur."
            />
            <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-border bg-border/70 md:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <article key={f.id} className="bg-card p-5">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-[10px] tabular-nums text-primary">{f.id}</span>
                    <h3 className="text-[14px] font-medium tracking-tight">{f.title}</h3>
                  </div>
                  <p className="mt-2.5 text-[13px] leading-relaxed text-muted-foreground">
                    {f.desc}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="cara" className="scroll-mt-16 border-b border-border">
          <div className={`${SHELL} py-14 md:py-20`}>
            <SectionHead
              eyebrow="Cara kerja"
              title="Dari login sampai Rupiah, tiga langkah."
              lead="Tidak ada langkah tersembunyi: bridge membaca, console menyusun, kamu yang eksekusi."
            />

            <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-border bg-border/70 md:grid-cols-3">
              {STEPS.map((s) => (
                <article key={s.id} className="bg-card p-5">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-[10px] tabular-nums text-primary">{s.id}</span>
                    <h3 className="text-[14px] font-medium tracking-tight">{s.title}</h3>
                  </div>
                  <p className="mt-2.5 text-[13px] leading-relaxed text-muted-foreground">
                    {s.desc}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
              <Panel title="Yang autopilot kerjakan" actions={<Status tone="good">aktif</Status>}>
                <Bullets items={CAPABILITIES} tone="good" />
              </Panel>
              <Panel title="Yang kami tidak lakukan" actions={<Status tone="bad">batas</Status>}>
                <Bullets items={LIMITS} tone="bad" />
              </Panel>
            </div>
          </div>
        </section>

        {/* Field data */}
        <section id="statistik" className="scroll-mt-16 border-b border-border">
          <div className={`${SHELL} py-14 md:py-20`}>
            <SectionHead
              eyebrow="Data lapangan"
              title="Angka nyata dari crawl 22 Sep 2026."
              lead="Autopilot ini memahami struktur asli platform: budget, CPM, kompetisi, sampai kapan budget ditutup."
            />
            <MetricStrip
              className="mt-8 lg:grid-cols-4"
              items={[
                { label: "CPM tertinggi terpantau", value: "Rp5.000", hint: "per 1.000 views" },
                { label: "Payout top clip", value: "Rp3.200.000", hint: "terverifikasi di dashboard" },
                {
                  label: "Clipper di 1 campaign",
                  value: "11.900+",
                  hint: "kompetisi terketat yang tercatat",
                },
                { label: "Waktu terbuang di campaign zonk", value: "0", hint: "tersaring sebelum produksi" },
              ]}
            />
            <div className="mt-6">
              <Panel title="Cakupan crawl">
                <div className="grid gap-x-10 gap-y-0 sm:grid-cols-2">
                  <KeyValueList>
                    <KeyValue label="halaman clipper" mono>
                      124
                    </KeyValue>
                    <KeyValue label="campaign ber-brief lengkap" mono>
                      45
                    </KeyValue>
                  </KeyValueList>
                  <KeyValueList>
                    <KeyValue label="endpoint platform" mono>
                      186
                    </KeyValue>
                    <KeyValue label="materi demo tersedia" mono>
                      114
                    </KeyValue>
                  </KeyValueList>
                </div>
              </Panel>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section>
          <div className={`${SHELL} py-14 md:py-20`}>
            <div className="rounded-lg border border-border bg-card/40 p-6 md:p-10">
              <Status tone="primary">mulai sekarang</Status>
              <h2 className="mt-4 text-xl font-semibold tracking-tight md:text-2xl">
                Campaign berikutnya buka pagi ini.
              </h2>
              <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
                Yang siap duluan yang menghabiskan budget. Pasang autopilotmu — gratis, dan datamu
                tetap milikmu.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <Button asChild className="shadow-none">
                  <Link to="/auth">
                    Mulai sekarang <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="shadow-none">
                  <Link to="/auth">Masuk ke konsol</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div
          className={`${SHELL} flex flex-col items-start justify-between gap-2 py-5 text-muted-foreground md:flex-row md:items-center`}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.14em]">
            Super Clipper • console v2
          </p>
          <p className="font-mono text-[10px] leading-relaxed">
            bukan afiliasi konten.com • gunakan sesi akunmu sendiri • tanpa bot
          </p>
        </div>
      </footer>
    </div>
  );
}

function SectionHead({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string;
  title: string;
  lead: string;
}) {
  return (
    <div className="max-w-2xl">
      <MonoLabel>{eyebrow}</MonoLabel>
      <h2 className="mt-2.5 text-xl font-semibold tracking-tight md:text-2xl">{title}</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{lead}</p>
    </div>
  );
}
