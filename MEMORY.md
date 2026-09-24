# MEMORY — Super Clipper (session state)

## Status
- Repo: `mulkymalikuldhrs/Clipper-AI` (Vite + React + Tailwind + Convex + Convex Auth, Bun).
- Version: 2.3.0
- Phase: Upgrade, testing, research documentation, and full verification completed (24 Sep 2026).

## Console language & Visual System
- Satu bahasa visual untuk semua halaman publik maupun dashboard: garis rambut 1px, tanpa shadow/gradient/glow/kotak ikon, angka monospace `tabular-nums`, label mono uppercase 10px, warna hanya untuk makna.
- `Landing.tsx` dan `Auth.tsx` memakai primitif dari `src/components/shared.tsx` (`Panel`, `TableShell`, `TableRow`, `Score`, `KeyValueList`).
- Kelas dekoratif (`text-gradient`, `border-glow`, `glass`, `grid-bg`, `animate-pulse-glow`, `blur-3xl`, `bg-gradient`) nol pemakaian di seluruh `src/**/*.tsx`.

## Quality & Verification Status (24 Sep 2026)
- `bun run typecheck` & `bun run typecheck:scripts`: 0 TypeScript errors across app and scripts.
- `bun test`: 17 passing tests across `tests/konten.test.ts` and `tests/socialAccounts.test.ts` covering campaign scoring, ingest validation, provider config, organism policy, autonomy review, AutoShorts manifest, brief parsing, and social account normalization.
- `bun run build`: Production Vite build completes in ~8s cleanly.

## Key Research & Architecture Additions
- `research/AGENT_RESEARCH.md`: Comprehensive second-pass research on OpenShorts, VideoAgent, CORAL, Prime Agent, Hermes Agent, AutoResearchClaw, OpenClaw, OpenFang, Swarm, LangGraph, and AutoGen.
- `research/HERMES_CANONICAL_CONTEXT.md`: Strategic foundation document for Super Clipper as an Autonomous Venture Organism.

## Technical Principles
- Bridge WAJIB mengambil `/api/campaigns/:slug` per campaign; tanpa itu `raw.brief_detail` kosong.
- All social media handoffs require `review_required` approval; no automatic publishing or account takeover.
- Secret API keys are stored in browser `sessionStorage` only and never sent to Convex or committed to git.
