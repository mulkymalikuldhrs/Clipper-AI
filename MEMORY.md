# MEMORY — Clipper AI

**Last verified:** 25 September 2026
**Repository:** `mulkymalikuldhrs/Clipper-AI`
**Stack:** Vite + React 18 + TypeScript + Tailwind + shadcn-style primitives + Convex + Bun

## Current product state

- `/` is a public, product-first landing page.
- `/app/*` is a public console with no sign-in, no sign-up, and no auth form anywhere.
- Identity is one random 32-hex **workspace key** minted in `localStorage` (`src/lib/useWorkspace.ts`). It owns plans, tasks, and organism state for that browser only.
- Convex resolves the actor as: signed-in user if one exists → else the workspace key → else public-only. See `src/convex/workspace.ts`.
- Public discovery data (`content_rewards`, scope `public`) is readable by everyone; operator bridge data (`bridge`, scope `private`) is readable only by its owning workspace and is never returned to an anonymous console.
- Sync logs shown without a workspace are filtered to public sources, so private bridge activity is not leaked.
- Marketplace data is source-backed. The console does not ship synthetic campaign or financial records.
- Konten.com account data is mirrored only by the operator's local Playwright bridge.
- Content Rewards Discover is a separate public, read-only JSON source with bounded pagination and detail requests.
- `/app/swarm` is a local-first multi-agent control room with role selection, shared transcript/memory, custom OpenAI-compatible provider settings, evaluation, browser heartbeat, and review-gated skill proposals.
- The operator runtime adds an explicit Bun CLI, an operator-run lock/state daemon, an official MCP stdio server with a read-only allowlist, and a built-in Playwright page inspection runner.
- Content Rewards daemon discovery is observe-only by default; optional normalized ingest requires `SC_DAEMON_SYNC=true` plus the existing ingest token boundary.
- Camofox remains an optional adapter contract only. No official upstream, stealth, anti-detection, CAPTCHA, Cloudflare, or anti-bot bypass is claimed.
- `/app/platform` shows the workspace plan, enforced quotas, usage meter, API keys, and the API quickstart.
- Product name is **Clipper AI** everywhere. Legacy identifiers keep working on purpose: `SUPERCLIPPER_URL` and `SUPERCLIPPER_MODEL_*` env vars, `.superclipper/` operator state paths, and the old `localStorage` keys are read as fallbacks and migrated once.

## Visual system

The interface uses a restrained minimal operations language:

- neutral charcoal surfaces;
- one lime accent for action and positive signal;
- 1px hairline borders;
- rounded-md panels, not floating cards;
- no gradients, glow, glass blur, or decorative icon tiles;
- monospace tabular numbers and compact uppercase labels;
- content hierarchy created by whitespace and type scale.

Core primitives live in `src/components/shared.tsx`; global tokens and required Tailwind directives live in `src/index.css`.

## Data and automation boundaries

- `INGEST_TOKEN` protects the HTTP ingest boundary.
- Ingest bodies are bounded to 1 MiB and 500 records per collection.
- Content Rewards never uses account cookies, joins campaigns, submits work, publishes, or fabricates engagement.
- Browser AI API keys live in `sessionStorage`; non-secret provider URL/model settings live in `localStorage`.
- `APIFY_TOKEN` and `WHOP_API_KEY` are server-side Convex environment variables and never browser values.
- Agent skills cannot activate themselves: proposals begin as `review_required`.
- Browser heartbeat/cron only runs while the page is open. Durable operator work is available only through the explicit local daemon process, never as an automatic preview process.
- Social publishing and other consequential operations remain human review gated.

## Verified implementation

- `operatorWorkspaces` maps a browser key to a lightweight non-auth `users` row (same pattern as `ensureBridgeUser`), so the login-free console can persist work without a second backend. It also carries the workspace `plan`.
- Limits come from the plan catalog (`src/lib/plans.ts`): free/studio/agency = 25/200/1.000 plans, 15/120/500 goals, 2/10/40 API keys, 200/5.000/50.000 API requests per day. `HARD_LIMITS` caps any plan configuration.
- Quotas are enforced inside the mutation that consumes them (`createPlan`, `createOrganismGoal`, `createApiKey`, `meterApiRequest`), never only in copy.
- `usageEvents` is the meter: `plan.created`, `goal.created`, `api_key.created`, `api.request`, `ingest.snapshot`.
- Workspace API keys store only a SHA-256 hash plus a display prefix; the plaintext is minted and hashed in the browser, so the server never receives a usable key. `listApiKeys` never returns `hash`.
- `GET /api/v1/{workspace,campaigns,plans}` requires `Authorization: Bearer clai_...`, scope `read`, and a daily quota; exhausted quota returns 429, revoked keys return 401.
- `PLATFORM.md` states the SaaS/BaaS/IaaS posture honestly: no billing, no compute provisioning, no per-tenant database, no outbound webhooks.
- `listCampaigns` merges public discovery rows with the workspace's own rows, keyed by `marketplace:extId`, so a discovery campaign is visible to everyone while your mirror wins on collision.
- `listCampaigns({ joined: true })` is the production queue: own joined rows plus discovery campaigns this workspace has planned.
- `toggleJoined` refuses to patch a public discovery row; joining is a marketplace action, not a local flag.
- `CampaignDetail` hides the mark-joined control for discovery rows and states that joining happens on the marketplace.
- `DashboardLayout` shows the real data mode (`own session mirror` / `public discovery data` / `no source`) and warns when the Convex backend has never connected (`useConvexConnectionState`).
- Data pages use `useBackendReachable()` and render `BackendUnreachable` instead of an endless skeleton when no backend has answered, so an unreachable backend is never mistaken for an empty result.
- `/app/analytics` and `/app/earnings` only render own-session views; with public discovery data they show an explanatory empty state rather than Rp0 charts.
- Content Rewards normalizer maps cents to USD dollars and `$2 / 1K views` to `$2,000 / 1M views` for the shared campaign score.
- Content Rewards campaign IDs are prefixed as `content-rewards:<id>` to prevent collisions with Konten IDs.
- Snapshots are separated by source; the dashboard shows the most recently fetched source snapshot while campaign rows remain unified.
- Scanner and campaign detail render Content Rewards economics as USD, not IDR.
- Brief Autopilot does not invent CTA/caption copy when a discovery source omits it.
- Apify Actor execution and Whop account probing are authenticated Convex actions with bounded inputs and server-side credentials. They remain unreachable from the login-free console.

## Verification baseline

```bash
bun run convex codegen
bun tsc -b --noEmit
bun run typecheck:scripts
bun test
git diff --check
freebuff-preview status
```

`bun test` currently reports 36 passing tests across 3 files (ingest/scope policy, workspace key shape, plan limits, API key hashing and bearer parsing, swarm, connectors, operator runtime, Content Rewards normalization, provider config, organism policy, autonomy review, AutoShorts handoff, brief parser, social accounts). The API key suite includes a known-answer SHA-256 vector so the hash cannot silently drift.

Browser smoke covers `/`, `/auth`, and all ten console routes (now including `/app/platform`) at 1440px and 390px. Console routes need a reachable Convex backend on port 3210; without it they render the shell, the connection banner, and empty panels instead of data — that is a backend-availability condition, not a code failure, so never report those pages as verified when the backend is down.

## Documentation map

- `README.md` — current product, setup, routes, security, and operations.
- `PROJECT_CONTEXT.md` — architecture and canonical constraints.
- `PRD.md` — product requirements and acceptance criteria.
- `KONTEN_MAP.md` — verified Konten endpoint map and known changes.
- `research/RESEARCH.md` — live marketplace research and limitations.
- `research/AGENT_RESEARCH.md` — agent ecosystem research and adopted patterns.
- `research/HERMES_CANONICAL_CONTEXT.md` — long-term strategic context, not a task list.
- `PLATFORM.md` — SaaS/BaaS posture, what is enforced, and the explicit IaaS/billing gap.
- `CHANGELOG.md` — release history and current verification notes.

## Non-negotiable rules

1. Repository and runtime reality outrank stale notes.
2. Never commit cookies, API keys, raw account dumps, or private research artifacts.
3. Do not start a second Convex process in Freebuff; the platform owns it.
4. Do not add auto-submit, fake engagement, account takeover, or unattended spending.
5. Keep provider and connector actions bounded, auditable, and review-gated where consequential.
