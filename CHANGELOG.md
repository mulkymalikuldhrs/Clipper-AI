# Changelog — Clipper AI

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2026-09-25

### Added
- **Rename to Clipper AI.** Product name, UI copy, page title, meta description, package metadata, MCP server name, organism profile, AutoShorts manifest schema, and operator state directory all move to `clipper-ai`. Environment variables (`CLIPPER_AI_URL`, `CLIPPER_AI_MODEL_*`), the operator state directory (`.clipper-ai/`), and browser storage keys read the old `superclipper`/`super-clipper` names as fallbacks and migrate once, so an existing workspace, provider config, swarm sessions, and social accounts survive the rename.
- Workspace platform layer: `operatorWorkspaces` now carries a plan, and `src/lib/plans.ts` defines free/studio/agency limits with `HARD_LIMITS` as an absolute ceiling.
- Enforced quotas: `createPlan`, `createOrganismGoal`, and `createApiKey` read the workspace plan and refuse writes past the limit; `meterApiRequest` refuses the request after the daily quota with 429.
- Usage meter (`usageEvents`) recording `plan.created`, `goal.created`, `api_key.created`, `api.request`, and `ingest.snapshot`.
- Workspace API keys (`clai_<48 hex>`) minted and hashed in the browser; only the SHA-256 hash and a display prefix reach Convex, and `listApiKeys` never returns the hash.
- Workspace HTTP API v1: `GET /api/v1/workspace`, `/api/v1/campaigns`, `/api/v1/plans` with bearer auth, `read` scope, versioned responses, and per-request metering. `src/convex/apiData.ts` holds the shared read models.
- `/app/platform` console page: workspace identity, plan comparison, quota meters, API key management (create once / revoke), API quickstart, and an explicit "what this is not" panel.
- `PLATFORM.md` documents the SaaS/BaaS posture and the IaaS, billing, webhook, and hard-tenancy gaps instead of implying they exist.
- New test coverage for plan resolution, plan ceilings, API key hashing (with a known-answer SHA-256 vector), bearer parsing, and legacy env/storage fallbacks. Suite is now 36 tests.
- Login-free operator workspace: one random 32-hex key per browser in `localStorage` (`src/lib/useWorkspace.ts`) resolves to an anonymous Convex identity (`operatorWorkspaces`) so plans, tasks, and organism state persist with no account at all.
- Source scoping: snapshots and campaigns carry `scope` (`private` own-session bridge vs `public` discovery). The public console reads only public discovery data, merges it with the caller's own rows, and never returns another operator's bridge mirror.
- Data-mode indicator in the console shell plus a banner when the Convex backend has never connected, so an unreachable backend reads as a state instead of an infinite skeleton.
- Unit coverage for the workspace key rule and the source-visibility policy.

### Fixed
- Public sync-log view no longer mixes private bridge activity into anonymous reads: logs shown without a workspace are filtered to public discovery sources.
- Campaign actions are honest per record: discovery rows never expose a local mark-joined control, and `toggleJoined` refuses to patch a public row instead of silently mutating global data.
- Buttons that previously threw `Unauthorized` for every visitor now either work against the local workspace or are absent.

### Changed
- Documentation states the access model plainly: no auth UI, workspace key as a bearer capability for that browser only, and connector actions that remain unreachable until a deployment adds auth.
- Final control-room pass: terminal-style landing, source-aware dashboard, real provider health check, public Content Rewards API check, and removal of generated demo utilities and synthetic landing records.
- Minimal monochrome/lime UI system: neutral charcoal surfaces, tighter type scale, hairline panels, quieter borders, and no decorative gradients or glows.
- Content Rewards Discover read-only connector and bounded public sync script.
- Agent Swarm control room with explicit roles, shared transcript/memory, custom OpenAI-compatible base URL/model, browser-only API key handling, evaluation, browser heartbeat, and review-gated skill proposals.
- Connector catalog for Apify, Whop, Content Rewards, OpenAI-compatible models, and planned signed webhooks.
- Convex server actions for authenticated Apify Actor runs and bounded Whop account probing.
- Research notes translated into implementation boundaries for Enoch, Open Multi-Agent, Prime Agent, Auto-Company, LifeOS, OpenShorts, AutoShorts, MiroFish, and MiroShark.
- Operator runtime: Bun CLI, lock/state-file daemon, official MCP stdio server with read-only tool allowlist, and built-in Playwright browser inspection for explicit origin/path scopes.
- Optional Camofox-compatible connector contract with no official-upstream claim and no stealth or anti-bot bypass behavior.
- Dashboard actions now point to real source, scanner, production, and swarm workflows; fake preview metrics and demo navigation were removed.
- Refreshed product, operations, security, research, and contribution documentation to match the public console and current safety model, including the new name.
- Clarified that public console data is source-backed and that browser swarm memory is local-first; no unrestricted autonomous mutation or publishing was added.
- README rewritten around the new name and a capability table that separates what runs today from what does not exist yet.
- The icon and README badges drop the green/cyan gradient for the console palette, matching the documented "no gradients" visual system.

### Quality
- `bun convex dev --once` — functions push and index creation succeed
- `bun tsc -b --noEmit`
- `bun run typecheck:scripts`
- `bun test` — 36 passing tests across 3 files
- `git diff --check`
- `bun run smoke` on the managed preview: 0 horizontal overflow and 0 page errors on all routes; console data panels need a reachable Convex backend on port 3210

### Safety
- API keys are never stored in localStorage, Convex, source control, or ingest payloads.
- Agent skills remain `review_required` until a human approves them.
- Connector actions with external credentials require an authenticated Convex user, so they are not reachable from the login-free console; consequential operations remain review-gated.
- A workspace key is a bearer capability for that browser's plans and organism state only; it grants no access to marketplace credentials or the operator bridge mirror.

## [2.3.0] - 2026-09-24

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
