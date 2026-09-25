# Product Requirements Document — Clipper AI

**Status:** Active MVP / safe iteration
**Owner:** Product and engineering
**Last verified:** 25 September 2026

## 1. Product thesis

Clipper AI is a minimal operating console for marketplace clipping. It reduces the distance between a campaign opportunity and a reviewable production specification without pretending that discovery, generation, and external submission are the same action.

The product is successful when an operator can:

1. see which campaigns are worth investigating;
2. understand the source, economics, and brief constraints;
3. create a production plan grounded in source data;
4. coordinate optional AI roles without losing human control;
5. evaluate evidence and approve the next reversible action.

## 2. Goals

- Provide a fast, source-backed campaign scanner.
- Support Konten own-session data and public Content Rewards Discover data.
- Generate deterministic plans from real `brief_detail` or discovery requirements.
- Keep financial units and marketplace provenance visible.
- Provide an extensible connector catalog without arbitrary secret exposure.
- Provide a bounded, role-based agent swarm for optional AI collaboration.
- Preserve human review for skills, publishing, payments, account actions, and other consequential operations.

## 3. Non-goals

- Automatic marketplace joining, video submission, or social publishing.
- Fake views, engagement, or account takeover.
- Storing marketplace cookies or API keys in the repository or Convex.
- Arbitrary shell/filesystem access for browser agents.
- Unreviewed self-modifying source code.
- Silent currency conversion.
- Claiming that a score predicts earnings.

## 4. Users and surfaces

The product has no registration wall, no sign-in, and no auth form. Each browser mints one random workspace key in `localStorage`, and that key owns the plans, tasks, and organism state created from it. Data remains empty or source-backed until an operator runs a bridge or a public discovery sync. Public discovery records are readable by any visitor; own-session bridge records are readable only by the workspace that owns them.

Explicitly out of scope for the login-free console: server actions that spend money or touch external credentials (`src/convex/connectors.ts`) still require a Convex-authenticated user, so they are not reachable from the shipped UI. They stay in the codebase as a bounded, review-gated surface for a deployment that adds auth; the console must not present them as working buttons.

Primary surfaces:

- `/` — minimal product landing page.
- `/app` — operational summary.
- `/app/scanner` — searchable and sortable campaign table.
- `/app/campaign/:id` — economics, source, brief, and plan entry point.
- `/app/autopilot` — production plan and review queue.
- `/app/analytics` — source-backed performance views.
- `/app/earnings` — known earnings rows and payout context.
- `/app/bridge` — connector and sync operations.
- `/app/organism` — bounded goals, capabilities, memory, and experiments.
- `/app/swarm` — local-first AI role control room.
- `/app/accounts` — non-secret social account metadata and review status.

## 5. Functional requirements

### 5.1 Marketplace discovery

- Konten data comes from the operator's own local session.
- Content Rewards uses public JSON endpoints only.
- Content Rewards sync is bounded to 60 campaigns, 10 list pages, and polite request delays.
- Content Rewards IDs are namespaced to avoid collisions.
- Campaign snapshots are stored separately by source.
- The UI shows the marketplace and uses the correct currency.

### 5.2 Campaign intelligence

- Scanner supports search, joined/all filtering, and sorting by score, CPM, remaining budget, competition, and minimum views.
- Scores are heuristic and clearly labeled as such.
- Campaign detail shows source, status, platform, economics, brief material, and compliance information.
- Unknown values remain unknown; the system does not fabricate CTA, caption, earnings, or joined state.

### 5.3 Brief Autopilot

- Parse source brief fields defensively.
- Produce hook, narrative, shotlist, CTA, caption, duration, materials, and compliance checklist only when supported by source data or an explicitly labeled fallback.
- Keep CTA/caption empty for discovery-only records when the source omits them.
- Task submission/publishing remains manual and marketplace-specific.

### 5.4 Agent Swarm

- Define explicit roles with independent prompts and shared bounded context.
- Support coordinator, researcher, producer, reviewer, memory, and connector roles.
- Support custom OpenAI-compatible base URL and model.
- Keep API keys in sessionStorage only for the browser runtime.
- Limit a run to four model calls.
- Persist capped sessions and memory locally.
- Evaluate goal clarity, output, and evidence.
- Propose skills only as `review_required`; never activate automatically.
- Browser heartbeat is explicitly non-durable and tab-dependent.

### 5.5 Connectors

- Catalog connectors by capability and secret boundary.
- Apify Actor calls run server-side with `APIFY_TOKEN` and authenticated Convex context.
- Whop account probes run server-side with `WHOP_API_KEY`; payment and payout actions are not automated.
- Content Rewards remains read-only.
- Generic webhooks require signing, replay protection, allowlists, and payload limits before activation.

### Platform and API

- A workspace is identified by a browser-held key and carries a plan (`free` / `studio` / `agency`).
- Plan limits are enforced inside the mutation that consumes the resource: plans, goals, API keys, and daily API requests.
- Usage is metered per workspace in `usageEvents`, and every number shown in the console comes from that table.
- Workspace API keys are created in the browser and stored only as a SHA-256 hash plus a display prefix.
- The HTTP API is read-only, versioned in the response body, and returns 401 for revoked keys and 429 for exhausted quota.
- Billing, compute provisioning, per-tenant storage, and outbound webhooks are explicitly out of scope until implemented; see `PLATFORM.md`.

## 6. Non-functional requirements

- TypeScript strict typecheck passes for app and scripts.
- Bun unit tests cover normalizers, safety policy, and connector metadata.
- Convex codegen is run after schema/function changes.
- No raw credentials or private crawl artifacts are committed.
- Responsive layouts avoid horizontal page overflow; tables may scroll within their own container.
- UI remains keyboard accessible and uses semantic links/forms.
- External requests are bounded, cancellable, and do not run from background tabs indefinitely.

## 7. Data and security requirements

- `INGEST_TOKEN` is required for HTTP ingest.
- Ingest validates email, source, request ID, body size, and collection size.
- Convex mutations verify user ownership for protected data.
- Server-side provider keys are read from environment variables only.
- Browser provider keys are never sent to Convex.
- Social publishing remains `review_required` until official OAuth and media validation exist.
- Security-sensitive reports must not be filed as public issues.

## 8. Acceptance criteria

### Discovery

- Given a valid bridge payload, campaign rows appear with source, title, brand, economics, and status.
- Given a Content Rewards detail response, the normalized record contains USD economics, HTTPS assets, and requirements when present.
- Given a missing or malformed source field, the normalizer skips or preserves the unknown without throwing an unbounded error.

### Agent swarm

- Given a valid local provider, a run produces bounded role messages and a shared transcript.
- Given a missing provider, the UI shows a clear configuration error and does not call a random endpoint.
- Given a proposed skill, the default state is `review_required` and no prompt/code mutation occurs.

### Platform

- Given an unknown plan id, the workspace resolves to `free` instead of failing open, and no plan can exceed `HARD_LIMITS`.
- Given a workspace at its plan limit, the corresponding mutation rejects the write with a message that names the plan and the limit.
- Given a revoked API key, `/api/v1/*` responds 401; given an exhausted daily quota, it responds 429; given a valid key, the request is recorded in `usageEvents`.
- `listApiKeys` never returns a key hash.

### Connectors

- Given missing `APIFY_TOKEN`, the action fails with a configuration error.
- Given a non-allowlisted actor ID, the action rejects it.
- Given missing `WHOP_API_KEY`, the action fails closed.
- No connector action accepts an arbitrary provider URL or API key from an untrusted public payload.

## 9. Success metrics

- Time from first sync to a reviewable production plan.
- Percentage of campaigns with usable source brief material.
- Sync success rate and bounded-request failure rate.
- Number of runs that end in `do_nothing` or `needs_evidence` rather than unsafe action.
- Skill proposals approved versus rejected.
- Zero credential leaks, fake engagement actions, or unreviewed consequential actions.

## 10. Roadmap

### Next

- Billing: payment provider, signed webhook that writes the workspace plan, plan-change audit log, then an upgrade button that can actually charge.
- Outbound webhook with signature, retry/backoff, dedupe, and dead-letter queue.
- API integration tests that fail when the response contract changes.
- Durable Convex-backed swarm sessions and memory for authenticated workspaces.
- Provider health checks and model routing by role.
- Apify Actor allowlist and result normalization.
- Signed webhook ingestion with replay protection.
- Server-side durable scheduler with budgets and leases.

### Later

- Sandboxed rendering worker for clip candidates.
- Official social OAuth and media upload handoff.
- Evaluator-backed experiment system with rollback.
- Simulation/grounding experiments inspired by MiroFish/MiroShark, isolated from production actions.

## 11. Operator runtime acceptance criteria

The operator runtime is considered implemented only when these boundaries are true:

- A Bun CLI exposes source status, connector catalog, MCP tool catalog, daemon state, and browser URL policy without arbitrary command execution.
- A daemon can be started explicitly by an operator, acquires a local lock, records a state file, uses bounded intervals, handles SIGINT/SIGTERM, and defaults to observe-only public discovery.
- Optional daemon sync writes only normalized Content Rewards snapshots through the existing token-protected ingest route; it never joins, submits, publishes, or uses marketplace cookies.
- An MCP stdio server built with the official TypeScript SDK exposes an explicit read-only tool allowlist. Tool handlers must not accept arbitrary URLs, shell commands, API keys, or filesystem paths.
- The built-in browser runner is Playwright, allowlisted by origin and path, and limited to page title/body text. No click, form, download, anti-detection, CAPTCHA, Cloudflare, or anti-bot bypass behavior is permitted.
- A Camofox-compatible external binary remains an optional, operator-owned adapter contract until its upstream and protocol are independently verified; it is not described as official or built-in.
- Unit tests cover the browser allowlist, daemon bounds, secret redaction, and MCP no-write policy.

## 12. Known limitations

- Konten private endpoints can change without notice.
- Content Rewards is discovery-only and does not provide account earnings or joined state.
- Browser CORS may prevent some custom model endpoints.
- Local swarm memory is browser-scoped and not a cross-device source of truth.
- Managed Convex runtime health can lag source edits; codegen and preview checks are required.
