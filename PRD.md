# Product Requirements Document — Super Clipper

**Status:** Shipped v2.3 / active production console

**Version:** 2.3

**Last updated:** 24 September 2026

**Owner:** Super Clipper product and engineering

**Primary surface:** Web app Vite + React, protected workspace backed by Convex

---

## 1. Product summary

Super Clipper is a personal operations console for clippers who work through the [konten.com](https://konten.com) clipping marketplace. It turns a logged-in clipper session into an organized workflow:

1. Pull campaign and brief data from the user's own marketplace session.
2. Rank campaign opportunities using transparent economic heuristics.
3. Convert a campaign brief into a production plan with shotlist, hook, caption, CTA, and compliance tasks.
4. Keep analytics, earnings, sync health, social accounts, and organism state in one workspace.

The product is deliberately **assistive and human-in-the-loop**. It prepares decisions and production material; it does not create fake views, automate engagement, or submit videos on the user's behalf.

The current Autopilot parser is deterministic and based on the actual `brief_detail` payload. Generative AI integration is a future enhancement, not a current runtime dependency.

---

## 2. Problem statement

Clipper marketplace work is fragmented across several dashboard pages and requires repeated manual decisions:

- Campaign economics and eligibility are hard to compare quickly.
- Brief rules are buried in long detail pages and have inconsistent formats.
- Production planning starts from a blank document instead of the campaign's actual constraints.
- Views, earnings, payout status, and joined campaigns are disconnected.
- Users must keep marketplace credentials separate from the product that helps them work.

### Product opportunity

Create a trustworthy personal mirror of the user's own clipper workspace, with a workflow that goes from **discover → prioritize → plan → execute → monitor** without pretending to replace the marketplace.

---

## 3. Target users

### Primary persona: independent clipper

- Works across TikTok, Instagram Reels, and YouTube-style short-form opportunities.
- Uses a personal akun at konten.com and wants control of their session.
- Needs to choose campaigns by economics and deadline pressure.
- Wants a ready-to-execute brief, not generic video advice.

### Secondary persona: experienced clipper / small team operator

- Manages multiple campaigns and wants repeatable triage.
- Needs an auditable checklist and clear compliance guardrails.
- Wants analytics and earnings in the same operational view.
- May later need review notes, plan history, and export workflows.

### Explicitly out of scope for the MVP

- Managing official konten.com accounts or campaigns on behalf of a team.
- Automated video generation, rendering, posting, or submission.
- Views, engagement, or payout manipulation.
- Public campaign aggregation without the user's own session.
- Replacing the marketplace's approval, submission, or payout process.

---

## 4. Goals and success criteria

### Product goals

1. **Reduce campaign triage time** by making score, budget, competition, minimum views, and brief availability comparable in one scanner.
2. **Increase brief fidelity** by preserving the source `brief_detail` and surfacing its required/forbidden rules.
3. **Create an actionable plan** in under one minute after selecting a joined campaign.
4. **Make sync and earnings state legible** so the user knows when data is stale, demo, or incomplete.
5. **Keep credentials local** while still delivering a hosted, reactive workspace.

### MVP success criteria

- A user can land on `/` and navigate `/app` without friction or dead ends.
- A connected user can see campaign count, joined count, score, economic metrics, and brief detail.
- Autopilot creates a plan with at least a hook, duration window, shotlist, caption/CTA path, and task checklist when a brief is available.
- A failed plan creation is visible and retryable; it does not disappear into an unhandled promise rejection.
- The public and authenticated UI has no page/console errors or horizontal overflow in the targeted smoke pass at desktop and mobile widths.
- Campaign access and mutations are scoped to the authenticated user in Convex.

### Quality targets

- Application and script typechecks pass (`bun run typecheck`, `bun run typecheck:scripts`).
- Unit test suite covers scoring, brief parsing, organism policy, autonomy review, provider config, and social accounts (17 passing tests).
- Browser smoke fails non-zero on blank routes, overflow, page errors, or console errors.
- No credential is committed to the repository or sent to the frontend.

---

## 5. Product principles

1. **Source of truth first:** Prefer the marketplace brief over generated assumptions.
2. **Transparent scoring:** A score is a prioritization aid, not a promise of payout.
3. **Read-only marketplace access:** Super Clipper observes and organizes; it does not automate prohibited activity.
4. **Local secrets:** Browser code never receives bridge credentials.
5. **Graceful degradation:** Missing or changed fields should show an explicit fallback, not crash the page.
6. **Dense, calm UI:** The console prioritizes tables, labels, status, and evidence over decorative surfaces.
7. **One click, then judgment:** Autopilot accelerates preparation, but the clipper remains responsible for creative and compliance decisions.

---

## 6. Core user journeys

### Journey A — landing and workspace exploration

1. User lands on `/` and sees the product preview, field-tested data, and CTA.
2. User selects **Buka workspace** or **Mulai eksplorasi**.
3. User reaches `/app` directly without an enforced login wall.
4. User explores Scanner, Autopilot, Analytics, Earnings, Organism, Accounts, and Bridge.

### Journey B — discover a campaign

1. User opens Scanner.
2. User searches by campaign title, brand, or category, or selects **Diikuti**.
3. User sorts by score, CPM, remaining budget, competitors, or minimum views.
4. User opens a campaign row.
5. User reviews economics, brief, materials, deadline, platform, and compliance rules.
6. User marks the campaign as joined or opens the source brief on konten.com.

### Journey C — create an Autopilot plan & AutoShorts handoff

1. User opens a campaign with a usable brief.
2. User chooses **Susun rencana**.
3. The server normalizes the raw brief and generates hook, shotlist, narasi, CTA, caption/hashtags, materials, do/don't rules, and tasks.
4. User exports or copies the AutoShorts 9:16 candidate manifest for local rendering.
5. User reviews the plan, updates status, and prepares social posting handoff.

### Journey D — monitor performance, payouts & autonomy queue

1. User opens Analytics to inspect daily views and earnings.
2. User opens Earnings to inspect earned, on-hold, withdrawable, and paid views.
3. User checks Organism for dynamic goals, capability gaps, memory, and review required autonomy handoffs.
4. User opens Social Accounts to manage platform connection metadata.

---

## 7. Functional requirements

### FR-1 — Public Console & Navigation

- Expose `/` and `/app/*` routes without requiring account creation.
- Keep navigation smooth between Landing and Workspace.
- Scope Convex queries and mutations safely.

### FR-2 — Marketplace bridge

- Authenticate using either email/password or a user-provided session-cookie payload.
- Pull campaign list and per-campaign detail (`/api/campaigns/:slug`).
- Pull joined campaigns, earnings, wallet/tier data, and views timeseries when available.
- Push normalized data through the authenticated Convex ingest action.
- Preserve raw campaign data for later parsing and debugging.
- Record sync source, status, timestamp, and request ID.

### FR-3 — Campaign scanner

- Show campaign title, brand, category, platforms, status, score, CPM, remaining budget, competitors, and minimum views.
- Provide text search and joined/all filtering.
- Provide sorting in both directions for score, CPM, remaining budget, competitors, and minimum views while preserving keyboard focus.

### FR-4 — Campaign detail & Autopilot

- Show campaign economics, source brief, target audience, goal, narrative, CTA, caption, materials, required elements, and do/don't rules.
- Generate plans with scaled shotlist timing, required/allowed/forbidden rules, and ordered checklists.
- Generate AutoShorts-compatible 9:16 clip candidate JSON manifests.

### FR-5 — Analytics, Earnings & Social Accounts

- Render daily views timeseries and campaign-level earnings summary.
- Show withdrawable readiness, row value, and platform distribution.
- Manage local TikTok and Instagram metadata in `/app/accounts` with mandatory `review_required` publishing boundaries.

### FR-6 — Bounded Organism Kernel & Local Provider Config

- Maintain organism profile with Constitution, safe mode, and daily action budget.
- Evaluate dynamic goals, capability registry, provenance-tagged memories, and experiment outcomes.
- Select at most one safe goal per daily schedule run, including explicit do-nothing decisions.
- Provide local OpenAI-compatible provider configuration UI in `/app/organism` with `sessionStorage` key handling and client-side URL validation.

---

## 8. Definition of done

A feature is complete when:
- Unit tests cover business logic (`bun test`).
- Application and script typechecks pass without errors (`bun run typecheck`, `bun run typecheck:scripts`).
- Production Vite build completes cleanly (`bun run build`).
- Documentation (`README.md`, `CHANGELOG.md`, `PRD.md`, `PROJECT_CONTEXT.md`, `MEMORY.md`, `research/*`) is updated and aligned.
