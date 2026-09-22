# KONTEN_MAP.md — Peta API konten.com (hasil crawl nyata 2026-09-22)

Auth: `POST /api/auth/login {email,password}` → cookie session (Supabase GoTrue `/auth/v1/user`).
UA harus seperti browser; base `https://konten.com`. Semua data dashboard via REST `/api/*`.

Cakupan crawl: **124 halaman** (semua route clipper, 24 halaman detail campaign + sub-halaman
`/brief`, blog, brands, contact/privacy/terms) dan **186 endpoint JSON** terindeks. Crawl tuntas
(0 link internal tersisa). Data mentah + screenshot ada di `research/` (gitignored).

## Endpoint yang dipakai Super Clipper
- `GET /api/feature-flags` → flags + settings (min_withdrawal_idr, early_earning_rate_percent, min_views_floor, hashtag_grace_hours)
- `GET /api/campaigns?status=active` → daftar campaign (45 baris pada crawl terakhir)
- `GET /api/campaigns/:slug` → detail + **`brief_detail`** (lihat daftar field di bawah)
- `GET /api/campaigns/:slug/top-clips` → leaderboard klip (views, totalEarned, platform, status, videoUrl)
- `GET /api/campaigns/joined-details` → campaign yang diikuti
- `GET /api/campaigns/participate` → `{campaignIds[]}`
- `GET /api/earnings/summary` → totalEarned, onHold, available, thisMonth, totalViews, viewsBerjalan
- `GET /api/earnings` → baris earnings per video
- `GET /api/clipper/views-timeseries?range=1M` → bucket `{ts, views}`
- `GET /api/wallet`, `GET /api/wallet/transactions?limit=200` → saldo & mutasi
- `GET /api/db/withdrawals?select=...&order=requested_at.desc` → riwayat withdraw
- `GET /api/payment-methods`, `GET /api/kyc` → payout/KYC
- `GET /api/tier` → tier & syarat maintenance
- `GET /api/affiliate/eligibility` → gate affiliate (tier ≥ 2)
- `GET /api/clipper/banding-summary` → appeal
- `GET /api/tracked-videos?scope=self` → video tersubmit
- `GET /api/notifications/unread-count`

## `brief_detail` — bahan mentah rencana produksi
Field yang dipakai Brief Autopilot (semua terverifikasi ada di payload nyata):

| Field | Isi |
|---|---|
| `materi[]` | `{title, url}` — folder Google Drive / trailer / backsound (IBU: 8 item) |
| `narasi` | narasi wajib (diparse jadi poin-poin) |
| `cta` | CTA resmi akhir video (bisa kosong → ada fallback jujur) |
| `caption` / `captionWajib` | caption dari brand / arahan caption |
| `hashtags[]` | hashtag wajib (IBU: 4) |
| `durasiMin` / `durasiMax` | batas durasi (IBU: 10–120, dikirim sebagai string) |
| `elemenWajib` | daftar elemen wajib di video |
| `bolehDilakukan[]` | **do-list resmi** (IBU: 4 poin) |
| `dilarangDilakukan[]` | **don't-list resmi** (IBU: 5 poin, termasuk larangan bot/SARA) |
| `tujuanCampaign` | tujuan (mis. “Brand awareness”) |
| `targetAudiens` | target audiens (mis. “Semua Umur”) |
| `instruksiBrief`, `judulFile`, `tagSocialMedia`, `nicheAkunDisetujui`, `minimumFollowers` | pelengkap brief |

Catatan: beberapa field numerik dikirim sebagai **string** (mis. `minimumFollowers: "0"`),
jadi parser harus mengonversi, bukan mengasumsikan number.

## Pola penting
- List campaign: `campaigns[]` — field kunci: id, slug, title, brand, category, platform[],
  campaign_type (cpm), rate_per_million, cpm_tiktok/instagram/youtube, budget, spent, clippers,
  total_clips, min_views, min_video_duration, max_videos_per_clipper, hashtags, deadline, status,
  tier_access.
- Earnings summary dan wallet dipisah; withdraw: min Rp50.000 + fee Rp10.000 (dari settings).
- Leaderboard membuktikan payout nyata: 6,56jt views → Rp3.200.000 (approved).

## Perubahan API yang ditemukan (parser dibuat toleran)
- `GET /api/campaigns?status=active&limit=50` → **HTTP 400**. Pakai `?status=active` tanpa `limit`.
  (Bridge mencoba beberapa bentuk query lalu memakai yang berhasil.)
- `GET /api/campaigns/:id/closure` → **HTTP 404** untuk semua campaign. Karena itu sisa budget
  tidak lagi diambil dari endpoint ini, melainkan dihitung dari `budget`/`spent`.
- `/api/me/profile` dipakai bridge untuk menentukan email pemilik workspace.

## Script
- `scripts/konten-crawler.ts` — BFS crawl semua halaman + endpoint (resume via `.crawl-progress.json`,
  batas `CRAWL_BUDGET_MS` / `CRAWL_MAX_PAGES`).
- `scripts/crawl-campaigns.ts` — dump detail lengkap + top-clips untuk semua campaign → `research/konten-campaigns.json`.
- `scripts/gen-demo-data.ts` — ubah hasil crawl jadi `src/convex/demoData.ts` (data demo nyata).
- `scripts/bridge-sync.ts` — sinkronisasi akunmu sendiri (login/cookies) → POST `/ingest`.
