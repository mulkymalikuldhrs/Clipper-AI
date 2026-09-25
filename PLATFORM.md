# PLATFORM — Clipper AI sebagai SaaS / BaaS, dan apa yang belum ada

Dokumen ini menjawab satu pertanyaan: kalau Clipper AI ingin menjadi produk berlangganan
yang juga menyediakan backend dan infrastruktur untuk pelanggannya, bagian mana yang sudah
berdiri dan bagian mana yang masih kosong? Isi dokumen ini hanya menyebut yang bisa
dibuktikan dari kode di repositori ini.

## Ringkas

| Lapisan | Status | Bukti di repo |
|---|---|---|
| **SaaS — identitas & tenancy** | Sebagian | `src/convex/workspace.ts`, `src/convex/schema.ts` (`operatorWorkspaces`) |
| **SaaS — plan & kuota** | Berjalan | `src/lib/plans.ts`, pengecekan di `src/convex/brief.ts` dan `src/convex/queries.ts` |
| **SaaS — metering** | Berjalan | tabel `usageEvents`, `src/convex/platform.ts` |
| **SaaS — billing & invoice** | **Belum ada** | tidak ada payment provider, tidak ada harga, tidak ada penagihan |
| **BaaS — API key** | Berjalan | `src/convex/platform.ts`, `src/lib/apiKeys.ts` (hash SHA-256 saja) |
| **BaaS — HTTP API** | Berjalan, read-only | `src/convex/apiHttp.ts` (`/api/v1/workspace`, `/campaigns`, `/plans`) |
| **BaaS — webhook / event keluar** | **Belum ada** | `webhook` masih `status: "planned"` di `src/lib/connectors.ts` |
| **BaaS — database per tenant** | **Belum ada** | satu deployment Convex, isolasi lewat scope aplikasi |
| **IaaS — compute / container / storage** | **Belum ada** | tidak ada provisioning; eksekusi berat tetap proses lokal operator |

## Yang sudah nyata

### 1. Tenancy tanpa akun

Tidak ada alur sign-in. Satu browser memegang satu `workspaceKey` acak 32 hex di
`localStorage`, dan Convex memetakannya ke satu baris `operatorWorkspaces` yang menunjuk ke
`users`. Artinya produk ini sudah multi-tenant secara data, tetapi **belum** multi-tenant
secara infrastruktur: semua tenant hidup di deployment dan tabel yang sama.

Konsekuensi yang harus disebut apa adanya:

- key adalah capability; siapa pun yang memegangnya bisa menulis ke workspace itu;
- tidak ada cara memulihkan workspace yang key-nya hilang;
- tidak ada isolasi tingkat database, jadi satu bug query yang salah scope bisa membocorkan
  data antar workspace.

### 2. Plan dan kuota yang ditegakkan

`src/lib/plans.ts` mendefinisikan `free`, `studio`, dan `agency` beserta batas rencana, goal,
API key, dan request API harian. Batas itu dibaca di mutation yang mengonsumsinya, bukan
hanya dipajang:

- `createPlan` menolak melewati `plan.maxPlans`;
- `createOrganismGoal` menolak melewati `plan.maxGoals`;
- `createApiKey` menolak melewati `plan.maxApiKeys` (dengan plafon absolut 100);
- `meterApiRequest` menolak request ke-`N+1` dengan `429`.

`HARD_LIMITS` menjaga agar plan tidak pernah bisa dikonfigurasi melewati plafon absolut.

### 3. Metering

Setiap kejadian yang layak dihitung menulis satu baris `usageEvents`
(`plan.created`, `goal.created`, `api_key.created`, `api.request`, `ingest.snapshot`).
`getPlatformOverview` mengagregasinya untuk console. Angka di UI berasal dari tabel ini, bukan
dari perkiraan.

### 4. Kredensial mesin

API key memakai format `clai_` + 48 hex. **Plaintext dibuat dan di-hash di browser**; yang
dikirim ke server hanya hash SHA-256 dan prefix tampilan. Server tidak pernah melihat key
yang bisa dipakai, dan respons `listApiKeys` tidak pernah mengembalikan `hash`.

## Yang belum ada, dan tidak boleh diklaim

### Billing

Tidak ada payment provider, tidak ada harga, tidak ada invoice, tidak ada dunning, dan tidak
ada webhook pembayaran. Karena itu console **sengaja tidak punya tombol upgrade**: tombol
upgrade tanpa penagihan adalah kebohongan UX. Perpindahan plan saat ini adalah tindakan
operator.

Untuk menjadi SaaS berbayar, urutan minimumnya: pilih payment provider, buat satu endpoint
webhook bertanda tangan yang menulis `operatorWorkspaces.plan`, tambahkan audit log
perubahan plan, lalu baru tampilkan tombol upgrade.

### IaaS

Tidak ada compute, container, volume, atau storage yang di-provision untuk pelanggan. Ini
bukan kelalaian kecil: menjalankan render video atau browser otomatis untuk tenant lain
berarti menyediakan runtime, bukan hanya mengoordinasikannya. Karena itu:

- eksekusi berat tetap milik operator (bridge dan daemon lokal);
- tidak ada endpoint yang menjalankan pekerjaan atas nama workspace lain;
- tidak ada klaim "cloud runner" di UI mana pun.

### Webhook dan event keluar

`webhook` masih `status: "planned"`. Belum ada signature, replay protection, retry, atau
dead-letter queue. Sampai itu ada, automation eksternal harus menarik data lewat API, bukan
menunggu push.

### Isolasi keras

Tidak ada database atau deployment per tenant. Isolasi hari ini adalah disiplin scope di
setiap query. Kalau produk ini naik ke pelanggan yang tidak saling percaya, langkah
berikutnya bukan menambah fitur, melainkan memisahkan penyimpanan per tenant.

## Definisi "selesai" untuk tiap janji

Kalau salah satu dari ini benar, klaimnya baru boleh ditulis di README:

1. **Berlangganan:** ada payment provider, webhook bertanda tangan, riwayat perubahan plan,
   dan konsumen yang benar-benar ditolak saat kuota habis.
2. **API publik:** ada versioning, dokumentasi respons error, rate limit per key, dan uji
   integrasi yang gagal kalau kontrak berubah.
3. **Runner terkelola:** ada isolasi per tenant, batas CPU/memori, audit log eksekusi, dan
   jalur pembatalan.
4. **Webhook keluar:** ada signature, retry dengan backoff, dedupe, dan DLQ yang bisa diperiksa.

Selama itu belum ada, dokumen dan UI harus tetap memakai kata "belum".
