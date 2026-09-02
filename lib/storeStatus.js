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

// Kunci tanggal (YYYY-MM-DD) berdasarkan zona Jakarta — dipakai buat kunci hitungan
// pesanan antar harian, supaya "hari ini" konsisten di mana pun kode ini jalan.
export function getJakartaDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

// Jam (HH:mm) berdasarkan zona Jakarta — dipakai buat catatan log checkout.
export function getJakartaTimeString(date = new Date()) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export function isDeliveryDayToday(settings) {
  return Boolean(settings.hariAntar) && getJakartaDayName() === settings.hariAntar;
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
