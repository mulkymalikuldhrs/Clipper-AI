# PROJECT_CONTEXT — Super Clipper

## Objective
Ubah repo Clipper-AI menjadi **Super Clipper**: operating system untuk workflow clipping konten.com — auto-fetch campaign **beserta brief lengkap**, susun rencana produksi (hook, shotlist, narasi, CTA, caption, do & don't), tandai join, lalu pantau analitik & earnings real-time.

## Stack (confirmed)
Vite + React 18 + TypeScript + Tailwind + shadcn-style UI + framer-motion + recharts + react-router v7 + Convex (backend/database) + Convex Auth. Bun sebagai package manager.

## Canonical files
- PROJECT_CONTEXT.md — dokumen ini (stack, fase, keputusan)
- research/RESEARCH.md — temuan otomasi nyata konten.com (termasuk keterbatasan)
- research/AGENT_RESEARCH.md — riset agent framework, video pipeline & safety pattern
- research/HERMES_CANONICAL_CONTEXT.md — canonical strategic context untuk autonomous organization / venture organism
- KONTEN_MAP.md — peta endpoint + field `brief_detail` yang dipakai integrasi
- MEMORY.md — session state & status verifikasi
- PRD.md — spesifikasi produk lengkap v2.3

## Keputusan arsitektur
1. Backend = Convex (schema, auth, ingest bridge, parser brief, autopilot plan, crons).
2. Integrasi konten.com = **bridge pattern**: crawler Playwright lokal (`scripts/bridge-sync.ts`) menarik data via sesi resmi user lalu POST ke action `ingest:applySnapshot` dengan token `INGEST_TOKEN`. Hanya mirror data milik user sendiri.
3. **Bridge wajib mengambil detail per campaign** (`/api/campaigns/:slug`). Endpoint list tidak memuat `brief_detail`; tanpa langkah detail, Brief Autopilot tidak punya materi/narasi/do-don't.
4. Brief Autopilot: `parseBrief()` menghasilkan rencana dari brief asli (hook dari sudut campaign, shotlist berskala durasi, `boleh[]` vs `dilarang[]`, target audiens, caption wajib) + checklist tugas (termasuk tugas "CEK LARANGAN") + skor kepatuhan.
5. Bounded Organism Kernel (`src/convex/lib/organism.ts`): Constitution, dynamic goals, capability registry, memory, experiments, and local provider config UI.
6. AutoShorts Manifest (`src/lib/autoshorts.ts`): Clean-room candidate manifest 9:16 untuk local renderer.
7. Autonomy Queue (`src/lib/autonomy.ts`): Lifecycle campaign & social handoff yang selalu `review_required`.
8. Non-goals: auto-submit video ke konten.com, bot views/engagement, auto-posting tanpa review operator.
