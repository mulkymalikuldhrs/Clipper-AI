# PROJECT_CONTEXT — Super Clipper

**Status:** Active product iteration
**Last verified:** 25 September 2026

## Objective

Super Clipper is a minimal operating console for marketplace clipping workflows. It discovers campaign opportunities, preserves source-backed briefs, turns briefs into reviewable production plans, tracks known economics, and coordinates bounded AI roles without taking irreversible external actions.

The product supports two marketplace intelligence paths:

1. **Konten bridge:** operator-owned account session mirrored from a local Playwright process.
2. **Content Rewards Discover:** public JSON discovery endpoint with no marketplace login or cookies.

## Stack

- Vite 6
- React 18 + React Router 7
- TypeScript
- Tailwind CSS + shadcn-style primitives
- Convex database/actions/queries
- Bun package manager and runtime
- Playwright for operator-owned bridge and smoke tooling

## Architecture

```text
Konten own-session bridge ─┐
                           ├─> bounded /ingest -> Convex cache -> reactive dashboard
Content Rewards public GET ┘

Browser custom model provider -> local Agent Swarm runtime
Convex env credentials         -> authenticated Apify / Whop actions
```

### Source model

- `kontenSnapshots` stores independent source snapshots.
- `kontenCampaigns` is the shared campaign cache.
- `extId` namespaces Content Rewards campaigns as `content-rewards:<id>`.
- `marketplace` controls currency and source presentation.
- Konten economics remain IDR; Content Rewards economics are displayed as USD without silent FX conversion.

### Agent model

The browser-first swarm runtime has explicit roles:

- Coordinator
- Researcher
- Producer
- Reviewer
- Memory
- Connector

A run is bounded to four model calls. Roles share a capped transcript and recent memory. Evaluation is deterministic and separate from generation. Self-improvement currently produces a skill proposal only; activation requires human approval.

## Connector model

Connector definitions declare capabilities (`read`, `write`, `scrape`, `schedule`, `consequential`) and required secret names.

- Apify: server-side Actor execution with `APIFY_TOKEN`.
- Whop: authenticated server-side account probe with `WHOP_API_KEY`; payment/payout operations are not automated.
- Content Rewards: public read-only discovery.
- OpenAI-compatible model: browser provider configuration with session-only API key.
- Generic webhook: planned plugin contract with signing, replay protection, allowlists, and bounded payloads.

## Product boundaries

- Public UI is explorable, but data is not fabricated.
- Convex user ownership checks remain on protected data and provider actions.
- The UI does not expose provider secrets.
- No shell, filesystem mutation, browser takeover, account takeover, fake engagement, unattended spend, auto-submit, or auto-publish.
- Skills, consequential connector actions, and social handoffs require review.
- Browser heartbeat is not a durable scheduler.

## Canonical files

- `README.md` — setup, routes, and operations.
- `MEMORY.md` — current verified state and constraints.
- `PRD.md` — product requirements and acceptance criteria.
- `KONTEN_MAP.md` — verified Konten API map.
- `research/RESEARCH.md` — live marketplace findings.
- `research/AGENT_RESEARCH.md` — multi-agent research synthesis.
- `research/HERMES_CANONICAL_CONTEXT.md` — long-term strategic context.

## Verification

```bash
bun run convex codegen
bun tsc -b --noEmit
bun run typecheck:scripts
bun test
git diff --check
```
