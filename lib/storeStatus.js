// Status buka/tutup warung yang sebenarnya ditentukan dari 4 hal (dicek berurutan):
// 1. Tutup manual (settings.status === 'tutup') — penjual sengaja tutup di luar jadwal
//    (tiba-tiba mau tutup), abaikan jadwal jam buka/tutup sepenuhnya.
// 2. Istirahat (settings.istirahat) — tutup sejenak (sholat/istirahat), belum tentu tahu jam pastinya.
// 3. Libur mingguan (settings.hariLibur) — otomatis tutup tiap hari itu, tanpa perlu di-toggle manual.
// 4. Jadwal jam buka/tutup (settings.jamBuka/jamTutup) — di luar jam itu otomatis tutup sendiri,
//    admin tidak perlu klik apa-apa tiap hari; status 'buka' artinya "ikut jadwal", bukan "selalu buka".
// Dipakai di server (SSR/API) & client (polling) — makanya harus fungsi murni yang hasilnya
// konsisten di mana saja, jadi hari & jam "sekarang" selalu dihitung pakai zona waktu Jakarta,
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

function jamOperasionalText(settings) {
  return settings.jamBuka && settings.jamTutup ? `${settings.jamBuka} - ${settings.jamTutup}` : '';
}

// Kosongkan salah satu (jamBuka/jamTutup) untuk mematikan jadwal otomatis — dianggap
// selalu dalam jam operasional, murni ikut toggle manual seperti sebelumnya.
export function isWithinOperatingHours(settings, date = new Date()) {
  if (!settings.jamBuka || !settings.jamTutup) return true;
  const now = getJakartaTimeString(date);
  return now >= settings.jamBuka && now < settings.jamTutup;
}

export function getStoreStatus(settings) {
  const jam = jamOperasionalText(settings);

  if (settings.status === 'tutup') {
    return {
      closed: true,
      reason: 'tutup',
      message: `Warung sedang tutup${jam ? ` · buka lagi ${jam}` : ''}. Kamu tetap bisa lihat-lihat menu ya!`,
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

  if (!isWithinOperatingHours(settings)) {
    return {
      closed: true,
      reason: 'di-luar-jam',
      message: `Warung sedang tutup, di luar jam operasional${jam ? ` (${jam})` : ''}. Kamu tetap bisa lihat-lihat menu ya!`,
    };
  }

  return { closed: false, reason: null, message: '' };
}
