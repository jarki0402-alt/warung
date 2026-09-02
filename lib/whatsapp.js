import { formatRupiah, formatChosenOpsi } from './format';
import { CATEGORY_ORDER } from './seed';

export function normalizePhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  return digits;
}

function noteSuffix(item) {
  return item.note && item.note.trim() ? ` (catatan: ${item.note.trim()})` : '';
}

function formatSimpleLine(nama, item) {
  const opsiText = formatChosenOpsi(item.chosenOpsi);
  const price = item.harga != null ? ` - ${formatRupiah(item.harga * item.qty)}` : '';
  return `${nama}${opsiText ? ` (${opsiText})` : ''} x${item.qty}${price}${noteSuffix(item)}`;
}

function formatVariantLine(item) {
  const price = item.harga != null ? ` - ${formatRupiah(item.harga * item.qty)}` : '';
  return `${formatChosenOpsi(item.chosenOpsi)} x${item.qty}${price}${noteSuffix(item)}`;
}

// Susun daftar pesanan per kategori (mengikuti urutan di halaman menu). Dalam satu kategori:
// - menu dengan opsi (mis. Pecel dgn 3 level pedas) dikelompokkan per menu, satu combo -> satu
//   baris ringkas, 2+ combo -> baris total qty lalu rincian per combo di bawahnya.
// - menu tanpa opsi yang satu kelompok (mis. semua item Gorengan, atau satu sub-kategori
//   minuman) digabung serupa: 1 item -> baris ringkas, 2+ item -> baris total lalu rincian.
// Jadi total quantity selalu tampil dulu, baru detailnya di bawah — gampang dipindai sekilas.
function buildItemLines(items) {
  const presentCategories = [...new Set(items.map((item) => item.kategori))];
  const orderedCategories = [
    ...CATEGORY_ORDER.filter((c) => presentCategories.includes(c)),
    ...presentCategories.filter((c) => !CATEGORY_ORDER.includes(c)),
  ];

  const lines = [];
  let counter = 0;

  for (const kategori of orderedCategories) {
    const catItems = items.filter((item) => item.kategori === kategori);

    // Kelompokkan: item ber-opsi -> per id menu; item tanpa opsi -> per sub-kategori/kategori.
    const groups = new Map();
    for (const item of catItems) {
      const isOpsi = item.opsi && item.opsi.length > 0;
      const key = isOpsi ? `item:${item.id}` : `bundle:${item.subKategori || item.kategori}`;
      if (!groups.has(key)) {
        groups.set(key, { kind: isOpsi ? 'opsi' : 'bundle', label: isOpsi ? item.nama : item.subKategori || item.kategori, entries: [] });
      }
      groups.get(key).entries.push(item);
    }

    lines.push(`*${kategori}*`);
    for (const group of groups.values()) {
      counter += 1;
      const totalQty = group.entries.reduce((sum, e) => sum + e.qty, 0);

      if (group.entries.length === 1) {
        // Satu-satunya combo/item di grup ini -> cukup satu baris ringkas, tidak perlu dipecah.
        lines.push(`${counter}. ${formatSimpleLine(group.kind === 'opsi' ? group.label : group.entries[0].nama, group.entries[0])}`);
      } else if (group.kind === 'opsi') {
        lines.push(`${counter}. ${group.label} x${totalQty}`);
        for (const e of group.entries) lines.push(`   • ${formatVariantLine(e)}`);
      } else {
        lines.push(`${counter}. ${group.label} x${totalQty}`);
        for (const e of group.entries) lines.push(`   • ${formatSimpleLine(e.nama, e)}`);
      }
    }
    lines.push('');
  }

  lines.pop(); // buang baris kosong terakhir
  return lines;
}

export function buildOrderMessage({ settings, items, customerName, note, metode }) {
  const hasPriced = items.some((item) => item.harga != null);
  const hasUnpriced = items.some((item) => item.harga == null);
  const total = items.reduce((sum, item) => sum + (item.harga != null ? item.harga * item.qty : 0), 0);
  const isDelivery = metode === 'antar';
  const closingLine = isDelivery
    ? 'Kalau sudah siap, mohon dikabari ya, biar bisa segera diantar.'
    : 'Kalau sudah siap, tolong kabari ya, nanti saya ambil ke warung.';

  // Catatan sudah menempel per baris (lihat formatSimpleLine/formatVariantLine di atas),
  // jadi tidak perlu bagian "Catatan menu" terpisah lagi di sini.
  const parts = [`Halo ${settings.namaWarung}`, 'Saya mau pesan:', '', ...buildItemLines(items)];

  parts.push('', `Nama: ${customerName || '-'}`);

  // Diantar: field "note" dipakai sebagai alamat pengantaran (wajib diisi di form),
  // jadi ditulis nempel ke baris Metode, bukan sebagai catatan umum terpisah.
  if (isDelivery) {
    parts.push(`Metode: Diantar ke ${note.trim()}`);
  } else {
    parts.push('Metode: Ambil sendiri di warung');
    if (note && note.trim()) {
      parts.push(`Catatan tambahan: ${note.trim()}`);
    }
  }

  parts.push('');

  if (settings.catatanPesanan) {
    parts.push(settings.catatanPesanan, '');
  }

  // Baris soal harga/total & penutup selalu ditaruh paling bawah, ditulis sebagai
  // kalimat-kalimat pendek yang sopan — bukan satu kalimat panjang.
  if (hasUnpriced) {
    if (hasPriced) {
      parts.push(`Total sementara: ${formatRupiah(total)} (item lain menyusul konfirmasi harga)`, '');
    }
    parts.push('Mohon info total harganya ya, Mbak.', closingLine, 'Terima kasih banyak.');
  } else {
    parts.push(`Total: ${formatRupiah(total)}`, '', closingLine, 'Terima kasih banyak.');
  }

  return parts.join('\n');
}

export function buildWhatsAppUrl(settings, message) {
  const phone = normalizePhone(settings.nomorWhatsApp);
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
