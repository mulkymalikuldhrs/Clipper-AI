# Product Requirements Document — Super Clipper

**Status:** Shipped MVP / active iteration

**Version:** 2.2

**Last updated:** 24 September 2026

**Owner:** Super Clipper product and engineering

**Primary surface:** Web app Vite + React, protected workspace backed by Convex

---

## 1. Product summary

Super Clipper is a personal operations console for clippers who work through the [konten.com](https://konten.com) clipping marketplace. It turns a logged-in clipper session into an organized workflow:

1. Pull campaign and brief data from the user's own marketplace session.
2. Rank campaign opportunities using transparent economic heuristics.
3. Convert a campaign brief into a production plan with shotlist, hook, caption, CTA, and compliance tasks.
4. Keep analytics, earnings, sync health, and campaign state in one workspace.

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

- A new user can sign up, seed demo data, and reach a populated dashboard without a marketplace credential.
- A connected user can see campaign count, joined count, score, economic metrics, and brief detail.
- Autopilot creates a plan with at least a hook, duration window, shotlist, caption/CTA path, and task checklist when a brief is available.
- A failed plan creation is visible and retryable; it does not disappear into an unhandled promise rejection.
- The public and authenticated UI has no page/console errors or horizontal overflow in the targeted smoke pass at desktop and mobile widths.
- Campaign access and mutations are scoped to the authenticated user in Convex.

### Quality targets

- Application and script typechecks pass.
- Pure scoring and brief-parser regression tests pass.
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

### Journey A — new user and demo workspace

1. User lands on `/` and sees the product scope, field-tested data, and CTA.
2. User selects the auth CTA and reaches `/auth`.
3. User creates an account.
4. After authentication, the app attempts demo seeding and navigates to `/app`.
5. User opens Bridge and selects **Isi data demo** if seeding is not already complete.
6. User sees the populated dashboard and can explore Scanner, Autopilot, Analytics, Earnings, and Bridge.

**Acceptance criteria**

- Signed-out users can reach `/auth` without a dead-end redirect.
- `returnTo` accepts internal paths and falls back to `/app` for external or malformed values.
- Demo data is clearly labeled and does not require marketplace credentials.
- Successful auth lands in the protected workspace, not back on the landing page.

### Journey B — discover a campaign

1. User opens Scanner.
2. User searches by campaign title, brand, or category, or selects **Diikuti**.
3. User sorts by score, CPM, remaining budget, competitors, or minimum views.
4. User opens a campaign row.
5. User reviews economics, brief, materials, deadline, platform, and compliance rules.
6. User marks the campaign as joined or opens the source brief on konten.com.

**Acceptance criteria**

- Sorting is available from keyboard-accessible buttons.
- Sorting does not cause the focused header button to lose focus.
- Missing budget or views values are shown as unavailable rather than fabricated.
- Campaign detail never crashes on a malformed array in a brief field.

### Journey C — create an Autopilot plan

1. User follows or opens a campaign with a usable brief.
2. User chooses **Susun rencana**.
3. The server normalizes the raw brief and generates:
   - hook and angle;
   - duration min/max;
   - shotlist segments;
   - required narrative points;
   - CTA and caption/hashtags;
   - materials;
   - required, allowed, and forbidden rules;
   - production, compliance, and posting tasks.
4. User reviews the plan in the Autopilot tabs.
5. User checks off tasks and updates plan status: `draft`, `ready`, `shooting`, or `done`.

**Acceptance criteria**

- Creating an existing plan is idempotent.
- Every task belongs to the current user's plan.
- A rejected mutation is shown as an error and the manual action can be retried.
- Autopilot does not submit or publish anything.

### Journey D — monitor performance and payouts

1. User opens Analytics to inspect daily views and earnings.
2. User opens Earnings to inspect earned, on-hold, withdrawable, and paid views.
3. User checks Bridge for last sync, source, cache size, and sync activity.
4. User returns to Scanner when a new sync changes opportunity ranking.

**Acceptance criteria**

- Empty, loading, demo, stale, and error states are visually distinct.
- Demo earnings are labeled as sample values.
- Sync metadata identifies source and timestamp.
- The UI does not imply that a score guarantees approval or payout.

---

## 7. Functional requirements

### FR-1 — Authentication and workspace isolation

- Support Convex Auth email/password sign-in and sign-up.
- Protect all `/app/*` routes with `RequireAuth`.
- Scope Convex queries and mutations to the current authenticated user.
- Support an internal `returnTo` path after auth.
- Reject protocol-relative and external return targets.

### FR-2 — Marketplace bridge

- Authenticate using either email/password or a user-provided session-cookie payload.
- Pull campaign list and per-campaign detail.
- Pull joined campaigns, earnings, wallet/tier data, and views timeseries when available.
- Push normalized data through the authenticated Convex ingest action.
- Preserve raw campaign data for later parsing and debugging.
- Record sync source, status, timestamp, and optional error message.

### FR-3 — Campaign scanner

- Show campaign title, brand, category, platforms, status, score, CPM, remaining budget, competitors, and minimum views.
- Provide text search and joined/all filtering.
- Provide sorting in both directions for score, CPM, remaining budget, competitors, and minimum views.
- Preserve keyboard focus while sorting.
- Link each row to campaign detail.

### FR-4 — Campaign detail

- Show campaign economics and score.
- Show source brief, target audience, goal, narrative, CTA, caption, materials, required elements, and allowed/forbidden rules.
- Show missing-brief state with a clear Bridge next step.
- Mark/unmark a campaign as joined.
- Launch plan creation.

### FR-5 — Autopilot

- Generate a plan from `raw.brief_detail` when available.
- Normalize newline, bullet, and array brief fields.
- Provide deterministic fallback content when CTA or narrative is absent.
- Scale shotlist timing to the brief duration.
- Keep required, allowed, and forbidden rules separate.
- Create ordered tasks grouped into material, production, compliance, and posting.
- Support task completion and plan status transitions.
- Reuse an existing plan rather than creating duplicates.
- Display mutation failures and permit manual retry.

### FR-6 — Analytics and earnings

- Render daily views timeseries and campaign-level earnings.
- Show total earned, on-hold, withdrawable, paid views, row value, and payout readiness.
- Clearly label demo/sample financial data.
- Show loading and empty states without implying a successful sync.

### FR-7 — Operational UX

- Use the shared console primitives for panels, tables, metrics, status, meters, scores, loading, and empty states.
- Keep data tables horizontally scrollable on small screens without page-level overflow.
- Use semantic lists for ordered and unordered brief rules.
- Use a consistent loading and error language.
- Maintain a consistent link from public CTAs to auth and from auth to `/app`.

### FR-8 — Production-ready bridge operations

- Reject unauthenticated ingest requests before parsing or mutating data.
- Enforce a 1 MiB request body limit before applying the payload.
- Validate email, source, snapshot object, and bounded campaign/joined/earnings arrays.
- Accept an opaque request ID from the local bridge and deduplicate an already-recorded request.
- Upsert campaigns by `(userId, external campaign ID)` rather than creating duplicate cache rows.
- Record `pending`, `ok`, or `error` for every live ingest, including duration, campaign count, and a safe error code/message.
- Return a generic failure response to the client while retaining a bounded diagnostic in the user-scoped sync log.
- Retain only the most recent 30 days of sync logs through scheduled housekeeping.
- Keep scheduled refresh, retry/backoff, alerting, and external model/media providers explicitly out of MVP scope until separately approved.

Acceptance criteria:

1. A valid request creates one snapshot, upserts each external campaign once, and ends in `ok`.
2. Repeating the same `requestId` does not create another campaign or plan operation and returns the prior result count.
3. A body over 1 MiB, invalid source/email, malformed snapshot, or oversized collection returns a client error and writes no snapshot.
4. An internal apply failure creates an `error` log without exposing credentials or raw stack traces in the HTTP response.
5. The Bridge UI displays pending, successful, and failed statuses without treating pending as success.

### FR-9 — Bounded organism kernel

- Keep a user-scoped organism profile with an immutable-ish constitution, mode, and daily action budget.
- Represent dynamic goals as candidates scored by impact, confidence, learning, feasibility, cost, and risk.
- Treat `do nothing` as a valid result when no safe candidate exists.
- Maintain a capability registry with `available`, `missing`, `quarantined`, and `blocked` states.
- Keep experiments measurable with hypothesis, baseline, score, risk, evidence, and adopted/rejected outcome.
- Keep memory user-scoped, bounded, provenance-tagged, and confidence-scored.
- Allow only `observe`, `review`, and `paused` modes in this slice; the kernel never executes external tools.
- Use scheduled jobs only to select a goal for review, not to mutate source code, call a model, spend money, or publish content.

Acceptance criteria:

1. A new workspace can initialize the kernel without a second backend or external credential.
2. The UI exposes constitution, action budget, goal queue, capability gaps, memory, and experiment outcomes.
3. A daily scheduler selects at most one safe goal and records the decision, including a do-nothing event when appropriate.
4. Experiment adoption requires at least 0.10 measured improvement and risk no higher than 0.5.
5. No route or mutation exposes shell, filesystem, browser, provider, spending, or marketplace publishing capability.

### FR-10 — Local provider configuration

- Provide a protected Organism UI for an optional OpenAI-compatible base URL, model name, and API key.
- Validate URL scheme, length, and unsafe URL components before saving.
- Store only non-secret base URL/model in browser local storage.
- Store an API key only in browser session storage; never send it to Convex or the repository.
- Keep the provider disconnected from automatic execution until explicit opt-in, quota, retention, and security review are implemented.
- Provide a single clear/remove control and clear status showing whether local configuration exists.

Acceptance criteria:

1. A user can replace the base URL and model from `/app/organism` without editing source files.
2. Invalid protocols, URLs containing credentials/query/hash, missing model, and oversized values are rejected.
3. Reloading the page restores non-secret settings but not the session API key.
4. No provider request is made by the bounded organism kernel.

---

## 8. Data model and ownership

| Entity | Purpose | Owner scope |
|---|---|---|
| `users` | Convex Auth identity and profile fields. | One authenticated user. |
| `kontenSnapshots` | Latest mirror of profile, campaigns, joined, earnings summary, timeseries, wallet, tier, and notifications. | Indexed by `userId`. |
| `kontenCampaigns` | Searchable campaign cache, normalized economics, joined state, score, and raw payload. | Indexed by user and joined state. |
| `kontenEarnings` | Recent normalized earning rows and view/amount/status metadata. | Indexed by user and earned time. |
| `autopilotPlans` | Generated plan and normalized brief output. | Indexed by user and campaign external ID. |
| `planTasks` | Ordered checklist items belonging to a plan. | Verified through parent plan ownership. |
| `syncLogs` | Recent bridge sync status, request ID, duration, campaign count, and safe error details. | Indexed by user and user/request ID; pruned after 30 days. |
| `organismProfiles` | Constitution, safe mode, action budget, and evaluation timestamp. | One profile per user. |
| `organismGoals` | Dynamic goal candidates with value, learning, feasibility, cost, risk, and lifecycle. | Indexed by user. |
| `organismCapabilities` | Capability inventory with trust, source, and availability state. | Indexed by user. |
| `organismExperiments` | Measurable experiment ledger and adoption decisions. | Indexed by user. |
| `organismMemories` | Bounded provenance-tagged lessons and decisions. | Indexed by user. |
| `organismEvents` | Observable decisions, mode changes, experiment outcomes, and do-nothing events. | Indexed by user. |

All user-facing queries must return only records owned by the authenticated user. A missing record and an unauthorized record should be safe to treat as not found where appropriate.

---

## 9. Scoring and brief-generation logic

### Campaign score

```text
score = 0.35 * CPM score
      + 0.30 * remaining-budget score
      + 0.20 * competition score
      + 0.15 * view-barrier score
```

- CPM is normalized against 5,000 and clamped to 0–100.
- Remaining budget is calculated from `budget - spent` when a positive budget exists.
- A missing budget may use the source `remainingPct`; otherwise the implementation uses a safe fallback.
- Competition uses a logarithmic scale and rewards fewer competing clippers.
- View barrier rewards lower minimum-view requirements.
- Final score is rounded to 0–100.

The score is a triage heuristic, not a forecast or guarantee.

### Brief parser

- Accept string, newline-delimited, bullet-prefixed, and array fields.
- Strip common list prefixes and ignore empty lines.
- Normalize materials to `{ title, url }` and drop entries without a URL.
- Parse `narasi`, `elemenWajib`, `bolehDilakukan`, `dilarangDilakukan`, CTA, caption, hashtags, target audience, goal, and duration.
- Generate fallback CTA/narrative only when the source omits them.
- Build shotlist segments from duration max.
- Calculate a compliance score from brief completeness, not from campaign performance.
- Return normalized fields while preserving the original `raw` campaign payload.

---

## 10. Non-functional requirements

### Security and privacy

- Never commit `.env`, `.env.local`, cookies, passwords, or ingest tokens.
- Never expose bridge credentials to the React client.
- Validate auth ownership on queries and mutations.
- Keep external source links clearly external and use safe `rel` attributes.
- Do not claim that demo data or generated content is marketplace approval.
- Treat repository/runtime reality as authoritative over stale documentation or prior agent claims.
- Distinguish known, unknown, assumption, unverified, contradicted, and stale state.
- Prefer reuse, evidence, reversibility, and do-nothing over unnecessary new components.
- The organism kernel must not expose host execution, shell, filesystem, browser, model, spending, or publishing tools.
- Capability adoption requires provenance, risk, and a human-visible decision.

### Reliability

- Treat third-party payload shapes as unstable.
- Enforce bounded request and collection sizes at the HTTP boundary.
- Make retryable ingest safe through an opaque request ID and external-ID upserts.
- Keep operation status observable (`pending`, `ok`, `error`) without exposing secrets.
- Do not let malformed brief values crash the campaign detail route.
- Surface failed plan mutations rather than swallowing them.
- Keep auth redirect targets internal.
- Preserve responsive layout and keyboard operability.

### Performance

- Keep the dashboard usable at 1440px and 390px widths.
- Avoid page-level horizontal overflow; isolate wide tables in their own scrollers.
- Use reactive Convex queries without duplicating server state in client state.
- Use deterministic pure helpers for testable business logic.

### Maintainability

- Use existing React, Convex, Tailwind, and shadcn conventions.
- Keep console primitives centralized.
- Add unit tests for pure scoring, brief parsing, and bounded ingest validation.
- Add browser smoke checks for route rendering, public/auth flow, overflow, and console errors.

---

## 11. Current delivery status

### Shipped in the current MVP

- Public landing and auth pages using the operations-console language.
- Protected dashboard with Ringkasan, Scanner, Autopilot, Campaign Detail, Analytics, Earnings, Bridge, and Organism routes.
- Convex Auth and user-scoped campaign/earnings/plan data.
- Bridge ingest and demo seed path.
- Bounded, token-authenticated ingest with request ID deduplication, operation status, and 30-day log retention.
- Full campaign `brief_detail` parsing and production plan generation.
- Campaign scoring and joined-state filtering.
- Bounded organism kernel with constitution, dynamic goals, capability registry, memory, experiment ledger, and safe scheduler.
- Desktop/mobile smoke harness.
- Bun unit tests for scoring and brief parsing.
- CI typecheck and unit-test steps.

### Known limitations

- Bridge behavior depends on the shape and availability of undocumented marketplace endpoints.
- The current parser is deterministic; no external AI provider is required or configured.
- The smoke test requires a running preview and writes temporary test data to a Convex workspace.
- Earnings in demo mode are representative examples, not live financial records.
- The marketplace remains responsible for submission, approval, and payout.

---

## 12. Milestones

### M0 — Research and data contract — complete

- Crawl and map clipper routes and JSON endpoints.
- Identify campaign detail and brief fields.
- Confirm scoring inputs and payout-related fields.
- Preserve field data in research artifacts without committing sensitive crawl dumps.

### M1 — Workspace and console — complete

- Create auth-protected dashboard.
- Implement scanner, campaign detail, analytics, earnings, and bridge views.
- Establish shared console primitives and responsive table behavior.

### M2 — Brief Autopilot — complete

- Normalize brief fields.
- Generate shotlist, hook, caption, CTA, rules, and tasks.
- Support plan status and task completion.
- Add mutation error handling and idempotent plan creation.

### M3 — Reliability and release quality — complete for MVP

- Add unit tests for pure business logic.
- Add browser smoke coverage and non-zero failure behavior.
- Add CI typecheck and unit test coverage.
- Harden auth redirects, malformed payload handling, and keyboard sorting.

### M4 — Production sync hardening — in progress

- Completed: bounded HTTP ingest, request validation, request ID deduplication, status/error logging, and 30-day retention.
- Next: retry/backoff and clearer sync failure recovery.
- Next: scheduled sync and operational notification policy.
- Next: integration fixtures for endpoint drift.
- Next: migration/versioning strategy for normalized payloads.

### M5 — Organism kernel foundation — in progress

- Completed: constitution, dynamic goal policy, capability registry, memory, experiment ledger, safe modes, and daily goal selection.
- Next: add richer world-model signals from verified performance and cost data.
- Next: add human review gates and richer experiment metrics.
- Future: optional external capability adapters only after sandbox, quota, retention, and rollback review.

### M6 — Collaborative production loop — future

- Plan history and reviewer notes.
- Exportable shotlist/caption/rule sheets.
- Optional assisted hook evaluation using measured performance.
- Clear opt-in boundaries before sending campaign content to any external model.

---

## 13. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Marketplace endpoint or field changes | Sync or brief parsing degrades | Keep raw payload, parse defensively, add fixtures, show sync errors. |
| Credential leakage | Account compromise | Keep secrets local, use short-lived ingest token, never expose in frontend or commit. |
| Score mistaken for guaranteed earnings | Poor campaign decisions | Show formula, caveats, source fields, and brief review requirements. |
| Generated plan misses a rule | Rejected or non-compliant submission | Preserve required/forbidden fields, compliance score, and manual checklist. |
| Demo data mistaken for live data | Incorrect decisions | Label source and use demo indicators throughout UI. |
| Broad raw payload growth | Storage and privacy cost | Enforce request/collection limits, preserve only the latest snapshot, and prune sync logs after 30 days. |
| Browser smoke writes test data | Noisy workspace | Keep smoke manual/local and use isolated test deployment where possible. |
| Duplicate or concurrent bridge request | Repeated writes or confusing state | Use opaque request ID, atomic begin/finish status, and external campaign ID upserts. |
| Optional media/model provider expands trust boundary | Cost, privacy, and licensing exposure | Keep it opt-in and separate from the current deterministic parser; require provider, retention, and license review. |

---

## 14. Product decisions to review

1. Should users be able to configure the scoring weights per workspace?
2. Should Autopilot generate multiple hook variants or a single conservative hook in MVP?
3. Should plans support a draft/review/approved lifecycle before production?
4. Which external model, if any, is appropriate for optional brief enhancement, and what explicit opt-in and retention policy will govern it?
5. How long should raw marketplace payloads be retained beyond the current snapshot and 30-day sync-log policy?
6. Should the Bridge support multiple marketplace accounts per user?
7. What export format is most useful: Markdown, CSV, ZIP, or a clipper-specific sheet?
8. Should a durable queue service be added only when measured sync volume requires it, or should Convex scheduled actions remain the sole backend?

---

## 15. Research basis and reuse policy

The production-readiness decisions in this PRD were informed by the following repository
reviews. They are references, not vendored dependencies. The full second-pass research record is in
[`research/AGENT_RESEARCH.md`](research/AGENT_RESEARCH.md). The governing strategic context is
[`research/HERMES_CANONICAL_CONTEXT.md`](research/HERMES_CANONICAL_CONTEXT.md).

1. [harry0703/MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo) — pipeline stages, batch/history, example config, same-origin CORS, and bounded batch.
2. [FujiwaraChoki/MoneyPrinterV2](https://github.com/FujiwaraChoki/MoneyPrinterV2) — modular automation and scheduler boundaries; its AGPL-3.0 license and outreach/auto-post scope are not reused.
3. [RayVentura/ShortGPT](https://github.com/RayVentura/ShortGPT) — separate content, asset, voice, caption, and editing engines.
4. [Huanshere/VideoLingo](https://github.com/Huanshere/VideoLingo) — progress resumption, pause/stop, output cache, and stage error logs.
5. [Zulko/moviepy](https://github.com/Zulko/moviepy) — explicit media composition and output formats.
6. [WyattBlue/auto-editor](https://github.com/WyattBlue/auto-editor) — deterministic first-pass cuts, margins, thresholds, and auditable exports.
7. [m1guelpf/auto-subtitle](https://github.com/m1guelpf/auto-subtitle) — explicit subtitle model and output artifact boundary.
8. [Comfy-Org/ComfyUI](https://github.com/Comfy-Org/ComfyUI) — reusable graph workflows, asynchronous queueing, cancellation, and workflow/seed artifacts.
9. [triggerdotdev/trigger.dev](https://github.com/triggerdotdev/trigger.dev) — durable tasks, retries, checkpointing, concurrency, and human-in-the-loop.
10. [inngest/inngest](https://github.com/inngest/inngest) — event/step retries, concurrency keys, rate limits, and run history.
11. [restatedev/restate](https://github.com/restatedev/restate) — durable execution, exactly-once messaging, state, and observability.
12. [mutonby/openshorts](https://github.com/mutonby/openshorts) — self-hostable clip pipeline, local model endpoint, async jobs, explicit GPU/model boundaries.
13. [HKUDS/VideoAgent](https://github.com/HKUDS/VideoAgent) — intent decomposition, graph planning, adaptive feedback, and self-evaluation.
14. [Human-Agent-Society/CORAL](https://github.com/Human-Agent-Society/CORAL) — isolated worktrees, grader daemon, shared knowledge, and bounded self-evolution.
15. [PrimeIntellect-ai/prime-agent](https://github.com/PrimeIntellect-ai/prime-agent) — continual harness, memory, subagents, bounded autonomy, and refinement snapshots.
16. [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent) — memory, skill lifecycle, schedules, isolated subagents, and local execution boundaries.
17. [inclusionAI/AWorld](https://github.com/inclusionAI/AWorld) — build → evaluate → evolve and evaluator-defined quality.
18. [aiming-lab/AutoResearchClaw](https://github.com/aiming-lab/AutoResearchClaw) — time-decayed lessons, verification, pivot/refine/proceed, and human intervention modes.
19. [openclaw/openclaw](https://github.com/openclaw/openclaw) — local-first gateway, deterministic policy, untrusted inbound input, and sandbox guidance.
20. [RightNow-AI/openfang](https://github.com/RightNow-AI/openfang) — autonomous hands, manifests, approval gates, audit trail, and resource metering.
21. [openai/swarm](https://github.com/openai/swarm) — lightweight handoffs, tool boundaries, context variables, and turn limits; educational/superseded status noted.
22. [langchain-ai/langgraph](https://github.com/langchain-ai/langgraph) — durable stateful execution, checkpoints, memory, and observability.
23. [microsoft/autogen](https://github.com/microsoft/autogen) — message-driven agents, MCP, and bounded tool iterations; maintenance-mode warning noted.

No external code is copied into the application. License compatibility, provider terms,
asset rights, and data-retention obligations must be reviewed again before any future
LLM, TTS, stock-media, ComfyUI, or rendering integration. The current product remains a
human-in-the-loop marketplace console and does not auto-submit or auto-publish.

---

## 16. Definition of done for future changes

A feature is ready when:

- Its user problem and non-goals are documented here.
- It has an explicit loading, empty, error, and unauthorized state where relevant.
- Sensitive data boundaries are respected.
- Pure business logic has focused unit tests.
- User-facing changes pass the relevant typecheck and browser smoke path.
- Responsive and keyboard behavior are verified.
- Documentation and changelog are updated with the shipped behavior.
