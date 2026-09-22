# Changelog — Clipper-AI

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
