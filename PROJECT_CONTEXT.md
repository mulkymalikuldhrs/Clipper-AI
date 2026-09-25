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

### Workspace model

There is no sign-in flow. `src/lib/useWorkspace.ts` mints one random 32-hex key per browser and stores it in
`localStorage`; the console passes it as `workspaceKey` to every query and mutation that can write.

`src/convex/workspace.ts` resolves the acting identity in this order:

1. a signed-in Convex Auth user, if the deployment ever provides one;
2. an anonymous operator workspace looked up by key (`operatorWorkspaces`);
3. no workspace — read-only public discovery access.

Mutations create the workspace on first use as a non-auth `users` row, the same pattern `ensureBridgeUser` uses.
Writes are bounded per workspace (80 plans, 60 goals) in `src/convex/lib/workspace.ts`.

### Source model

- `kontenSnapshots` stores independent source snapshots, each tagged `scope` (`private` for own-session bridge, `public` for public discovery).
- `kontenCampaigns` is the shared campaign cache with the same `scope` tag.
- Queries merge public discovery rows with the caller's own rows (`marketplace:extId` key), so anonymous consoles see discovery data and never another operator's bridge mirror.
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
- Owner scoping is enforced on every write: a workspace can only patch records it owns, and public discovery rows are never patched in place.
- A workspace key is a bearer capability stored in `localStorage`; losing it loses access to that workspace's plans and organism state, and rotating it is the only reset.
- The UI does not expose provider secrets.
- No shell, filesystem mutation, browser takeover, account takeover, fake engagement, unattended spend, auto-submit, or auto-publish.
- Skills, consequential connector actions, and social handoffs require review.
- Browser heartbeat is not a durable scheduler.

## Operator runtime

The durable operator surface is deliberately local and bounded:

- `scripts/sc-cli.ts` is the operator CLI for status, catalogs, daemon state, and browser policy.
- `scripts/sc-daemon.ts` is never started by the preview. It uses a lock file, state file, bounded interval, graceful signals, and observe-only public discovery by default. `SC_DAEMON_SYNC=true` only enables normalized Content Rewards ingest through the existing protected route.
- `scripts/sc-mcp.ts` uses the official `@modelcontextprotocol/sdk` over stdio and registers only read-only tools. It cannot execute shell commands, read arbitrary files, browse arbitrary URLs, or perform marketplace writes.
- `scripts/sc-browser.ts` uses the existing Playwright dependency for title/body inspection on an origin/path allowlist. The optional Camofox adapter is a contract only; no stealth, anti-detection, or anti-bot bypass is implemented or implied.
- Shared contracts and redaction live in `src/lib/operatorRuntime.ts` and are covered by tests.

The daemon is autonomous only over the safe jobs explicitly described here. A failed source, missing evidence, or absent credential results in an observed state or `do_nothing`, never an invented success.

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
