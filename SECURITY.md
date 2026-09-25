# Security Policy

## Scope

Super Clipper handles marketplace intelligence, local bridge credentials, Convex data, optional AI provider settings, and connector tokens. Treat all of these as security-sensitive.

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

- `INGEST_TOKEN` protects `/ingest`.
- Bridge credentials and cookies remain on the operator's machine.
- `APIFY_TOKEN` and `WHOP_API_KEY` are server-side Convex environment variables.
- Browser AI API keys are session-only and are never sent to Convex.
- Content Rewards is public read-only discovery; no account credentials are used.
- Social publishing, payments, skill activation, and other consequential actions require review.
- No fake engagement, account takeover, unattended spend, or unrestricted agent code mutation is supported.

## Operator checklist

Before running a bridge or connector:

1. Use a dedicated local sync identity where possible.
2. Keep secrets in the platform Keys/API keys UI or local environment, never in Markdown or source files.
3. Confirm the target URL and Convex deployment.
4. Start with read-only operations.
5. Review sync logs and remove credentials from logs before sharing them.

## Dependency and provider risk

Third-party APIs, models, Actors, and connectors can change behavior or data handling. Review their current terms, privacy policy, retention behavior, and security posture before enabling them. A provider integration is not an endorsement or guarantee.
