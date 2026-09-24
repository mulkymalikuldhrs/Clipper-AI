# Changelog — Super Clipper

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.3.0] - 2026-09-24

### Added
- Created `research/AGENT_RESEARCH.md` documenting second-pass research on OpenShorts, VideoAgent, CORAL, Prime Agent, Hermes Agent, AutoResearchClaw, OpenClaw, OpenFang, Swarm, LangGraph, and AutoGen.
- Created `research/HERMES_CANONICAL_CONTEXT.md` defining the strategic foundation, Constitutional principles, and operating loop for Super Clipper as an Autonomous Venture Organism.
- Expanded Bun unit test suite in `tests/konten.test.ts` covering autonomy review derivation, AutoShorts 9:16 manifest creation, bounded ingest payload validation, local provider config checks, organism policy decisions, campaign scoring, and brief parsing (17 passing unit tests).
- Verified full production build and typechecking scripts (`bun run typecheck`, `bun run typecheck:scripts`, `bun run build`).

### Changed
- Updated `README.md`, `PRD.md`, `PROJECT_CONTEXT.md`, and `MEMORY.md` to reflect current system architecture, canonical strategic context, and test suite verification.

## [2.2.0] - 2026-09-23

Landing dan Auth diseragamkan dengan bahasa visual **console** yang sudah dipakai dashboard.

### Changed
- `src/pages/Landing.tsx`: ditulis ulang. Hero satu kolom + panel "Peluang terbuka" yang benar-benar
  memakai primitif dashboard (`Panel`/`TableShell`/`TableRow`/`Score`), fitur dan langkah sebagai
  grid hairline berindeks mono, strip metrik untuk data lapangan, panel batas/izin, dan CTA tanpa
  kartu ber-shadow. Tidak ada lagi `text-gradient`, `border-glow`, `glass`, `grid-bg`,
  `animate-pulse-glow`, atau kotak ikon.
- `src/pages/Auth.tsx`: ditulis ulang. Panel kiri berisi spesifikasi mono (`KeyValueList`) sebagai
  ganti badge/ikon dekoratif; form kanan memakai hairline, label mono uppercase, `Status` untuk
  keadaan mode, dan tanpa shadow. Logika auth (mode signIn/signUp, `returnTo`, seed demo) tidak
  berubah; semua selektor yang dipakai tooling (`#name`, `#email`, `#password`, tombol toggle
  "Daftar"/"Masuk", `button[type=submit]`) dipertahankan.
- `src/components/auth/RequireAuth.tsx`: loading state diganti dari cincin spinner menjadi baris mono
  + meter tipis agar konsisten dengan console.

### Changed (tooling)
- `scripts/smoke-dashboard.ts` kini juga menguji route publik `/` dan `/auth` pada 1440px dan 390px
  (pass `PUBLIC` sebelum signup, jadi landing diuji dalam keadaan signed-out), dan menaikkan mtime
  `Landing.tsx`, `Auth.tsx`, `RequireAuth.tsx` sebelum dijalankan.

### Fixed
- `Auth.tsx` sekarang hanya menerima `returnTo` berupa path internal; input seperti `//example.com`
  tidak lagi membuat signup selesai lalu terjebak di form.
- Header sortable Scanner dipindahkan ke module scope sehingga tetap mempertahankan fokus keyboard
  setelah state tabel berubah.
- Kegagalan `createPlan` di Campaign Detail dan Autopilot sekarang tampil sebagai error yang dapat
  dicoba ulang; parser brief defensif terhadap elemen array non-string.
- `Bullets` memakai elemen list yang semantik dan anchor section landing diberi offset untuk header lengket.

### Quality
- Menambahkan unit test Bun untuk `scoreCampaign` dan `parseBrief`, typecheck smoke harness, serta
  CI yang menjalankan typecheck dan unit test. Smoke browser kini exit non-zero untuk route kosong,
  overflow, atau page/console error.

## [2.1.0] - 2026-09-23

Rewrite total UI dashboard menjadi **console operasional** yang padat data, tanpa dekorasi.
Landing/Auth tidak diubah.

### Changed
- Primitif dashboard (`src/components/shared.tsx`) diganti seluruhnya: `Panel`, `MetricStrip`,
  `Status`, `Meter`, `Score`, `TableShell`/`TableRow`, `KeyValue(List)`, `Bullets`, `CopyButton`,
  `RowsLoading`. Aturan: garis rambut 1px, tanpa shadow/gradient, angka monospace tabular,
  label mono uppercase 10px, warna hanya untuk makna (status/skor).
- Shell dashboard: sidebar mono dengan grup nav + penghitung campaign, top bar lengket berisi
  breadcrumb + status sync + menu akun, nav gulir untuk mobile, catatan hukum pindah ke sidebar.
- Ringkasan: strip 5 metrik, tabel peluang terbuka (CPM, sisa budget, pesaing, skor),
  panel sedang dikerjakan, status sinkronisasi, dan tabel aktivitas sync.
- Scanner: tabel data dengan header yang bisa diurutkan (skor/CPM/sisa budget/pesaing/min views)
  dan filter chip, menggantikan kartu + `ScoreRing`.
- Autopilot: tab garis bawah, shotlist timeline, caption dengan tombol salin, checklist per
  kategori, dan panel Aturan (wajib / boleh / dilarang / referensi brief).
- Campaign Detail, Analitik, Earnings, Bridge: panel padat, tabel sebagai ganti daftar kartu,
  chart dengan axis mono + legend kustom, blok perintah bridge dengan tombol salin.
- `KpiCard` dan `ScoreRing` dihapus (tidak ada konsumen tersisa).

### Added
- `scripts/smoke-dashboard.ts`: smoke test Playwright yang mendaftar akun, mengisi data demo,
  lalu merender **semua** route dashboard pada viewport desktop 1440px dan mobile 390px —
  melaporkan page/console error, overflow horizontal per halaman, elemen penyebab overflow,
  dan menyimpan screenshot ke `research/shots/`.

### Fixed
- Overflow horizontal di mobile (390px) pada Ringkasan, Autopilot, dan Analitik: grid responsif
  kini memakai track dasar `grid-cols-[minmax(0,1fr)]`, `main` diberi `min-w-0`, dan daftar tab
  Autopilot menjadi scroller sendiri. Terukur 0px overflow di semua route (desktop dan mobile).

## [2.0.0] - 2026-09-22

Rebuild total menjadi **Super Clipper** — AI autopilot untuk marketplace clipping konten.com.

### Added
- **Konten Bridge**: sync Playwright (login email/password **atau** cookies) yang menarik
  campaign, **detail brief per campaign**, joined, earnings, timeseries, wallet, tier → push ke
  workspace lewat HTTP action `/ingest` bertoken.
- **Campaign Scanner** dengan skor 0–100 (CPM 35% • sisa budget 30% • kompetisi 20% • syarat views 15%).
- **Brief Autopilot**: rencana produksi dari brief asli campaign — hook 3 detik dari sudut brief,
  shotlist berskala durasi, poin narasi, CTA, caption + hashtag siap tempel, **daftar BOLEH vs
  DILARANG** (`bolehDilakukan`/`dilarangDilakukan`), target audiens, tujuan campaign, checklist
  tugas (termasuk tugas “CEK LARANGAN”), dan skor kepatuhan.
- **Analitik & Earnings**: mirror `views-timeseries`, earnings per video, kesiapan withdraw
  (min Rp50.000, fee Rp10.000).
- **Demo Mode** dari data crawl nyata: 20 campaign + 114 materi (`src/convex/demoData.ts`,
  auto-generated). Angka earnings diberi label contoh.
- Tool riset: `scripts/konten-crawler.ts` (BFS seluruh halaman), `scripts/crawl-campaigns.ts`
  (detail lengkap semua campaign), `scripts/gen-demo-data.ts`.
- Dokumen kanonik: `research/RESEARCH.md`, `KONTEN_MAP.md`, `PROJECT_CONTEXT.md`, `MEMORY.md`.

---

## Disclaimer

**EN**: This project is for educational and research purposes only. We do not bear any responsibility or risk for how this software is used.

**ID**: Proyek ini hanya untuk tujuan pendidikan dan penelitian. Kami tidak menanggung tanggung jawab atau risiko atas penggunaan perangkat lunak ini.

**CN**: 本项目仅用于教育和研究目的。เรา tidak menanggung tanggung jawab atau risiko atas penggunaan perangkat lunak ini.

---

Contact: mulkymalikuldhaher@email.com | Mulky Malikul Dhaher
