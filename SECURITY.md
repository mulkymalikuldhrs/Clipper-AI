# Security Policy

## Scope

Clipper AI handles marketplace intelligence, local bridge credentials, Convex data, optional AI provider settings, and connector tokens. Treat all of these as security-sensitive.

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability or include secrets in a report.

Email the maintainer at `mulkymalikuldhr@agentmail.to` with:

- affected route or file;
- reproduction steps;
- impact and prerequisites;
- redacted logs or request IDs;
- whether any credential or personal data may be exposed.

Do not send API keys, cookies, bridge dumps, or raw account data. The maintainer will acknowledge reports within 48 hours when possible.

## Security boundaries

- There is no authentication UI. Each browser holds one random 32-hex workspace key in `localStorage`; Convex treats it as a bearer capability and resolves writes to that workspace only.
- The workspace key is not a secret store: it grants write access to that workspace's plans, tasks, and organism state. Never paste it into issues, chat, or screenshots, and clear site data to revoke it.
- Workspace API keys (`clai_...`) are minted and hashed in the browser; only a SHA-256 hash and a display prefix are stored. Treat the plaintext as a credential, and revoke a key from `/app/platform` the moment it may have leaked — revocation takes effect on the next request.
- Plan quotas are security-relevant: `apiRequestsPerDay` bounds how much work one workspace key can trigger, and exhausted quota returns 429 rather than degrading silently.
- Public reads are limited to records tagged `scope: "public"` (public discovery sources). Own-session bridge data (`scope: "private"`) is never returned to an anonymous caller, and public sync-log views are filtered to public sources.
- Workspace writes are bounded per workspace (80 plans, 60 organism goals) with strict key-shape validation so an unauthenticated console cannot grow tables without limit.
- `INGEST_TOKEN` protects `/ingest`.
- Bridge credentials and cookies remain on the operator's machine.
- `APIFY_TOKEN` and `WHOP_API_KEY` are server-side Convex environment variables.
- Browser AI API keys are session-only and are never sent to Convex.
- Content Rewards is public read-only discovery; no account credentials are used.
- Social publishing, payments, skill activation, and other consequential actions require review.
- No fake engagement, account takeover, unattended spend, or unrestricted agent code mutation is supported.

## Operator checklist

Before running a bridge or connector:

1. Use a dedicated local sync identity where possible, and treat the browser workspace key as a credential for the plans it owns.
2. Keep secrets in the platform Keys/API keys UI or local environment, never in Markdown or source files.
3. Confirm the target URL and Convex deployment.
4. Start with read-only operations.
5. Review sync logs and remove credentials from logs before sharing them.

## Operator runtime security

- The CLI and daemon are operator-run local processes. Freebuff does not start the daemon automatically.
- The daemon lock and state files are local operational metadata; do not commit them. They must not contain cookies, API keys, or raw account snapshots.
- `SC_DAEMON_SYNC=true` is the only switch that enables ingest. It sends a bounded, normalized public discovery snapshot to the existing `x-sc-token` protected endpoint; it does not use marketplace session cookies.
- The MCP server is stdio and read-only. Do not add arbitrary URL fetch, shell, filesystem, secret-return, payment, publishing, or account-control tools.
- The built-in browser runner is Playwright and only reads title/body text from the explicit allowlist. Do not add click/form/download automation or Camofox stealth/anti-bot bypass behavior.
- Camofox is an optional operator-owned adapter contract until an upstream and protocol are verified. A binary name or third-party repository is not proof of official status.
- If a local state file is shared for debugging, redact the file and verify it contains no environment values or personal data.

## Dependency and provider risk

Third-party APIs, models, Actors, and connectors can change behavior or data handling. Review their current terms, privacy policy, retention behavior, and security posture before enabling them. A provider integration is not an endorsement or guarantee.
