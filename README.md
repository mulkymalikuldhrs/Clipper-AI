<p align="center">
  <img src="public/clipper-ai-icon.svg" width="72" alt="Clipper AI" />
</p>

<h1 align="center">Clipper AI</h1>

<p align="center">
  <b>Control plane untuk marketplace clipping</b><br/>
  Discovery publik → rencana produksi yang bisa ditinjau → agent swarm → API baca berkuota.<br/>
  Tanpa akun. Tanpa data karangan.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Stack-Vite_+_React_+_Convex-c6f24e?style=for-the-badge" />
  <img src="https://img.shields.io/badge/UI-Operations_Console-e8b23c?style=for-the-badge" />
  <img src="https://img.shields.io/badge/API-v1_read__only-c6f24e?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" />
</p>

---

## Apa ini?

**Clipper AI** adalah control plane untuk workflow clipping marketplace. Ia membaca peluang campaign dari sumber nyata, menyimpan brief apa adanya, mengubah brief menjadi rencana produksi yang bisa ditinjau, mengoordinasikan peran agent, dan menyediakan API baca berkuota untuk automation. Landing `/` dan console `/app` bisa dijelajahi tanpa login atau pendaftaran.

Bridge lokal membaca dashboard clipper dari sesi akun milikmu sendiri, menormalkan campaign, brief, earnings, dan timeseries ke workspace Convex. Content Rewards ditambahkan sebagai sumber Discover publik dan read-only. Video tetap dikirim dan disetujui melalui marketplace asal; Clipper AI menyiapkan keputusan dan materi produksi, bukan mengirim, mengambil alih akun, atau memalsukan engagement.

### Yang benar-benar berjalan sekarang

| Kapabilitas | Status | Bukti |
|---|---|---|
| Discovery publik Content Rewards | Berjalan | `scripts/content-rewards-sync.ts`, scope `public` |
| Mirror sesi Konten milik operator | Berjalan (butuh sesi kamu) | `scripts/bridge-sync.ts`, scope `private` |
| Rencana produksi dari brief | Berjalan | parser deterministik `src/convex/lib/konten.ts` |
| Agent swarm | Berjalan, butuh API key kamu | runtime browser `src/lib/agentSwarm.ts` |
| Workspace API v1 (read-only) | Berjalan | `src/convex/apiHttp.ts`, bearer key + kuota |
| Usage meter + plan quota | Berjalan | `src/convex/platform.ts` |
| Billing / invoice | **Belum ada** | tidak ada payment provider terpasang |
| Posting / submit otomatis | **Tidak dilakukan** | tetap aksi manusia di marketplace

## Tanpa akun: satu workspace key lokal

Tidak ada form login, pendaftaran, atau sesi akun di produk ini. Sebagai gantinya, setiap browser membuat satu **workspace key** acak 32 karakter hex di `localStorage` dan itulah identitas yang memiliki rencana produksi serta state organism yang kamu buat. Konsekuensinya, jujur dan bisa diprediksi:

- Membuka `/app/*` langsung bekerja; tombol rencana, task, dan organism menyimpan ke workspace browser ini.
- Menghapus data situs atau memakai browser/perangkat lain berarti workspace baru; state lama tidak ikut pindah dan tidak bisa dipulihkan dari UI.
- Isi key adalah capability. Siapa pun yang memiliki key itu dapat menulis ke workspace tersebut, jadi jangan tempelkan key ke issue, chat, atau screenshot.
- Route `/auth` tidak lagi punya form; ia hanya redirect ke landing page.
- Data bridge milik operator (`source: bridge`) ber-scope `private` dan **tidak** dibaca oleh console publik. Yang tampil tanpa akun hanyalah discovery publik (`content_rewards`, scope `public`); log sync yang ditampilkan juga difilter ke sumber publik.
- `/app/swarm` menggunakan provider OpenAI-compatible secara lokal; API key hanya di sessionStorage browser.

Batasan per workspace mengikuti plan (`free` / `studio` / `agency`) dan benar-benar ditegakkan di mutation: 25 / 200 / 1.000 rencana, 15 / 120 / 500 goal, dan kuota API harian 200 / 5.000 / 50.000. Lihat `src/lib/plans.ts` dan `src/convex/platform.ts`.

| Modul | Fungsi |
|---|---|
| **Landing** | Preview publik tanpa akun: command center, operating loop, campaign specs, dan trust boundary. |
| **Console** | Console `/app` terbuka tanpa autentikasi; identitas ditentukan workspace key lokal di browser. |
| **Konten Bridge** | Sync read-only memakai sesi marketplace milikmu sendiri: campaign, brief detail, joined, earnings, wallet, tier, dan timeseries. |
| **Content Rewards Discover** | Sync read-only dari endpoint JSON publik Discover: campaign, brief detail, budget, payout, dan materi. Tidak memakai cookie, join, submit, atau engagement. |
| **Campaign Scanner** | Cache campaign aktif dengan skor 0–100, filter, pencarian, dan sorting keyboard-friendly. |
| **Brief Autopilot** | Mengubah `brief_detail` menjadi hook, shotlist, narasi, CTA, caption, hashtag, aturan boleh/dilarang, dan checklist tugas. |
| **Campaign Detail** | Menampilkan ekonomi campaign, brief, materi, aturan kepatuhan, dan tombol membuat rencana. |
| **Analytics** | Mirror timeseries views, earnings per campaign, dan distribusi platform. |
| **Earnings** | Ringkasan total earned, on-hold, siap withdraw, nilai baris, dan status syarat payout. |
| **Data policy** | Tidak ada data sintetis di console; semua snapshot berasal dari bridge atau sumber publik. |
| **Organism Kernel** | Bounded control plane untuk constitution, dynamic goals, capability registry, memory, experiments, dan pause/review controls. |
| **AutoShorts Handoff** | Menghasilkan manifest kandidat klip 9:16 dari plan campaign: hook, core proof, CTA, source material, dan guardrails. |
| **Autonomy Queue** | Menentukan lifecycle campaign, data readiness, economic signal, dan handoff publish yang selalu membutuhkan review. |
| **Agent Swarm** | Role-based multi-agent control room: coordinator, researcher, producer, reviewer, memory, dan connector; shared transcript, memory, evaluation, serta skill proposal yang perlu disetujui. |
| **Connector Catalog** | Kontrak provider untuk Apify, Whop, Content Rewards, OpenAI-compatible model, dan webhook plugin dengan capability serta secret boundary eksplisit. |
| **Platform** | `/app/platform`: identitas workspace, plan, kuota yang ditegakkan, usage meter, API key (hash SHA-256), dan quickstart HTTP API. |
| **Workspace API v1** | `GET /api/v1/workspace`, `/campaigns`, `/plans` dengan bearer key, scope read-only, dan kuota harian plan. |

Versi saat ini memakai parser brief deterministik untuk keputusan produksi dan runtime swarm opsional untuk eksperimen AI. Istilah “AI Autopilot” di sini menggambarkan hasil kerja dan alur produk, bukan klaim bahwa semua keputusan saat ini dihasilkan oleh LLM.

## Prinsip produk

- **Data milikmu:** credential dan cookies hanya ada di mesin yang menjalankan bridge.
- **Read-only untuk akun marketplace:** Clipper AI tidak memakai bot views atau engagement.
- **Brief adalah sumber kebenaran:** aturan campaign, CTA, durasi, caption, dan larangan berasal dari payload marketplace.
- **Human-in-the-loop:** clipper tetap mengambil footage, mengedit, memverifikasi, memposting, dan mengirim video.
- **Console, bukan dekorasi:** UI memakai garis rambut, whitespace, tabel padat, angka tabular, dan warna hanya untuk status atau skor.
- **AI keys stay local:** custom provider config disimpan non-secret di browser; API key tidak masuk source, Convex, atau repository.

## Arsitektur

```text
┌──────────────────────┐   Playwright, session/cookies milikmu   ┌──────────────────────┐
│  konten.com          │ ──────────────────────────────────────► │  Bridge lokal        │
│  clipper dashboard   │   campaign, brief, earnings, timeseries │  scripts/*.ts        │
│  campaign detail     │                                         └──────────┬───────────┘
└──────────────────────┘                                                    │ POST /ingest
                                                                            │ x-sc-token
                                                                   ┌────────▼───────────┐
                                                                   │ Convex workspace   │
                                                                   │ auth + cache +     │
                                                                   │ snapshots + plans  │
                                                                   └────────┬───────────┘
                                                                            │ reactive queries
                                                                   ┌────────▼───────────┐
                                                                   │ Clipper AI UI      │
                                                                   │ Vite + React       │
                                                                   └────────────────────┘
```

### Komponen penting

- `src/convex/`: schema, auth, ingest HTTP, query, campaign mutations, dan generator plan.
- `src/convex/lib/konten.ts`: normalisasi payload, scoring campaign, dan parser brief.
- `src/convex/lib/contentRewards.ts`: normalisasi read-only JSON Discover Content Rewards ke cache campaign bersama.
- `src/lib/agentSwarm.ts`: runtime swarm browser-safe untuk role selection, provider OpenAI-compatible, shared memory, evaluation, dan skill proposal.
- `src/lib/connectors.ts`: catalog connector provider-neutral untuk Apify, Whop, Content Rewards, model, dan webhook.
- `src/convex/connectors.ts`: action server-side untuk Apify Actor dan Whop probe; token hanya dari Convex environment.
- `scripts/content-rewards-sync.ts`: sync bounded public Discover (maks. 60 campaign, tanpa cookies atau akun marketplace).
- `src/lib/autoshorts.ts`: clean-room manifest kandidat klip 9:16 untuk handoff ke renderer lokal.
- `src/pages/dashboard/`: shell console dan route produk.
- `src/components/shared.tsx`: primitif UI bersama (`Panel`, `TableShell`, `Status`, `Meter`, `Score`, dan lainnya).
- `scripts/bridge-sync.ts`: runner bridge lokal untuk session/cookies konten.com.
- `scripts/content-rewards-sync.ts`: runner read-only untuk endpoint publik Content Rewards Discover.
- `scripts/smoke-dashboard.ts`: smoke test browser lintas route desktop/mobile.
- `src/lib/operatorRuntime.ts`: shared daemon/MCP/browser contracts, redaction, and allowlists.
- `scripts/sc-cli.ts`: operator CLI untuk status, catalog, dan policy checks.
- `scripts/sc-daemon.ts`: daemon lokal dengan lock/state, interval, dan observe-only default.
- `scripts/sc-mcp.ts`: official MCP stdio server dengan read-only tool allowlist.
- `scripts/sc-browser.ts`: Playwright read-only page inspection untuk URL yang di-allowlist.
- `research/AGENT_RESEARCH.md`: riset kedua untuk OpenShorts, agent runtime, self-evolution, dan safety patterns.
- `research/HERMES_CANONICAL_CONTEXT.md`: canonical strategic context untuk autonomous organization / venture organism.

## Quickstart

```bash
bun install
bun convex dev --once       # provision backend + generate types
bun run dev                 # Vite saja
```

UI console sengaja dibuat minimal: satu aksen lime, neutral charcoal, hairline border, dan tipografi denser. Tidak ada gradient, glow, shadow, atau dekorasi yang bersaing dengan data.

Buka `http://localhost:5174` (atau port yang diinjeksikan platform), lalu jelajahi landing dan console tanpa membuat akun. Untuk melihat data, jalankan bridge lokal dengan sesi marketplace milikmu sendiri; console hanya menampilkan snapshot sumber nyata.

### Content Rewards Discover (read-only)

Discover tidak membutuhkan login. Sync memakai endpoint JSON publik yang sama dengan halaman `https://contentrewards.com/discover`, mengambil daftar dan detail secara terbatas, lalu mengimpannya sebagai campaign automation. Nilai ekonomi Content Rewards ditampilkan dalam USD; tidak ada konversi diam-diam ke IDR.

```bash
# Isi key non-secret ini di environment/Keys API keys
CONTENT_REWARDS_SYNC_EMAIL=kamu@email.com
CLIPPER_AI_URL=<Convex HTTP actions URL>/ingest
INGEST_TOKEN=<token ingest lokal>

bun run bridge:content-rewards
```

Sync ini tidak membaca atau menyimpan cookie Content Rewards, tidak melakukan join campaign, tidak mengirim video, dan tidak membuat engagement. Biaya API tidak ada; tetap patuhi rate limit dan ketentuan marketplace.

Untuk pengembangan di luar Freebuff, jalankan dua terminal secara terpisah:

```bash
# terminal 1 — backend
bun run convex:dev

# terminal 2 — frontend
bun run dev
```

Di Freebuff, platform sudah mengelola proses Convex. Jangan menambahkan proses `convex dev` kedua ke `scripts/dev.sh` karena keduanya akan merebut port 3210.

## Routes

| Route | Akses | Isi |
|---|---|---|
| `/` | Publik | Product entry and execution boundary, fully explorable tanpa akun. |
| `/auth` | Redirect | Tidak ada form auth lagi; redirect ke `/`. |
| `/app` | Publik + workspace | Ringkasan campaign, earnings, sync, dan aktivitas. |
| `/app/scanner` | Publik + workspace | Daftar campaign discovery + mirror milikmu, skor, filter, sorting. |
| `/app/autopilot` | Publik + workspace | Plan produksi untuk campaign yang sudah kamu susun rencananya. |
| `/app/campaign/:id` | Publik + workspace | Detail ekonomi dan brief campaign; aksi hanya aktif pada baris yang boleh kamu tulis. |
| `/app/analytics` | Publik + workspace | Timeseries dan performa dari sumber yang tersambung. |
| `/app/earnings` | Workspace | Earnings dan payout readiness; hanya dari mirror bridge milikmu. |
| `/app/bridge` | Publik | Konfigurasi dan status sinkronisasi. |
| `/app/organism` | Workspace | Bounded organism kernel, goals, capabilities, memory, dan experiment ledger. |
| `/app/swarm` | Publik | Agent control room: role swarm, provider custom, transcript, memory, evaluation, dan skill review. |
| `/app/accounts` | Publik | Konfigurasi metadata akun TikTok/Instagram dan status OAuth resmi. |
| `/app/platform` | Workspace | Plan, kuota, usage meter, API key, dan quickstart HTTP API. |

### Workspace HTTP API v1

API ini read-only dan memakai bearer key dari halaman Platform. Plaintext key dibuat dan di-hash di browser; server hanya menyimpan hash SHA-256, jadi isi database tidak pernah berisi key yang bisa dipakai.

```bash
curl -s "$CLIPPER_AI_API/workspace" -H "Authorization: Bearer clai_..."
curl -s "$CLIPPER_AI_API/campaigns?limit=25" -H "Authorization: Bearer clai_..."
curl -s "$CLIPPER_AI_API/plans?limit=25" -H "Authorization: Bearer clai_..."
```

- Scope saat ini hanya `read`; tidak ada endpoint yang memposting, men-submit, atau membelanjakan.
- Setiap request dicatat sebagai `api.request` dan dihitung ke kuota harian plan; kuota habis menghasilkan `429`.
- Key yang dicabut langsung ditolak dengan `401`. `lastUsedAt` diperbarui saat key dipakai.
- Respons menyertakan `apiVersion` agar automation bisa menolak versi yang tidak dikenal.

## Agent Swarm dan connectors

`/app/swarm` adalah runtime browser-first untuk eksperimen AI. User memilih maksimal empat role per run, lalu coordinator/producer/researcher/reviewer menjalankan model OpenAI-compatible dengan shared transcript dan memory. Base URL/model non-secret disimpan di `localStorage`; API key hanya di `sessionStorage` dan tidak pernah dikirim ke Convex.

`Test API` di halaman Agent Swarm benar-benar memanggil endpoint `${baseUrl}/models` untuk provider OpenAI-compatible. `Test API` Content Rewards memanggil public Discover JSON endpoint secara langsung dari browser; kegagalan CORS atau status HTTP ditampilkan apa adanya.

Tidak ada simulation lane, generated campaign, mock earning, atau demo workspace di UI. Role agent hanya berjalan setelah goal dan provider nyata tersedia.

Provider server-side memakai Convex actions dan environment variables:

```text
APIFY_TOKEN=<Apify API token>
WHOP_API_KEY=<Whop API key>
```

Apify dapat menjalankan Actor setelah workspace terautentikasi. Whop probe hanya membaca account/users endpoint; payment, payout, webhook, dan app-management harus melalui review-gated flow. Catalog plugin saat ini tidak berarti arbitrary endpoint diizinkan: `content_rewards` tetap read-only, `webhook` masih planned, dan capability `consequential` selalu memerlukan approval manusia.

### Research translation

Pola yang diadopsi secara sengaja dari repo yang diteliti: identity/body separation dan reviewable evolution dari **Enoch**; role teams, shared memory, conflict boundaries, durable approvals, dan verifiable run records dari **Open Multi-Agent**; persistent sessions, bounded autonomy, dan refine/skills lifecycle dari **Prime Agent**; explicit roles plus consensus memory dari **Auto-Company**; memory/context/skill routing dari **LifeOS**; dan local-first clip pipeline + MCP/API boundary dari **OpenShorts** dan **AutoShorts**.

Self-improvement saat ini berarti **skill proposal**, bukan unrestricted code mutation. Agent dapat mengusulkan skill dari evidence, tetapi skill tetap `review_required` sampai user menyetujuinya. Browser cron hanya berjalan saat tab terbuka; durable operator daemon harus dijalankan eksplisit oleh operator dan tetap hanya menjalankan job read-only yang diizinkan.

## Setup Bridge (opsional)

Bridge memerlukan sesi marketplace milikmu. Jangan memasukkan credential ke repo, commit, atau payload UI.

1. Buat token ingest:
   ```bash
   openssl rand -hex 24
   bun convex env set INGEST_TOKEN <token>
   ```
2. Isi variabel berikut melalui `.env.local` di mesinmu atau Settings Environment Freebuff:
   ```text
   CLIPPER_AI_URL=<Convex HTTP action URL>/ingest
   INGEST_TOKEN=<token dari langkah 1>
   KONTEN_EMAIL=email_kamu
   KONTEN_PASSWORD=password_kamu

   # Alternatif tanpa password:
   KONTEN_COOKIES_JSON=[...]
   ```
3. Jalankan bridge dari mesin yang memiliki sesi/credential:
   ```bash
   bun scripts/bridge-sync.ts
   ```

`CLIPPER_AI_URL` (nama lama `SUPERCLIPPER_URL` masih dibaca) dan token harus diberikan ke proses Convex melalui konfigurasi environment. Jangan membuat file env baru di repository ini.

## Social accounts dan publishing

Halaman `/app/accounts` menyimpan metadata akun TikTok dan Instagram di browser. Access token tidak
disimpan di localStorage, sessionStorage, source code, atau payload UI.

Autonomy dapat menyiapkan queue, manifest, caption, dan checklist secara otomatis, tetapi publish
menunggu `review_required` sampai tersedia OAuth resmi, media valid, dan policy platform. Integrasi
publisher harus memakai API resmi TikTok Content Posting API dan Instagram Graph API, dengan
server-side token exchange, audit log, rate limit, retry policy, dan rollback. Credential scraping,
account takeover, fake engagement, dan upload dari browser tidak diizinkan.

## Konfigurasi provider lokal (opsional)

Halaman **Agent Swarm** menyediakan `Base URL`, `Model`, dan `API key` untuk adapter OpenAI-compatible. `Base URL` dan model disimpan di `localStorage`; API key hanya di `sessionStorage` dan boleh dikosongkan untuk Ollama atau model lokal lain. Provider dipanggil langsung dari browser, sehingga CORS dan kebijakan endpoint tetap menjadi responsibility provider. Convex tidak menerima API key browser.

Adapter provider eksternal harus tetap mendapat opt-in, quota, retention, cost limit, dan
review keamanan sebelum diaktifkan.

## Autonomy dan social handoff

`/app/organism` sekarang menghitung antrean keputusan deterministik dari campaign, plan,
brief, dan earnings yang sudah tersinkron. Setiap campaign memperoleh lifecycle (`observe`, `planned`,
`ready_for_review`, `earning`, atau `needs_attention`), alasan keputusan, readiness data, dan
economic signal. Jika plan lengkap, sistem membuat handoff|caption/manifest untuk TikTok atau
Instagram dengan status `review_required`.

Tidak ada auto-posting, account takeover, credential rotation, fake engagement, atau scraping
terhadap API yang tidak diizinkan. Publisher eksternal harus memakai OAuth/API resmi, approval
operator, rate limit, audit log, dan rollback.

## AutoShorts handoff

Clipper AI mengadopsi **pola** AutoShorts untuk menyiapkan kandidat klip dari sumber
long-form, tetapi tidak menyalin kode Tauri/Rust upstream atau menjalankan desktop renderer
di dalam web console. Plan campaign dapat menyalin manifest JSON dengan tiga kandidat
9:16: hook, core proof, dan CTA. Manifest adalah specification yang dapat diimpor ke
pipeline lokal AutoShorts atau renderer lain setelah operator memeriksa transcript,
caption, hak musik, footage, dan aturan campaign.

Manifest tidak menjalankan ffmpeg, model provider, media upload, auto-submit, atau auto-publish.
Bagian itu tetap menjadi langkah lokal yang eksplisit dan dapat ditinjau.

## Data dan provenance

Riset lapangan yang menjadi fondasi fitur tersimpan di `research/RESEARCH.md` dan peta endpoint di `KONTEN_MAP.md`:

- 124 halaman clipper terpetakan.
- 186 endpoint JSON terindeks.
- 45 campaign memiliki `brief_detail` lengkap.
- 124 halaman dan 186 endpoint adalah peta riset historis, bukan data runtime yang disuntikkan ke console.

Endpoint marketplace dapat berubah. Bridge dan parser harus diperlakukan sebagai integrasi toleran: validasi payload, pertahankan bentuk mentah di `raw`, dan gunakan fallback yang aman ketika field tidak tersedia.

## Verifikasi

Perintah yang tersedia:

```bash
bun run typecheck           # TypeScript aplikasi
bun run typecheck:scripts   # TypeScript smoke harness
bun test                    # 36 unit test (brief, scoring, swarm, plan, API key, workspace)
bun convex dev --once        # codegen + push fungsi
bun run smoke               # Playwright desktop/mobile smoke test
```

`bun run smoke` membutuhkan preview Vite yang sudah berjalan. Harness memeriksa landing, console, dan route social accounts pada viewport 1440px serta 390px, lalu gagal non-zero jika menemukan page error, console error, route kosong, atau overflow horizontal. Screenshots disimpan di `research/shots/`.

CI menjalankan typecheck aplikasi, typecheck harness, dan unit test. Smoke browser tetap command manual/lokal karena membutuhkan deployment Convex dan menulis data uji ke workspace.

## Model scoring campaign

Skor 0–100 adalah heuristik, bukan prediksi earnings:

```text
score = CPM 35% + remaining budget 30% + competition 20% + view barrier 15%
```

- CPM dinormalisasi hingga 5.000.
- Sisa budget dihitung dari `budget - spent`, atau memakai `remainingPct` bila budget tidak tersedia.
- Kompetisi mendapat skor lebih tinggi ketika jumlah clipper lebih sedikit.
- View barrier mendapat skor lebih tinggi ketika minimum views lebih rendah.

Skor membantu memprioritaskan review; clipper tetap wajib memeriksa deadline, brief, legalitas, dan catchy brief sebelum mengerjakan campaign.

## Research-informed production decisions

Riset ini membandingkan 11 repository GitHub yang aktif atau representatif untuk pipeline
video, subtitle, durable workflow, dan operasi AI. Pola yang diambil hanya yang cocok
dengan Vite/React/Convex/Bun; kode video, provider, dan lisensi eksternal tidak disalin
ke repo ini.

| Repository | Pola yang dipelajari | Keputusan untuk Clipper AI |
|---|---|---|
| [MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo) (MIT) | Pipeline bertahap, batch/history, config example, CORS same-origin, batas batch, prebuilt image | Diadopsi sebagai model bounded ingest, status operation, dan humans tetap melakukan submit. Auto-publish tidak diambil. |
| [MoneyPrinterV2](https://github.com/FujiwaraChoki/MoneyPrinterV2) (AGPL-3.0) | Modularisasi, cron, dan peringatan bahwa scraping/outreach berisiko | Diadopsi hanya sebagai peringatan scope; tidak mengambil kode AGPL, scraping, outreach, atau auto-post. |
| [ShortGPT](https://github.com/RayVentura/ShortGPT) | Engine terpisah untuk script, asset, voice, caption, dan editing; persistensi state | Diadopsi sebagai batas fase plan/materi/produksi/compliance; provider AI dan TinyDB tidak ditambahkan. |
| [VideoLingo](https://github.com/Huanshere/VideoLingo) (Apache-2.0) | Resume/progress, pause/stop, output cache, dan error log per tahap | Diadopsi sebagai requirement status `pending/ok/error`, request id, retry, dan durasi log; Python/GPU/Whisper tidak ditambahkan. |
| [MoviePy](https://github.com/Zulko/moviepy) (MIT) | Pipeline rendering yang dapat direifikasi dan format output eksplisit | Diadopsi sebagai Future decision untuk media renderer terisolasi; tidak menambah Python runtime ke Convex. |
| [auto-editor](https://github.com/WyattBlue/auto-editor) (Unlicense) | Pre-cut pass, margin, threshold, dan export yang bisa diaudit | Diadopsi sebagai ide review shot/quality pass; threshold dan FFmpeg belum dijalankan di server. |
| [auto-subtitle](https://github.com/m1guelpf/auto-subtitle) (MIT) | ModelWhisper sebagai opsi dan subtitle sebagai artefak terpisah | Diadopsi sebagai future opt-in adapter dengan model, bahasa, dan biaya yang terlihat jelas; tidak ada pemanggilan API implisit. |
| [ComfyUI](https://github.com/Comfy-Org/ComfyUI) | Graph yang reusable, async queue, cancellation, seed/workflow sebagai artefak | Diadopsi sebagai conceptual boundary untuk optional media jobs; tidak membawa GPU, model, atau node API ke aplikasi ini. |
| [Trigger.dev](https://github.com/triggerdotdev/trigger.dev) (Apache-2.0) | Durable task, retry, checkpoint, concurrency, tracing, human-in-the-loop | Diadopsi sebagai kontrak job masa depan. MVP tetap memakai operation log Convex sederhana agar tidak menambah backend. |
| [Inngest](https://github.com/inngest/inngest) | Event, step retry, concurrency key, rate limit, dan run history | Diadopsi untuk idempotency key, per-user concurrency, queue, dan rate-limit di roadmap sync. |
| [Restate](https://github.com/restatedev/restate) | Durable execution, exactly-once messaging, state, dan observability | Diadopsi sebagai prinsip idempotensi serta audit; dependency runtime tidak ditambahkan. |

### Kontrol yang sudah diimplementasikan

- `POST /ingest` menolak body lebih dari 1 MiB, email/source yang tidak valid, snapshot bukan
  object, dan array campaign/joined/earnings yang melebihi batas.
- `scripts/bridge-sync.ts` mengirim `requestId` UUID. `applySnapshot` memakai log
  `pending → ok/error` dan campaign upsert based on external ID, sehingga retry tidak
  menduplikasi cache campaign.
- Maksimal 500 campaign per ingest; campaign malformed dilewati secara lokal, bukan membuat
  payload server lebih besar atau mudah gagal.
- Sync log menyimpan campaign count, duration, error code, dan pesan terpotong. Cron harian
  memangkas log lebih tua dari 30 hari.
- Tidak ada auto-submit ke marketplace, auto-publish, fake engagement, atau penerimaan
  credential/cookie di cloud. Integrasi LLM/video/ComfyUI hanya keputusan produk terpisah
  yang memerlukan opt-in, data minimization, biaya, dan review license.

### Batas produksi yang masih jujur

Bridge adalah push-based dan masih dijalankan di mesin pengguna. Credential, cookie, FFmpeg,
Whisper, model video, dan provider AI tidak ada di runtime hosting. Rate limiting jaringan
 marketplace, notifikasi alert, dan durable queue penuh adalah M4/future work; jangan
menyebutnya selesai hanya karena operation log sudah ada.

## Roadmap

- **Consolidasi API:** versioning parser/bridge dan fixture regression untuk perubahan bentuk endpoint.
- **Production sync:** atur jadwal sync, retry/backoff, notifikasi error, dan observability tanpa menyimpan credential di cloud.
- **Plan collaboration:** simpan versi plan, catatan reviewer, dan export shotlist/caption.
- **Quality loop:** baca hasil clip, evaluasi hook, dan re-rank brief berdasarkan performa aktual.
- **Account safety:** rotasi secret, scope token yang lebih ketat, dan konfirmasi UI untuk setiap sync.
- **Bounded organism:** scheduler memilih goal untuk review; tidak menjalankan shell, model, filesystem, spending, atau publisher.
- **Canonical context:** realitas repository mengalahkan klaim dokumentasi; evidence, unknown state, capability graph, dan do-nothing selalu dipertimbangkan.
- **Capability expansion:** renderer/TTS/model eksternal hanya setelah opt-in, quota, license review, dan rollback.

## Operator runtime: CLI, daemon, MCP, dan browser

Runtime ini menambah jalur operasi lokal yang bisa diaudit tanpa mengubah trust boundary marketplace:

```bash
bun run sc -- source status
bun run sc -- connector list
bun run sc -- mcp list
bun run sc -- daemon status
bun run sc:mcp
bun run sc:daemon
bun run sc:browser -- https://contentrewards.com/discover
```

- `sc` hanya membaca status, catalog, dan state lokal; tidak menerima shell command atau arbitrary URL.
- `sc:daemon` adalah proses yang dijalankan operator, bukan proses yang dimulai otomatis oleh Freebuff. Ia memakai lock file, state file, interval 60–3600 detik, graceful shutdown, dan hanya melakukan discovery Content Rewards secara read-only. `SC_DAEMON_SYNC=true` mengaktifkan ingest normalized yang dilindungi `INGEST_TOKEN`; observe-only adalah default.
- `sc:mcp` adalah MCP stdio server berbasis official `@modelcontextprotocol/sdk`. Tool allowlist hanya read-only: source status, connector catalog, provider presence, bounded public discovery, browser policy, URL policy, dan daemon state. Tidak ada tool shell, publish, payment, account takeover, atau credential read.
- `sc:browser` memakai Playwright yang sudah ada untuk inspeksi title/text pada allowlist `contentrewards.com/discover` serta `konten.com/clipper-dashboard`/`login`. Tidak ada click, form, download, stealth, CAPTCHA bypass, atau anti-bot bypass.
- Camofox tidak diklaim sebagai dependency official. Repository publik yang ditemukan tidak membuktikan adanya canonical upstream. Kamus connector hanya menyediakan optional operator-owned binary contract; sampai binary dan protocol diverifikasi, built-in runner tetap Playwright read-only.

Status daemon lokal tidak dikirim ke browser dan tidak disimpan di Convex. Untuk melihat status nyata, jalankan `bun run sc -- daemon status` pada operator machine yang sama.

## Lisensi

MIT — lihat [LICENSE](./LICENSE).
