# MEMORY — Super Clipper

**Last verified:** 25 September 2026
**Repository:** `mulkymalikuldhrs/Clipper-AI`
**Stack:** Vite + React 18 + TypeScript + Tailwind + shadcn-style primitives + Convex + Bun

## Current product state

- `/` is a public, product-first landing page.
- `/app/*` is a public exploration console; there is no account gate in the shipped UI.
- Marketplace data is source-backed. The console does not ship synthetic campaign or financial records.
- Konten.com account data is mirrored only by the operator's local Playwright bridge.
- Content Rewards Discover is a separate public, read-only JSON source with bounded pagination and detail requests.
- `/app/swarm` is a local-first multi-agent control room with role selection, shared transcript/memory, custom OpenAI-compatible provider settings, evaluation, browser heartbeat, and review-gated skill proposals.
- The operator runtime adds an explicit Bun CLI, an operator-run lock/state daemon, an official MCP stdio server with a read-only allowlist, and a built-in Playwright page inspection runner.
- Content Rewards daemon discovery is observe-only by default; optional normalized ingest requires `SC_DAEMON_SYNC=true` plus the existing ingest token boundary.
- Camofox remains an optional adapter contract only. No official upstream, stealth, anti-detection, CAPTCHA, Cloudflare, or anti-bot bypass is claimed.

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

- Content Rewards normalizer maps cents to USD dollars and `$2 / 1K views` to `$2,000 / 1M views` for the shared campaign score.
- Content Rewards campaign IDs are prefixed as `content-rewards:<id>` to prevent collisions with Konten IDs.
- Snapshots are separated by source; the dashboard shows the most recently fetched source snapshot while campaign rows remain unified.
- Scanner and campaign detail render Content Rewards economics as USD, not IDR.
- Brief Autopilot does not invent CTA/caption copy when a discovery source omits it.
- Apify Actor execution and Whop account probing are authenticated Convex actions with bounded inputs and server-side credentials.

## Verification baseline

```bash
bun run convex codegen
bun tsc -b --noEmit
bun run typecheck:scripts
bun test
git diff --check
freebuff-preview status
```

The current automated suite includes the original 24 tests plus focused operator-runtime tests. Browser smoke must still be interpreted with care when the managed Convex runtime is stale or unavailable.

## Documentation map

- `README.md` — current product, setup, routes, security, and operations.
- `PROJECT_CONTEXT.md` — architecture and canonical constraints.
- `PRD.md` — product requirements and acceptance criteria.
- `KONTEN_MAP.md` — verified Konten endpoint map and known changes.
- `research/RESEARCH.md` — live marketplace research and limitations.
- `research/AGENT_RESEARCH.md` — agent ecosystem research and adopted patterns.
- `research/HERMES_CANONICAL_CONTEXT.md` — long-term strategic context, not a task list.
- `CHANGELOG.md` — release history and current verification notes.

## Non-negotiable rules

1. Repository and runtime reality outrank stale notes.
2. Never commit cookies, API keys, raw account dumps, or private research artifacts.
3. Do not start a second Convex process in Freebuff; the platform owns it.
4. Do not add auto-submit, fake engagement, account takeover, or unattended spending.
5. Keep provider and connector actions bounded, auditable, and review-gated where consequential.
