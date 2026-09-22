# RESEARCH — konten.com Live Automation (2026-09-22)

Metode: Playwright headless Chromium, login REAL (email/password → POST /api/auth/login,
redirect ke /clipper-dashboard). Crawl tuntas: **124 halaman** + **186 endpoint JSON**
(`research/konten-map.json`), lalu ekstraksi detail penuh **45 campaign**
(`research/konten-campaigns.json`), screenshot di `research/konten-snapshots/`.
Semua artefak mentah di-gitignore; hanya catatan ini yang di-commit.

Halaman yang tercakup: semua route clipper (dashboard, campaigns, analytics, earnings, tier,
wallet/withdraw, payment-methods/kyc, videos/submissions, affiliate, banding, leaderboard,
notifications, rules, settings, referral/invite, guide), 24 halaman detail campaign, setiap
sub-halaman `/brief`, blog (18 artikel), brands, contact, privacy, terms.
Crawl berhenti dengan 0 link internal tersisa (bukan karena batas budget).

## Temuan utama (fakta, dari trafik nyata)

### Arsitektur platform
- Next.js + Supabase (GoTrue `/auth/v1/user`), cookie session, Sentry.
- Semua data dashboard diambil via REST `/api/*` (bukan HTML) → scraping API-level stabil.
- localStorage prefix `klip:*` (brand "Klip"), ada mode demo-affiliate.

### Endpoint inti (semua GET 200 kecuali disebut)
| Endpoint | Isi |
|---|---|
| POST `/api/auth/login` | `{user:{id,email,name,role:"clipper",...}}` |
| GET `/api/feature-flags` | flags (tier_system, leaderboard, early_earning, banding2, affiliate_program, campaign_closure_v2...) + settings (min_withdrawal 50rb, fee 10rb, early_earning 50%, min_views_floor 50rb, hashtag_grace 168h) |
| GET `/api/campaigns?status=active&limit=6` | list campaign (id, slug, title, brand, category, platform[], cpm/rate_per_million, budget, spent, clippers, min_views, min_video_duration, hashtags, deadline) |
| GET `/api/campaigns/:slug` | detail penuh + `brief_detail` (cta, materi[{title,url}], narasi, caption, hashtags, durasiMin/Max, judulFile, elemenWajib, contohVideo) |
| GET `/api/campaigns/:slug/top-clips` | leaderboard klip: views, totalEarned, platform, status, clipperName |
| GET `/api/campaigns/:slug/recommended-clips` | klip referensi brand + payout, signed R2 URLs |
| GET `/api/campaigns/joined-details` | campaign yang diikuti |
| GET `/api/campaigns/participate` | `{campaignIds[]}` |
| GET `/api/campaigns/:id/closure` | status closure campaign (remainingPct, closesAt) |
| GET `/api/earnings/summary` | totalEarned, onHold, sedangDiproses, available, withdrawn, thisMonth, totalViews, viewsBerjalan, frozen |
| GET `/api/earnings` | baris earnings per video |
| GET `/api/clipper/views-timeseries?range=1M` | bucket {ts, views} harian |
| GET `/api/wallet`, `/api/wallet/transactions` | saldo, mutasi |
| GET `/api/db/withdrawals` | riwayat withdraw (PostgREST-style) |
| GET `/api/payment-methods`, `/api/kyc` | payout + KYC |
| GET `/api/tier` | tier Base Clipper dst (viewThreshold, maintenanceMinApproved) |
| GET `/api/affiliate/eligibility` | gate affiliate: tier ≥ 2 |
| GET `/api/clipper/banding-summary` | appeal video ditolak |
| GET `/api/tracked-videos?scope=self` | video tersubmit |
| GET `/api/notifications/unread-count` | notifikasi |

### Data contoh (campaign IBU — sesuai contoh user)
- cpm: TikTok 2000/Instagram 2000 per 1jt views; budget 190jt, spent 131,8jt (69%); ~11.988 clipper.
- top clip: 6.564.156 views → Rp3.200.000 (approved, Instagram Reel).
- brief_detail.materi: 8 item (Reaksi ARTIS, Nobar Yatim, Testimoni Artis, Referensi Style,
  Trailer Full, Trailer Artis, Materi Lengkap, Backsound Anggis).
- hashtags: #IBUBagaimanaAkuTanpamu #reaksinonton #perjuanganibu #ktnfcib3.
- do & don't resmi: **4 poin `bolehDilakukan`** + **5 poin `dilarangDilakukan`**
  (termasuk "Dilarang menggunakan ads ataupun bot" dan "Dilarang Mention akun Falcon").
- `targetAudiens`: Semua Umur; `tujuanCampaign`: Brand awareness.
- `/api/campaigns/:id/closure` kini **404** — sisa budget dihitung dari budget/spent.

## Kesimpulan fitur Super Clipper (terimplementasi)
1. **Konten Bridge** (Playwright sync nyata): login/cookies → tarik campaigns **beserta detail
   `brief_detail` per campaign** (wajib: hanya endpoint detail yang punya materi/narasi/do-don't),
   joined, earnings, timeseries → push ke app via `/ingest` (token). Cron-friendly, tanpa API resmi.
2. **Brief Autopilot**: parser `brief_detail` → rencana produksi terstruktur yang isinya berasal
   dari brief asli, bukan template: hook (dari sudut/narasi campaign), shotlist berskala durasi,
   poin narasi, CTA, caption + hashtag, daftar **BOLEH vs DILARANG**, target audiens, dan
   checklist tugas termasuk tugas "CEK LARANGAN". Skor kepatuhan dihitung dari kelengkapan brief.
3. **Campaign Scanner + Skor Layak**: budget terpakai, closure %, kompetisi (clippers vs top-clips), min_views → pilih campaign terbaik otomatis.
4. **Earnings & Wallet Real-time**: mirror `/earnings/summary`, timeseries, leaderboard, projected pendapatan per campaign.
5. **Compliance Guard**: berbasis flags (min_views_floor, hashtag grace, closure) + aturan do/don't dari brief → cegah klip nol-payout.
6. **Roadmap produksi video** (OpenMontage/HyperFrames style): template brief → shotlist HTML → render, afiliasi otomatis (repo Auto-Tiktok-Affiliate-AI tidak tersedia — 404; konsep diadopsi dari clipcycle).

## Keterbatasan / kejujuran
- Tidak ada API resmi publik; semua via sesi resmi milik user sendiri (compliance: gunakan akun sendiri, tanpa bot agresif — sesuai don't-list campaign).
- Submit video via upload web (flag submit_via_link=false) → otomasi submit penuh tidak di-MVP; fokus intel + rencana.
- Kontrak API bisa berubah tanpa pemberitahuan: pada crawl ini `?limit=` ditolak (HTTP 400) dan
  `/closure` hilang (404). Parser & bridge sengaja dibuat defensif dan tidak mengandalkan satu bentuk response.
- Field numerik kadang dikirim sebagai string (mis. `minimumFollowers: "0"`) — parser mengonversi.
- Jumlah campaign dan angka budget adalah snapshot 22 Sep 2026; jalankan ulang
  `scripts/crawl-campaigns.ts` untuk menyegarkan data demo.
