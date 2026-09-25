# RESEARCH — Marketplace automation

**Last reviewed:** 25 September 2026
**Method:** historical operator-owned Konten crawl plus public Content Rewards JSON inspection.
**Policy:** store conclusions and contracts, never cookies, raw account dumps, or private API responses.

## Sources

### Konten

Historical crawl on 22 September 2026 covered 124 pages and 186 JSON endpoints from an operator-owned session. The important finding is architectural: dashboard state is exposed through REST `/api/*` endpoints, while campaign list responses do not contain the complete production brief. The local bridge therefore fetches campaign detail separately.

Known historical endpoints include:

- `/api/me/profile`
- `/api/feature-flags`
- `/api/campaigns?status=active`
- `/api/campaigns/:slug`
- `/api/campaigns/joined-details`
- `/api/campaigns/participate`
- `/api/earnings/summary`
- `/api/earnings`
- `/api/clipper/views-timeseries?range=1M`
- `/api/wallet`
- `/api/tier`
- `/api/notifications/unread-count`

Known changes: a `limit` parameter once caused HTTP 400, and `/closure` once returned HTTP 404. The bridge is intentionally defensive and calculates remaining budget from `budget` and `spent` when closure data is absent.

### Content Rewards Discover

The public page is `https://contentrewards.com/discover`. Client-rendered HTML is not a stable data contract, but the following public JSON endpoints were observed to work without login:

```text
GET https://contentrewards.com/api/campaign/campaigns/discover?limit=6&sortBy=newest
GET https://contentrewards.com/api/campaign/campaigns/discover/:campaignId
```

Observed list fields include:

- `id`, `name`, `description`, `organizationName`, `banner`;
- `categories`, `platforms`, `status`, `requiresApplication`;
- `budgetCents`, `primaryPayoutCents`, `payouts[]`;
- `metrics.creatorCount`, `metrics.approvedSubmissionCount`, `metrics.budgetSpentCents`;
- reference materials and chart/payout metadata.

Detail responses add `contentRequirements.items` and fuller payout/material data.

Normalization decisions:

- `id` becomes `content-rewards:<id>` to avoid collisions;
- `name` becomes title and the source ID becomes slug;
- cents become USD dollars;
- `primaryPayoutCents * 10` becomes normalized dollars per million views for the shared score;
- `budgetCents / 100` becomes budget;
- `metrics.budgetSpentCents / 100` becomes spent;
- `metrics.creatorCount` becomes clippers;
- relative assets resolve to HTTPS `contentrewards.com` URLs;
- requirements become brief instruction/element data without inventing CTA or caption;
- discovery is not treated as joined state or earnings.

## Product conclusion

Super Clipper should ingest public marketplace intelligence, preserve provenance, and produce a reviewable plan. It should not join, submit, publish, scrape credentials, or create engagement. A source becoming unavailable is a normal empty/stale state, not a reason to invent data.

## Research limitations

- Private marketplace APIs can change shape or rate-limit requests.
- Public endpoints can be added, changed, or removed without notice.
- Historical crawl counts are not current inventory.
- Content Rewards payout semantics should be rechecked when the provider changes its UI or API.
- A GitHub README is a design claim, not a security audit.
