export function formatRupiah(amount) {
  const value = Number(amount) || 0;
  return `Rp${value.toLocaleString('id-ID')}`;
}

export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

// chosenOpsi: { [namaGrup]: pilihan }. Satu grup -> tampilkan nilainya saja (mis. "Pedas").
// Lebih dari satu grup -> sertakan nama grupnya biar jelas (mis. "Kuah: Pisah, Sambal: Campur").
export function formatChosenOpsi(chosenOpsi) {
  if (!chosenOpsi) return '';
  const entries = Object.entries(chosenOpsi);
  if (entries.length === 0) return '';
  if (entries.length === 1) return entries[0][1];
  return entries.map(([group, value]) => `${group}: ${value}`).join(', ');
}
