// Status buka/tutup warung yang sebenarnya ditentukan dari 3 hal (dicek berurutan):
// 1. Tutup manual (settings.status === 'tutup') — penjual tutup warung penuh.
// 2. Istirahat (settings.istirahat) — tutup sejenak (sholat/istirahat), belum tentu tahu jam pastinya.
// 3. Libur mingguan (settings.hariLibur) — otomatis tutup tiap hari itu, tanpa perlu di-toggle manual.
// Dipakai di server (SSR/API) & client (polling) — makanya harus fungsi murni yang hasilnya
// konsisten di mana saja, jadi hari "sekarang" selalu dihitung pakai zona waktu Jakarta,
// bukan zona waktu device/server yang menjalankannya (bisa beda-beda).

export function getJakartaDayName(date = new Date()) {
  return new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'long' }).format(date);
}

export function getStoreStatus(settings) {
  if (settings.status === 'tutup') {
    return {
      closed: true,
      reason: 'tutup',
      message: `Warung sedang tutup${settings.jamOperasional ? ` · buka lagi ${settings.jamOperasional}` : ''}. Kamu tetap bisa lihat-lihat menu ya!`,
    };
  }

  if (settings.istirahat) {
    return {
      closed: true,
      reason: 'istirahat',
      message: 'Warung sedang istirahat sebentar (sholat/istirahat) — coba lagi beberapa saat lagi ya!',
    };
  }

  if (settings.hariLibur && getJakartaDayName() === settings.hariLibur) {
    return {
      closed: true,
      reason: 'libur-mingguan',
      message: `Warung libur setiap hari ${settings.hariLibur}. Sampai jumpa lagi besok!`,
    };
  }

  return { closed: false, reason: null, message: '' };
}
