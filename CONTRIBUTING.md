# Contributing to Super Clipper

Thanks for helping improve Super Clipper. Contributions should be small, reviewable, source-aware, and safe by default.

## Setup

```bash
bun install
bun convex dev --once
bun run dev
```

The Vite app is the frontend. Convex is the only backend/database. In Freebuff, the platform manages Convex; do not start a second Convex process from `scripts/dev.sh`.

## Before you change code

- Read `README.md`, `PROJECT_CONTEXT.md`, and `SECURITY.md`.
- Inspect the current source instead of trusting old research notes.
- Keep credentials, cookies, crawl dumps, and private artifacts out of git.
- Do not add auto-join, auto-submit, auto-publish, fake engagement, account takeover, or unattended spend.

## Useful commands

```bash
bun run convex codegen
bun tsc -b --noEmit
bun run typecheck:scripts
bun test
git diff --check
```

Add focused tests for pure helpers, normalizers, safety policy, and connector metadata. Do not use production credentials in tests.

## Code conventions

- Follow existing TypeScript, React, Tailwind, and Convex patterns.
- Prefer editing existing files over creating parallel abstractions.
- Keep UI changes consistent with the minimal console language: neutral surfaces, one accent, hairlines, no decorative glow/gradient/shadow.
- Keep server secrets in Convex actions using environment variables.
- Keep browser API keys in `sessionStorage`; never persist them in `localStorage` or Convex.
- Make external requests bounded, cancellable, and defensive against changing payloads.
- Mark consequential operations `review_required` and provide an audit/rejection path.

## Pull requests

1. Create a focused branch.
2. Update relevant Markdown documentation when behavior or setup changes.
3. Add or update tests.
4. Run all verification commands above.
5. Review the diff for secrets, generated files, stale claims, and unintended unrelated changes.
6. Explain user-visible impact and known limitations in the PR.

## Research contributions

Research notes must distinguish observed facts, hypotheses, and recommendations. Link the source repository or official documentation and record license/security caveats. Never commit raw private crawl data.
