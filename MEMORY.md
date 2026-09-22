# MEMORY — Super Clipper (session state)

## Status
- Repo: `mulkymalikuldhrs/Clipper-AI` (Vite + React + Tailwind + Convex + Convex Auth, Bun).
- Fase: **upgrade "super clipper" tahap lanjut selesai di sisi kode**. Crawl konten.com
  diperdalam sampai tuntas dan Brief Autopilot sekarang memakai brief asli (materi, narasi,
  CTA, do & don't, target audiens).

## Yang terverifikasi di sesi ini
- Deep crawl tuntas: **124 halaman**, **186 endpoint** JSON, 0 link internal tersisa
  (`research/.crawl-progress.json` + `research/konten-map.json`).
  Bug crawler diperbaiki: link hasil temuan dulu hanya dikuras di dalam loop sehingga crawl
  berhenti prematur ketika seed/probe sudah habis; kini queue di-seed dari `discovered`, dan
  `MAX_PAGES` bisa diatur (`CRAWL_MAX_PAGES`, default 250).
- Ekstraksi penuh: **45 campaign** dengan `brief_detail` lengkap + top-clips
  (`scripts/crawl-campaigns.ts` → `research/konten-campaigns.json`). 0 error.
- `scripts/gen-demo-data.ts` → `src/convex/demoData.ts`: **20 campaign / 114 materi** asli
  (IBU, David Noah, Bevan, Wondermoms, Growlab, Sariwangi, Shinzui, Emina, Free Fire, dll).
- `parseBrief()` dipecah ulang: hook dari sudut brief, shotlist berskala `durasiMin/Max`,
  `boleh[]` vs `dilarang[]`, `targetAudience`, `goal`, `captionWajib`, poin narasi,
  fallback CTA saat brief mengirim `""`, skor kepatuhan dari kelengkapan brief.
- `bun tsc -b --noEmit` **bersih**. `parseBrief` diuji langsung terhadap brief IBU asli:
  8 materi, 4 BOLEH, 5 DILARANG, shotlist 0:00→2:00, skor kepatuhan 100.

## Blocker yang jujur harus disebut (belum selesai)
- Fungsi Convex di deployment lokal **masih kode lama**: push fungsi terakhir 22:21
  (terlihat dari mtime blob di `.convex/local/default/.../modules/`), sedangkan kode baru
  diedit 23:42–23:45.
- Sebab: `scripts/dev.sh` versi lama menjalankan `bunx convex dev` sendiri. Proses itu menjadi
  yatim (PPID 1), memegang port 3210, dan **watcher-nya tidak melihat perubahan file** lewat
  layer sync Vly. Akibatnya (a) tidak ada hot-push, dan (b) pengecekan platform
  `bun convex dev --once` gagal terus ("A local backend is still running on port 3210").
- Sudah dilakukan: `dev.sh` diubah jadi **hanya Vite** (+ `bun run convex:dev` untuk dev manual
  di luar Freebuff) supaya tidak ada lagi backend kedua. `freebuff-preview stop/restart`
  tidak bisa membersihkan proses yatim itu (keduanya detached dari process group preview).
- Diperlukan: **restart sesi dev/workspace** oleh user (atau izin eksplisit untuk menghentikan
  proses `convex dev` yatim itu) agar platform menjalankan `convex dev --once` dan fungsi baru
  ter-deploy. Sesudah itu alur E2E live (login → seed demo → rencana autopilot berisi do/don't)
  perlu dijalankan ulang untuk verifikasi penutup.

## Keputusan teknis penting
- `dev.sh` TIDAK boleh menjalankan Convex (platform yang mengelola proses itu).
- Bridge WAJIB mengambil `/api/campaigns/:slug` per campaign; tanpa itu `raw.brief_detail` kosong
  dan Brief Autopilot tidak punya bahan.
- `GET /api/campaigns?...&limit=` sekarang HTTP 400; `/api/campaigns/:id/closure` HTTP 404 →
  sisa budget dihitung dari `budget`/`spent`.
- Data demo harus jelas berlabel: campaign/brief = asli hasil crawl; angka earnings/wallet = contoh.

## Risk
- Tanpa API resmi, semua lewat sesi akun user sendiri; rate limit 429 pernah terlihat.
- Struktur API bisa berubah lagi → bridge & parser defensif, jangan asumsikan satu bentuk response.
- Jangan pernah commit `research/` mentah (cookie sesi, dump API, PII). `.gitignore` menahan
  semuanya kecuali `research/RESEARCH.md`.
