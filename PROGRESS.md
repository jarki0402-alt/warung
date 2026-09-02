# Progress — Warung Pecel Mbak Septi

Catatan perkembangan project ini dari awal dibangun sampai sekarang. Diurutkan per area fitur (bukan kronologis ketat), supaya gampang dicari kalau butuh inget "ini dulu udah dikerjain belum ya".

## Fondasi

- Next.js 16 (App Router, Turbopack) + Tailwind CSS v4, dioptimalkan buat HP terlebih dulu.
- 3 tampilan terpisah, masing-masing dengan login/session sendiri-sendiri:
  - **Pelanggan** (`/`) — publik, tanpa login.
  - **Admin** (`/admin`) — password sendiri (`ADMIN_PASSWORD`), buat ibu kelola menu & pengaturan warung.
  - **Driver** (`/driver`) — password sendiri (`DRIVER_PASSWORD`), buat adik toggle status "sedang mengantar".
- Tanpa database SQL — data menu & pengaturan disimpan sebagai key-value sederhana di **Upstash Redis** (awalnya sempat pakai Vercel Blob, pindah karena Blob nge-cache di CDN minimal 60 detik yang bikin perubahan status kadang "ketiban" data lama — Redis baca-tulisnya instan konsisten).
- Pesanan **tidak pernah disimpan di server** — checkout langsung buka WhatsApp dengan pesan yang sudah terisi, penjual & pembeli lanjut ngobrol manual di sana.

## Menu & Katalog

- Kategori: Makanan Berat, Makanan Ringan, Gorengan, Minuman.
- Sub-kategori buat mengelompokkan beberapa varian jadi 1 kartu di halaman pelanggan (mis. "Es Seduh / Saset" — 1 foto representatif, bukan mozaik per item).
- Sistem "opsi" fleksibel per item: Pecel/Karedok/Ketoprak punya 1 grup (Level Pedas: Tidak Pedas/Sedang/Pedas, ditandai warna bukan emoji cabai), Soto Ayam punya 3 grup independen (Kuah, Sambal, Level Pedas).
- Catatan per-kombinasi (mis. "1 Pedas tanpa lontong, 1 Sedang tanpa catatan" untuk Pecel yang sama) — nempel ke baris kombinasinya sendiri, bukan catatan umum.
- Harga per item boleh dikosongkan ("Tanya harga") — checkout tetap jalan, total dikonfirmasi manual via WhatsApp.
- Admin: tambah/edit/hapus menu, tandai habis/tersedia (optimistic update — berubah instan di layar, sinkron ke server di belakang), konfirmasi sebelum hapus (bukan `confirm()` browser bawaan, modal sendiri).
- Foto asli 14 menu (dan seterusnya) — dikompres ke ≤800px & kualitas terjaga, total folder foto dijaga tetap kecil (sempat membengkak ke 47MB pas upload foto asli tanpa kompres, sudah dikompres ulang jadi ~2MB).

## Checkout & WhatsApp

- Gaya checkout e-commerce (kartu menu dengan tombol "+", badge keranjang, sheet "Ringkasan Pesanan").
- Pesan WhatsApp tersusun rapi: total per menu dulu baru rincian kombinasi, nada profesional-hangat tanpa tanda seru/emoji (permintaan eksplisit — sempat dicoba dengan emoji tapi render jadi "?" di HP asli, jadi dihapus semua).
- Checkout langsung ke tab yang sama (`window.location.href`, bukan tab baru).
- Input teks pakai `text-base` (16px) di semua tempat — mencegah Safari iOS auto-zoom saat fokus ke field.

## Ketersediaan Real-Time

- Polling ringan tiap 5 detik (`/api/menu-status`, ~1KB per cek) — status buka/tutup & ketersediaan menu otomatis update ke pelanggan tanpa refresh manual.
- Item yang jadi "Habis" saat sudah ada di keranjang pelanggan otomatis terhapus + notifikasi singkat, dan tidak akan pernah bisa ke-checkout (dobel proteksi: efek pembersih + filter ulang saat hitung total).
- Polling dioptimalkan: berhenti saat tab tidak aktif, maksimal 1 request berbarengan (auto-abort kalau lambat + timeout 10 detik), dan **tidak** trigger render sama sekali kalau data hasil poll identik dengan sebelumnya — jadi murah di CPU/baterai HP.

## Status Buka/Tutup/Istirahat/Libur

- Status manual Buka/Tutup (toggle cepat di admin).
- **Istirahat sejenak** (sholat/istirahat) — toggle terpisah dari tutup penuh, pelanggan tetap lihat menu tapi checkout terkunci dengan pesan jelas.
- **Libur mingguan otomatis** — pilih 1 hari (default Jumat) di Pengaturan, warung otomatis tampil tutup ke pelanggan di hari itu tanpa admin perlu toggle manual tiap minggu. Dihitung pakai zona waktu Jakarta secara eksplisit (bukan zona waktu server/device), jadi konsisten di mana pun dijalankan.
- Semua kondisi tutup (manual/istirahat/libur) mengunci checkout di **semua tempat** yang relevan (keranjang, sheet atur opsi) — sempat ada celah di mana `CartDrawer` & `ItemOptionsSheet` belum ngecek status ini sama sekali, sudah diperbaiki.

## Layanan Antar (Hari Minggu) & Portal Driver

- Opsi "Ambil Sendiri" / "Diantar" di checkout, cuma muncul di hari layanan antar (default Minggu, bisa diganti di Pengaturan).
- Pilih "Diantar" → alamat wajib diisi, otomatis masuk ke pesan WhatsApp (`Metode: Diantar ke [alamat]`), plus pengingat kirim Share Location WhatsApp (di form checkout & di pesan WA-nya sendiri).
- **Portal `/driver`** — login terpisah total dari admin (password & sesi beda, saling gak bisa dipakai silang). Tampilan 1 tombol besar: **Mulai Antar** ↔ **Selesai Antar**, plus jumlah pesanan antar hari ini.
- Saat status "Mengantar" aktif: pelanggan tetap bisa pilih Diantar tapi diinfoin jelas (background merah + kedip) "mungkin agak lama". Admin cuma lihat info read-only, kontrolnya sepenuhnya di tangan driver.
- **Batas pesanan antar per hari** (default 3, admin bisa ubah) — dihitung via counter Redis yang otomatis "reset" sendiri tiap hari baru (kunci per-tanggal, tanpa cron job). Begitu tercapai, opsi Diantar otomatis nonaktif dengan pesan jelas.

## Keranjang & Persistensi

- Keranjang disimpan di **localStorage** (device pelanggan sendiri, bukan server) — bertahan kalau halaman di-refresh, tanpa nambah request jaringan sama sekali.
- Otomatis kadaluarsa setelah 1 jam tidak ada aktivitas (timer reset tiap ada perubahan).
- Otomatis kosong setelah checkout berhasil.
- Sempat ada race condition antara efek "muat dari localStorage" dan "simpan ke localStorage" yang jalan bareng di render pertama (bikin keranjang yang baru dipulihkan malah ketimpa kosong lagi) — sudah diperbaiki & diverifikasi ulang.

## Keamanan

- Password admin & driver dibandingkan pakai `timingSafeEqual` (tahan timing-attack), bukan `!==` biasa.
- Rate limiting percobaan login (5x salah → diblokir 15 menit), terpisah per role+IP.
- Sesi login HMAC-signed, cookie `httpOnly` + `secure` di production, admin & driver punya secret turunan password masing-masing (saling terisolasi).
- 3 lapis proteksi rute admin/driver: cek di edge (proxy.js), cek di halaman (redirect kalau belum login), cek ulang di **setiap** Server Action (`requireAdmin()`/`requireDriver()`).
- HTTP security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`).
- Celah XSS kecil di data JSON-LD (SEO) — teks pengaturan yang mengandung `</script>` bisa kabur dari tag script — sudah ditutup (escape karakter `<`).
- `.env.local` dijaga tetap gitignored, `.env.example` sengaja dikecualikan dari ignore biar tetap ke-commit sebagai template aman.

## SEO

- Metadata lengkap (title, description, canonical, Open Graph, Twitter Card), gambar OG dibuat otomatis (`/opengraph-image`, bukan file statis).
- JSON-LD `Restaurant` (nama, jam, kontak, alamat kalau diisi) — bantu Google nampilin info lebih kaya.
- `robots.txt` (blokir `/admin` & `/driver` dari index) dan `sitemap.xml`.
- `manifest.json` + ikon — dasar buat "Add to Home Screen".

## PWA / "Add to Home Screen"

- Diputuskan **tanpa service worker** — risiko cache basi (data menu/status jadi gak real-time) dinilai lebih besar dari manfaatnya untuk skala warung ini, apalagi HTTP caching bawaan Next.js sudah otomatis nutup sebagian besar manfaat caching aset statis.
- Metadata `appleWebApp` dilengkapi supaya "Add to Home Screen" di iPhone juga buka standalone (tanpa address bar), sama seperti Android.
- `viewport-fit=cover` + `env(safe-area-inset-*)` di semua header (sticky) dan sheet (bottom) — benerin bug bar checkout "melayang"/gak nempel presisi ke tepi layar saat dibuka standalone dari home screen.

## Performa

- Optimistic UI di semua aksi admin/driver (toggle, hapus) — tampilan berubah instan, sinkron ke server di belakang layar.
- Gambar: `next/image` responsive (ukuran kecil yang benar-benar didownload sesuai layar), foto kartu pertama diprioritaskan muat (`priority`), sisanya lazy-load.
- 3 komponen berat yang cuma dipakai setelah interaksi (Keranjang, Atur Pesanan, Pilih Grup) di-lazy-load (`next/dynamic`, `ssr: false`) — tidak ikut diproses CPU sebelum halaman pertama tampil.
- Halaman utama pakai **ISR (revalidate 5 detik)**, bukan render-ulang-total tiap kunjungan — kebanyakan kunjungan dapat halaman dari cache Vercel (super cepat), sementara perubahan admin tetap terasa instan lewat `revalidatePath` yang membatalkan cache seketika.
- Scroll halaman belakang dikunci total selama sheet/modal terbuka (`useLockBodyScroll`) — benerin bug sheet "melayang" di HP saat discroll.
- Total JS awal yang harus diproses HP: ~184KB terkompresi, mayoritas itu framework React/Next.js sendiri (bukan kode aplikasi) — sudah dekat batas minimum yang realistis tanpa ganti framework.

## Status Saat Ini

Semua fitur di atas sudah live di `https://warungmbaksepti.biz.id`, terhubung ke GitHub (`jarki0402-alt/warung`) dengan auto-deploy tiap push ke `main`, dan pakai Upstash Redis sebagai penyimpanan data production.
