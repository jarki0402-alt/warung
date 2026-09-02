// Service worker MINIMAL — sengaja TIDAK melakukan caching apa pun.
//
// Satu-satunya alasan file ini ada: Chrome mensyaratkan sebuah service worker
// dengan event listener 'fetch' terdaftar sebelum dia mau memunculkan tombol
// "Install App" native (event `beforeinstallprompt`) di halaman /pasang. Tanpa
// file ini, tombol install itu tidak akan pernah muncul di Android.
//
// PENTING — JANGAN tambahkan caching/offline logic di sini. Web ini bergantung
// pada data yang selalu fresh (status buka/tutup, stok habis, dll, di-poll tiap
// 5 detik). Service worker yang nge-cache respons bisa bikin pelanggan lihat
// data lama tanpa sadar — itu sudah pernah dievaluasi & sengaja dihindari.
// Kalau suatu saat butuh offline support beneran, desain ulang dengan strategi
// "network-first" yang eksplisit untuk halaman & API, bukan nambah cache di sini
// begitu saja.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Selalu ke jaringan, tidak pernah dari cache.
  event.respondWith(fetch(event.request));
});
