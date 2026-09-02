# Warung Pecel Mbak Septi — Website Pemesanan

Website warung dengan 3 tampilan terpisah:

- **Pelanggan** (`/`) — lihat menu, tambah ke keranjang, pesan langsung lewat WhatsApp. Publik, tanpa login.
- **Admin** (`/admin`) — kelola menu (tambah/edit/hapus/tandai habis), atur status buka/tutup/istirahat/libur mingguan, dan pengaturan warung. Dilindungi password sendiri.
- **Driver** (`/driver`) — khusus yang mengantar pesanan (hari layanan antar, default Minggu): toggle status "Mulai Antar" / "Selesai Antar". Dilindungi password sendiri, terpisah total dari admin.

Dibangun dengan **Next.js 16** + **Tailwind CSS v4**, dioptimalkan untuk sangat ringan dan cepat di HP (termasuk HP dengan spek rendah & internet lambat), siap deploy ke **Vercel**.

Riwayat lengkap fitur & keputusan teknis ada di [`PROGRESS.md`](./PROGRESS.md).

## Kenapa tidak pakai database?

Karena kebutuhannya kecil (cuma daftar menu, harga, dan pengaturan warung), project ini **tidak pakai database SQL**. Data disimpan sebagai key-value sederhana di **Upstash Redis** (folder `.data/` saat development lokal). Saat admin menyimpan perubahan, data langsung diperbarui dan semua pengunjung otomatis melihat versi terbaru (polling ringan tiap 5 detik) — Redis dipilih (bukan Vercel Blob, yang sempat dicoba duluan) karena baca-tulisnya konsisten instan, cocok untuk data kecil yang sering berubah seperti status buka/tutup.

Pesanan **tidak disimpan di server sama sekali** — begitu pelanggan klik "Checkout via WhatsApp", pesan langsung terbuka di WhatsApp penjual. Tidak ada data pesanan/pelanggan yang tersimpan di mana pun (keranjang cuma tersimpan di localStorage HP pelanggan sendiri, otomatis kadaluarsa 1 jam).

## Menjalankan di lokal

```bash
npm install
npm run dev
```

- Pelanggan: [http://localhost:3000](http://localhost:3000)
- Admin: [http://localhost:3000/admin](http://localhost:3000/admin)
- Driver: [http://localhost:3000/driver](http://localhost:3000/driver)

Saat development lokal, data otomatis disimpan ke folder `.data/` (tidak ikut ter-commit ke git). Setelah deploy ke Vercel dengan Upstash Redis terhubung, data otomatis pindah ke Redis.

## Environment variables

Isi di file `.env.local` (lihat `.env.example`):

| Variable | Wajib? | Keterangan |
| --- | --- | --- |
| `ADMIN_PASSWORD` | Ya | Password untuk masuk ke `/admin`. |
| `DRIVER_PASSWORD` | Ya | Password untuk masuk ke `/driver`. |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Otomatis di Vercel | Diisi otomatis oleh Vercel setelah Upstash Redis dihubungkan ke project. Tidak perlu diisi manual di lokal. |

## Deploy ke Vercel

1. Push project ini ke GitHub, lalu import ke [vercel.com/new](https://vercel.com/new).
2. Saat setup, tambahkan environment variable `ADMIN_PASSWORD` dan `DRIVER_PASSWORD` (Production & Preview).
3. Setelah deploy pertama, buka tab **Storage** di dashboard project Vercel → **Create Database** → pilih **Upstash** (Redis) → hubungkan ke project ini. Vercel otomatis menambahkan `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN`.
4. Redeploy sekali (Deployments → ⋯ → Redeploy) supaya environment variable Redis terbaca.
5. Selesai — buka `/admin` dan `/driver`, login, dan mulai atur menu.

## Menambahkan foto menu asli

1. Kompres dulu foto-nya (disarankan rasio 1:1, ±800×800px) sebelum ditaruh — foto langsung dari kamera HP biasanya jauh lebih besar dari yang perlu dan bikin halaman berat.
2. Simpan ke folder `public/images/menu/`, misalnya `pecel.jpg`.
3. Commit & push (atau upload lewat GitHub langsung), lalu Vercel akan redeploy otomatis.
4. Di admin, edit menu terkait → isi kolom **URL Foto** dengan `/images/menu/pecel.jpg`.

Sebelum foto asli ada, setiap menu tetap tampil menarik dengan ikon emoji + warna khas warung.

## Struktur penting

- `lib/storage.js` — baca/tulis data menu, pengaturan, & hitungan pesanan antar harian (Upstash Redis di production, file lokal saat dev).
- `lib/actions.js` — semua Server Actions: CRUD menu, login/logout admin & driver, ubah pengaturan, toggle status, catat pesanan antar.
- `lib/session.js` — session login berbasis cookie HMAC-signed, generik untuk 2 role (admin & driver), secret terpisah per role.
- `lib/storeStatus.js` — logika gabungan status buka/tutup/istirahat/libur mingguan/hari layanan antar, dihitung pakai zona waktu Jakarta.
- `lib/rateLimit.js` — pembatas percobaan login (anti brute-force), di memori server.
- `lib/cartStorage.js` — baca/tulis keranjang ke localStorage pelanggan (persist + auto-expire 1 jam).
- `lib/whatsapp.js` — membangun pesan & link `wa.me` dari isi keranjang (termasuk metode ambil/antar).
- `proxy.js` — melindungi `/admin/*` dan `/driver/*` (redirect ke login masing-masing kalau belum masuk).
- `app/api/menu-status/route.js` — endpoint ringan yang di-poll halaman pelanggan tiap 5 detik untuk sinkronisasi status real-time.
- `app/components/Storefront.js` — halaman pelanggan (menu, keranjang, polling status).
- `app/components/useLockBodyScroll.js` — kunci scroll halaman belakang selama sheet/modal terbuka.
- `app/admin/AdminDashboard.js` — halaman admin.
- `app/driver/DriverDashboard.js` — halaman driver.

## Mengganti password

Ubah `ADMIN_PASSWORD` dan/atau `DRIVER_PASSWORD` di `.env.local` (lokal) dan di **Settings → Environment Variables** project Vercel (production), lalu redeploy.
