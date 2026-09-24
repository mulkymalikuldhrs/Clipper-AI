# Changelog — Clipper-AI

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2026-09-24

### Added
- Autonomy queue per campaign: lifecycle, data readiness, economic signal, plan-specific decision, dan social handoff yang selalu `review_required`.
- AutoShorts-compatible clean-room handoff: kandidat klip 9:16 (hook, core proof, CTA) dari plan campaign, manifest JSON, dan UI copy manifest tanpa menjalankan renderer atau publish.
- Second research pass untuk OpenShorts, OpenClaw, OpenFang, Hermes, CORAL, Prime Agent,
  AWorld, AutoResearchClaw, LangGraph, AutoGen, dan VideoAgent; lihat `research/AGENT_RESEARCH.md`.
- Bounded organism kernel: constitution, safe modes, dynamic goal queue, capability registry,
  provenance-tagged memory, experiment ledger, do-nothing policy, daily goal selection, dan UI `/app/organism`.
- Canonical strategic context untuk autonomous organization / venture organism disimpan di
  `research/HERMES_CANONICAL_CONTEXT.md`.
- Local provider config UI di Organism: base URL/model via localStorage, API key hanya di
  sessionStorage, validasi URL aman, dan clear control tanpa secret ke Convex.
- Unit tests untuk goal scoring, safe selection, experiment adoption, dan validasi organism policy.

### Safety boundary
- Kernel tidak menjalankan shell, filesystem, browser, model provider, filesystem mutation,
  spending, credential rotation, account creation, atau marketplace publishing.
- Semua perubahan tetap berada di Convex dan memerlukan deployment/codegen Convex baru.

### Added
- Riset terstruktur 11 repository video/workflow dan keputusan reuse yang aman untuk Super Clipper.
- Bounded ingest validation: body maksimal 1 MiB, source/email/snapshot tervalidasi, dan batas
  collection campaign/joined/earnings.
- Request ID UUID dari bridge, dedup sync, status `pending/ok/error`, duration, campaign count,
  safe error code, serta retriable error log.
- Cron housekeeping untuk memangkas sync log lebih tua dari 30 hari.

### Changed
- README dan PRD documenting provider opt-in boundaries, no auto-submit/auto-publish, dan
  production limitations yang masih tersisa.
- Bridge UI menampilkan status `pending` sebagai state berjalan, bukan error.

### Quality
- Unit test ingest validation ditambahkan; total suite 7 test / 21 assertions.
- `bun tsc -b --noEmit`, `bun run typecheck:scripts`, `bun test`, `git diff --check`, dan
  `bun run smoke` lulus. Convex codegen belum dapat diverifikasi karena local backend port 3210
  masih aktif di workspace.

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

### Notes
- Halaman publik kini punya elemen `<main>`, sehingga harness overflow/teks yang sama bisa dipakai.

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

### Notes
- Vite di sesi ini kadang menyajikan hasil transform lama untuk file yang ditulis lewat lapisan
  sync workspace (gejala: pesan `does not provide an export named ...` atau UI versi lama).
  `scripts/smoke-dashboard.ts` menaikkan mtime semua file dashboard sebelum dijalankan; cara
  manual: `touch` file terkait.

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

### Changed
- `scripts/dev.sh` **hanya menjalankan Vite**. Platform mengelola proses Convex dev; menjalankan
  `convex dev` kedua merebut port 3210 dan menggagalkan push fungsi/codegen platform sehingga UI
  menampilkan kode lama. Untuk dev manual: `bun run convex:dev` di terminal terpisah.
- Bridge dibuat toleran terhadap perubahan API: mencoba beberapa bentuk query list campaign.
- Sisa budget tidak lagi dibaca dari `/api/campaigns/:id/closure` (kini 404), melainkan dari
  `budget`/`spent`.
- Parser brief mengonversi field numerik yang dikirim sebagai string (mis. `minimumFollowers`).
- UI Autopilot: tab Aturan kini memisahkan Elemen wajib / Yang BOLEH / Yang DILARANG dan
  menampilkan referensi brief; halaman Campaign Detail menampilkan materi + do & don't.

### Fixed
- Crawler tidak lagi berhenti prematur: link yang ditemukan di-seed ke queue (sebelumnya hanya
  dikuras di dalam loop), dan batas halaman bisa diatur lewat `CRAWL_MAX_PAGES`.
- CTA kosong (`""`) pada brief tidak lagi tampil sebagai string kosong di rencana produksi.
- Urutan shotlist tidak lagi tumpang tindih untuk campaign berdurasi panjang.

---

## [1.2.0] - 2026-03-05

### Fixed
- Added `.gitignore` (was missing)
- Fixed broken contact links in README
- Added contributor welcome section to README
- Updated trilingual disclaimer with risk clause

---

## [1.1.0] - 2026-03-04

### Added
- Trilingual README (EN/ID/CN) with disclaimer
- CONTRIBUTING.md with trilingual content and disclaimer
- CODE_OF_CONDUCT.md with disclaimer
- SECURITY.md with disclaimer
- MIT License (2026)
- GitHub issue templates (bug report, feature request, question)
- Pull request template with disclaimer
- FUNDING.yml

---

## Disclaimer

**EN**: This project is for educational and research purposes only. We do not bear any responsibility or risk for how this software is used.

**ID**: Proyek ini hanya untuk tujuan pendidikan dan penelitian. Kami tidak menanggung tanggung jawab atau risiko atas penggunaan perangkat lunak ini.

**CN**: 本项目仅用于教育和研究目的。我们不对本软件的使用方式承担任何责任或风险。

---

Contact: mulkymalikuldhaher@email.com | Mulky Malikul Dhaher
