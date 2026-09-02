# Warung Pecel Mbak Septi — Website Pemesanan

Website warung dengan 2 tampilan:

- **Pelanggan** (`/`) — lihat menu, tambah ke keranjang, pesan langsung lewat WhatsApp.
- **Admin** (`/admin`) — kelola menu (tambah/edit/hapus/tandai habis), atur status buka-tutup, dan pengaturan warung. Dilindungi password.

Dibangun dengan **Next.js 16** + **Tailwind CSS v4**, dioptimalkan untuk sangat ringan dan cepat di HP, siap deploy ke **Vercel**.

## Kenapa tidak pakai database?

Karena kebutuhannya kecil (cuma daftar menu, harga, dan pengaturan warung), project ini **tidak pakai database SQL**. Data disimpan sebagai file JSON sederhana di **Vercel Blob** (`.data/menu.json` & `.data/settings.json` saat development lokal). Saat admin menyimpan perubahan, file itu langsung diperbarui dan semua pengunjung otomatis melihat versi terbaru.

Pesanan **tidak disimpan di server sama sekali** — begitu pelanggan klik "Pesan via WhatsApp", pesan langsung dibuka di WhatsApp Ibu. Tidak ada data pesanan/pelanggan yang tersimpan di mana pun.

## Menjalankan di lokal

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) untuk tampilan pelanggan, dan [http://localhost:3000/admin](http://localhost:3000/admin) untuk admin.

Saat development lokal, data menu otomatis disimpan ke folder `.data/` (tidak ikut ter-commit ke git). Setelah deploy ke Vercel dengan Blob Store terhubung, data otomatis pindah ke Vercel Blob.

## Environment variables

Isi di file `.env.local` (lihat `.env.example`):

| Variable               | Wajib? | Keterangan                                                                 |
| ----------------------- | ------ | --------------------------------------------------------------------------- |
| `ADMIN_PASSWORD`        | Ya     | Password untuk masuk ke `/admin`.                                          |
| `BLOB_READ_WRITE_TOKEN` | Otomatis di Vercel | Diisi otomatis oleh Vercel setelah Blob Store dihubungkan ke project. Tidak perlu diisi manual di lokal. |

## Deploy ke Vercel

1. Push project ini ke GitHub, lalu import ke [vercel.com/new](https://vercel.com/new).
2. Saat setup, tambahkan environment variable `ADMIN_PASSWORD` (Production & Preview).
3. Setelah deploy pertama, buka tab **Storage** di dashboard project Vercel → **Create Database** → pilih **Blob** → hubungkan ke project ini. Vercel otomatis menambahkan `BLOB_READ_WRITE_TOKEN`.
4. Redeploy sekali (Deployments → ⋯ → Redeploy) supaya environment variable Blob terbaca.
5. Selesai — buka `/admin`, login, dan mulai atur menu.

## Menambahkan foto menu asli

1. Simpan foto (disarankan rasio 1:1, ±800×800px, sudah dikompres) ke folder `public/images/menu/`, misalnya `pecel.jpg`.
2. Commit & push foto itu (atau upload lewat GitHub langsung), lalu Vercel akan redeploy otomatis.
3. Di admin, edit menu terkait → isi kolom **URL Foto** dengan `/images/menu/pecel.jpg`.

Sebelum foto asli ada, setiap menu tetap tampil menarik dengan ikon emoji + warna khas warung.

## Struktur penting

- `lib/storage.js` — baca/tulis data menu & pengaturan (Blob di production, file lokal saat dev).
- `lib/actions.js` — semua aksi admin (Server Actions): tambah/edit/hapus menu, login/logout, ubah pengaturan.
- `lib/session.js` — session login admin berbasis cookie yang ditandatangani (HMAC), tanpa perlu tabel user.
- `lib/whatsapp.js` — membangun pesan & link `wa.me` dari isi keranjang.
- `proxy.js` — melindungi seluruh halaman `/admin/*` (redirect ke login jika belum masuk).
- `app/components/Storefront.js` — halaman pelanggan (keranjang, menu, dsb).
- `app/admin/AdminDashboard.js` — halaman admin.

## Mengganti password admin

Ubah `ADMIN_PASSWORD` di `.env.local` (lokal) dan di **Settings → Environment Variables** project Vercel (production), lalu redeploy.
