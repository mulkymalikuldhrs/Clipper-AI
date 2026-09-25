# KONTEN_MAP — Verified marketplace endpoint map

**Source crawl:** 22 September 2026
**Use:** Reference only. The bridge must remain defensive because private web APIs can change without notice.

## Session boundary

The Konten bridge uses an operator-owned browser session:

- login may use operator-provided credentials or cookies;
- cookies remain in the local bridge process;
- data is posted only to the app's token-protected ingest endpoint;
- Clipper AI does not scrape or store credentials in Convex.

Base URL: `https://konten.com`

## Endpoints currently consumed

| Endpoint | Purpose | Notes |
|---|---|---|
| `GET /api/me/profile` | Resolve workspace email | Falls back to configured bridge email or auth profile. |
| `GET /api/feature-flags` | Payout and campaign settings | Values are treated as snapshots, not guarantees. |
| `GET /api/campaigns?status=active` | Campaign list | Bridge tries known query shapes because private API parameters can change. |
| `GET /api/campaigns/:slug` | Full campaign and `brief_detail` | Required for production plans. |
| `GET /api/campaigns/joined-details` | Joined campaign mirror | Local following state is not authoritative. |
| `GET /api/campaigns/participate` | Joined IDs | Merged with joined detail. |
| `GET /api/earnings/summary` | Earnings totals | IDR values remain source currency. |
| `GET /api/earnings` | Per-video earnings rows | Bounded during ingest. |
| `GET /api/clipper/views-timeseries?range=1M` | Time series | Bounded snapshot data. |
| `GET /api/wallet` | Wallet summary | No withdrawal action is automated. |
| `GET /api/tier` | Account tier | Read-only. |
| `GET /api/notifications/unread-count` | Notification count | Optional display data. |

## `brief_detail` contract used by Autopilot

| Field | Use |
|---|---|
| `materi[]` | Source material links; entries without a valid URL are ignored. |
| `narasi` | Required story points. |
| `cta` | Official CTA. Empty values are not invented for Content Rewards discovery. |
| `caption` / `captionWajib` | Caption requirements. |
| `hashtags[]` | Required hashtags. |
| `durasiMin` / `durasiMax` | Duration window; numeric strings are accepted. |
| `elemenWajib` | Required production elements. |
| `bolehDilakukan[]` | Approved actions. |
| `dilarangDilakukan[]` | Prohibited actions. |
| `tujuanCampaign` / `targetAudiens` | Goal and audience context. |
| `instruksiBrief` / `judulFile` | Additional instructions. |

## Known historical changes

- Adding `limit` to the campaign list previously returned HTTP 400; the bridge tries multiple known shapes.
- `/api/campaigns/:id/closure` previously returned HTTP 404; remaining budget is calculated from `budget` and `spent`.
- Numeric values may be strings.
- The public landing page is not a stable data contract; prefer observed JSON responses.

## Safety

- Do not add join, submit, upload, withdrawal, or engagement automation.
- Do not treat the local joined toggle as marketplace state; bridge state is authoritative.
- Do not commit raw crawl artifacts, cookies, or account data.
- Keep all ingest collections and payload sizes bounded.
