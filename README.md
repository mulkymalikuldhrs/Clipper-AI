<p align="center">
  <img src="public/sc-icon.svg" width="72" alt="Super Clipper" />
</p>

<h1 align="center">Super Clipper</h1>

<p align="center">
  <b>AI Autopilot untuk marketplace clipping konten.com</b><br/>
  Auto-fetch campaign → susun rencana produksi → join → pantau analitik & earnings real-time.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Stack-Vite_+_React_+_Convex-34d399?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Data-Field-tested_22_Sep_2026-22d3ee?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" />
</p>

---

## Apa ini?

**Super Clipper** adalah autopilot pribadi untuk clipper di [konten.com](https://konten.com):
ia menyelami dashboard clipper-mu (pakai sesi akunmu **sendiri**), lalu:

| Modul | Fungsi |
|---|---|
| 🛰️ **Konten Bridge** | Login (email/password **atau cookies**) → tarik campaign, earnings, timeseries, wallet, tier → push ke workspace. |
| 🎯 **Campaign Scanner** | Semua campaign aktif di-skor 0–100 (CPM 35% • sisa budget 30% • kompetisi 20% • syarat views 15%) dan diurutkan. |
| 🎬 **Brief Autopilot** | Brief campaign dipecah otomatis jadi: hook 3 detik, shotlist berskala durasi, narasi wajib, CTA, caption + hashtag siap tempel, **daftar BOLEH vs DILARANG asli dari brief**, target audiens, checklist kepatuhan, dan skor kepatuhan. |
| 📊 **Analitik** | Mirror `views-timeseries` harian + earnings per campaign + distribusi platform. |
| 💰 **Earnings** | Total earned, on-hold, siap-withdraw, dan cek kesiapan withdraw vs aturan platform (min Rp50.000, fee Rp10.000). |
| 🧪 **Demo Mode** | Satu klik mengisi workspace dengan **20 campaign asli + 114 materi** (dari 45 campaign yang di-crawl 22 Sep 2026). |

## Kenapa aman?

- Kredensial/cookies **hanya di mesinmu** (`.env.local`, di-gitignore) — bukan di cloud, bukan di repo.
- Bridge hanya **membaca** dashboard milikmu dan menulis ke workspace-mu.
- **Tanpa bot views/engagement** — justru melanggar aturan campaign.
- Submit video tetap lewat konten.com (flag platform `submit_via_link` = false); Super Clipper menyiapkan semuanya sampai siap submit.

## Arsitektur

```
┌──────────────────────┐   Playwright (login/cookies)   ┌──────────────────────┐
│  konten.com          │ ─────────────────────────────► │  scripts/bridge-sync │
│  /clipper-dashboard  │   baca: /api/campaigns,        │  (mesin lokalmu)     │
│  /clipper-earnings   │   + /api/campaigns/:slug       └──────────┬───────────┘
│  /clipper-campaigns  │   (brief_detail lengkap!),     │ POST /ingest
└──────────────────────┘   earnings, timeseries...     │ x-sc-token
                                                                   │ x-sc-token
                                                          ┌────────▼───────────┐
                                                          │  Convex backend    │
                                                          │  schema + scoring  │
                                                          │  brief autopilot   │
                                                          └────────┬───────────┘
                                                                   │ realtime
                                                          ┌────────▼───────────┐
                                                          │  Super Clipper UI  │
                                                          │  Vite + React      │
                                                          └────────────────────┘
```

## Quickstart

```bash
bun install
bun convex dev --once     # provision backend + generate types
bun run dev               # buka UI di port dev (Vite saja)
```

> Di Freebuff, platform sudah menjalankan proses Convex dev sendiri. Karena itu
> `scripts/dev.sh` **hanya** menjalankan Vite — jangan menambahkan `convex dev`
> di sana, karena backend lokal yang kedua akan merebut port 3210 dan membuat
> push fungsi/codegen platform gagal (UI jadi menampilkan kode lama).
> Untuk dev manual di luar Freebuff: terminal 1 `bun run convex:dev`, terminal 2 `bun run dev`.

Buat akun di halaman **/auth** → klik **Isi Data Demo** untuk melihat semua fitur dengan data nyata.

## Setup Bridge (opsional, untuk data akunmu sendiri)

1. Daftarkan token ingest:
   ```bash
   openssl rand -hex 24            # buat token
   bun convex env set INGEST_TOKEN <token>
   ```
2. Isi `.env.local` (file ini di-gitignore):
   ```
   SUPERCLIPPER_URL=<Convex HTTP actions URL>/ingest
   INGEST_TOKEN=<token di atas>
   KONTEN_EMAIL=kamu@email.com
   KONTEN_PASSWORD=********
   # atau tanpa password — pakai cookies sesi:
   KONTEN_COOKIES_JSON=[{...}]
   ```
3. Jalankan:
   ```bash
   bun scripts/bridge-sync.ts      # sekali, atau pasang di cron tiap 30 menit
   ```

## Hasil riset lapangan

Dokumen lengkap di [`research/RESEARCH.md`](research/RESEARCH.md) dan peta API di
[`KONTEN_MAP.md`](KONTEN_MAP.md) — hasil otomasi nyata: login sesi sendiri +
crawl **124 halaman** konten.com (semua route clipper, 24 halaman detail campaign,
setiap `/brief`, blog, brands, legal) dengan **186 endpoint JSON** terindeks.
Crawl dinyatakan tuntas: 0 link internal tersisa yang belum dikunjungi.

Contoh temuan yang jadi dasar fitur:

- **45 campaign** bisa dibaca lengkap dengan `brief_detail` (materi, narasi, CTA,
  elemen wajib, do & don't, target audiens, caption wajib, durasi).
- Campaign CPM bervariasi **Rp2.000–Rp5.000** per 1.000 views.
- Top clip campaign film nasional: **6,56 juta views → Rp3.200.000** (approved).
- `brief_detail.bolehDilakukan` / `dilarangDilakukan` = daftar do & don't resmi
  brand (contoh IBU: 4 boleh, 5 dilarang) — dipakai langsung oleh Brief Autopilot.
- Endpoint berubah antar waktu: `?limit=` sekarang ditolak (HTTP 400) dan
  `/api/campaigns/:id/closure` mengembalikan 404 → bridge dibuat toleran dan
  sisa budget dihitung dari `budget`/`spent`.

## Status verifikasi

Diperiksa langsung di sesi ini:

- `bun tsc -b --noEmit` bersih.
- `parseBrief()` diuji terhadap brief asli campaign IBU (8 materi, 4 poin BOLEH,
  5 poin DILARANG, shotlist berskala durasi 10–120 dtk, skor kepatuhan 100).

Belum terverifikasi secara live di environment ini: push fungsi Convex terakhir
tercatat 22:21, karena proses `convex dev` lama (dari `dev.sh` versi sebelumnya)
masih memegang port 3210 sehingga pengecekan/push otomatis platform gagal.
`dev.sh` sudah diperbaiki; restart sesi dev/workspace diperlukan supaya fungsi
terbaru benar-benar ter-deploy.

## Referensi konsep

- [OpenMontage](https://github.com/calesthio/OpenMontage) — pipeline produksi video agentic (roadmap: shotlist → render).
- [HyperFrames](https://github.com/heygen-com/hyperframes) — HTML → video untuk agents (roadmap: bumper ending otomatis).
- Clipcycle — service shorts hook-first (prinsip hook 3 detik dipakai di Brief Autopilot).

## Lisensi

MIT — lihat [LICENSE](./LICENSE).
