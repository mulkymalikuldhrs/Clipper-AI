# PROJECT_CONTEXT — Super Clipper

## Objective
Ubah repo Clipper-AI (clipboard manager vaporware) menjadi **Super Clipper**: AI autopilot
untuk marketplace clipping konten.com — auto-fetch campaign **beserta brief lengkap**, susun
rencana produksi (hook, shotlist, narasi, CTA, caption, do & don't), tandai join, lalu pantau
analitik & earnings real-time.

## Stack (confirmed)
Vite + React 18 + TypeScript + Tailwind + shadcn-style UI + framer-motion + recharts +
react-router v7 + Convex (backend/database) + Convex Auth. Bun sebagai package manager.

## Fase
Upgrade lanjutan **selesai di sisi kode** (deep crawl tuntas + Brief Autopilot berbasis brief
asli + data demo nyata). Menunggu deploy fungsi Convex: proses `convex dev` yatim dari
`dev.sh` versi lama memegang port 3210 sehingga push otomatis platform gagal — perlu restart
sesi dev/workspace. Detail di `MEMORY.md`.

## Canonical files
- PROJECT_CONTEXT.md — dokumen ini (stack, fase, keputusan)
- research/RESEARCH.md — temuan otomasi nyata konten.com (termasuk keterbatasan)
- KONTEN_MAP.md — peta endpoint + field `brief_detail` yang dipakai integrasi
- MEMORY.md — session state + blocker
- src/convex/demoData.ts — data demo asli (auto-generated, jangan edit manual)

## Keputusan arsitektur
1. Backend = Convex (schema, auth, ingest bridge, parser brief, autopilot plan, crons).
2. Integrasi konten.com = **bridge pattern**: crawler Playwright lokal
   (`scripts/konten-crawler.ts`, `scripts/crawl-campaigns.ts`, `scripts/bridge-sync.ts`) menarik
   data via sesi resmi user lalu POST ke action `ingest:applySnapshot` dengan token
   `INGEST_TOKEN`. Hanya mirror data milik user sendiri.
3. **Bridge wajib mengambil detail per campaign** (`/api/campaigns/:slug`). Endpoint list tidak
   memuat `brief_detail`; tanpa langkah detail, Brief Autopilot tidak punya materi/narasi/do-don't.
4. Demo mode: `seedDemo` mengisi workspace dari `demoData.ts` (20 campaign asli, 114 materi).
   Angka earnings/wallet sengaja diberi label contoh — bukan data user.
5. Brief Autopilot: `parseBrief()` menghasilkan rencana dari brief asli (hook dari sudut campaign,
   shotlist berskala durasi, `boleh[]` vs `dilarang[]`, target audiens, caption wajib) + checklist
   tugas (termasuk tugas "CEK LARANGAN") + skor kepatuhan.
6. **`scripts/dev.sh` hanya menjalankan Vite.** Platform Freebuff mengelola proses Convex dev;
   menjalankan `convex dev` kedua akan merebut port 3210 dan menggagalkan push fungsi/codegen.
7. Non-goals MVP: auto-submit video ke konten.com (upload via web), interaksi dengan akun lain,
   bot views/engagement (dilarang brief).

## Catatan API (per 22 Sep 2026)
- `GET /api/campaigns?status=active` → 200 (45 campaign). Menambahkan `limit` → **400**.
- `GET /api/campaigns/:id/closure` → **404**; sisa budget dihitung dari `budget`/`spent`.
- Beberapa field numerik dikirim sebagai string → parser mengonversi, bukan mengasumsikan number.
