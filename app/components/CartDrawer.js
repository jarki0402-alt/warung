'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { formatRupiah, formatChosenOpsi } from '@/lib/format';
import { buildOrderMessage, buildWhatsAppUrl } from '@/lib/whatsapp';

function resolveGroupItems(menu, label) {
  const bySubKategori = menu.filter((i) => i.subKategori === label);
  if (bySubKategori.length > 0) return bySubKategori;
  return menu.filter((i) => i.kategori === label && !i.subKategori && (!i.opsi || i.opsi.length === 0));
}

export default function CartDrawer({ open, onClose, items, menu, settings, onAdd, onRemove, onClear, onEditOptions, onEditGroup }) {
  const [customerName, setCustomerName] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  // Gabungkan baris keranjang untuk ditampilkan lebih ringkas:
  // - item dengan opsi (Pecel, Soto, dst.) -> satu baris per item, breakdown kombinasi opsi.
  // - item tanpa opsi (Gorengan, dst.) -> satu baris per kategori/sub-kategori, breakdown per menu.
  const grouped = useMemo(() => {
    const map = new Map();
    for (const item of items) {
      const isOpsi = item.opsi && item.opsi.length > 0;
      const key = isOpsi ? `item:${item.id}` : `cat:${item.subKategori || item.kategori}`;

      if (!map.has(key)) {
        map.set(
          key,
          isOpsi
            ? { key, kind: 'opsi', item, totalQty: 0, combos: [] }
            : { key, kind: 'bundle', groupLabel: item.subKategori || item.kategori, totalQty: 0, lines: [] }
        );
      }
      const g = map.get(key);
      g.totalQty += item.qty;
      if (isOpsi) g.combos.push({ chosenOpsi: item.chosenOpsi, qty: item.qty, note: item.note });
      else g.lines.push({ nama: item.nama, icon: item.icon, foto: item.foto, qty: item.qty });
    }
    return [...map.values()];
  }, [items]);

  if (!open) return null;

  // Status warung bisa berubah SAAT keranjang ini sedang terbuka (polling di
  // Storefront tiap 5 detik) — tanpa ini, pelanggan yang sudah buka keranjang
  // sebelum warung tutup tetap bisa checkout padahal warungnya sudah tutup.
  const storeClosed = settings.status === 'tutup';
  const hasPriced = items.some((item) => item.harga != null);
  const hasUnpriced = items.some((item) => item.harga == null);
  const total = items.reduce((sum, item) => sum + (item.harga != null ? item.harga * item.qty : 0), 0);

  function handleOrder() {
    if (storeClosed) {
      setError('Warung baru saja tutup, belum bisa checkout sekarang ya.');
      return;
    }
    if (!customerName.trim()) {
      setError('Isi nama kamu dulu ya, biar Mbak Septi tahu pesanan ini punya siapa.');
      return;
    }
    setError('');
    const message = buildOrderMessage({ settings, items, customerName, note });
    const url = buildWhatsAppUrl(settings, message);
    // Kosongkan keranjang (termasuk yang tersimpan di localStorage) sebelum pindah ke
    // WhatsApp — supaya kalau pelanggan balik lagi ke web, gak ketemu pesanan lama.
    onClear();
    // Navigasi langsung di tab yang sama — browser langsung menawarkan buka aplikasi
    // WhatsApp, tanpa tab kosong yang sempat muncul dulu.
    window.location.href = url;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Tutup keranjang"
        onClick={onClose}
        className="absolute inset-0 bg-ink/40 backdrop-blur-[1px] animate-fade-in"
      />

      <div className="relative z-10 flex max-h-[90dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-surface shadow-2xl animate-slide-up sm:max-h-[85dvh] sm:rounded-3xl">
        <div className="shrink-0 px-5 pb-3 pt-4">
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-ink/10 sm:hidden" />
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-ink">Ringkasan Pesanan</h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/5 text-ink-soft"
              aria-label="Tutup"
            >
              ✕
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <p className="px-5 py-10 text-center text-[15px] text-ink-soft">Keranjang masih kosong. Yuk pilih menu dulu!</p>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto px-5">
              <ul className="flex flex-col gap-3.5 pb-2">
                {grouped.map((g) => {
                  // Bundel yang cuma berisi 1 menu berbeda (mis. cuma Es Cendol sendirian di
                  // Minuman) ditampilkan sebagai baris biasa — nama menunya langsung, bukan
                  // label kategori umum yang terkesan aneh untuk 1 item.
                  const isSingleBundle = g.kind === 'bundle' && g.lines.length === 1;
                  const foto = g.kind === 'opsi' ? g.item.foto : g.lines[0]?.foto;
                  const icon = g.kind === 'opsi' ? g.item.icon : g.lines[0]?.icon;
                  const displayName = g.kind === 'opsi' ? g.item.nama : isSingleBundle ? g.lines[0].nama : g.groupLabel;
                  const displayHarga = g.kind === 'opsi' ? g.item.harga : isSingleBundle ? g.lines[0].harga : null;
                  return (
                  <li key={g.key} className="flex items-center gap-3">
                    <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-cream text-2xl">
                      {foto ? (
                        <Image src={foto} alt={displayName} fill sizes="48px" className="object-cover" />
                      ) : (
                        icon || '🍽️'
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold text-ink">{displayName}</p>
                      {displayHarga != null && <p className="text-sm text-ink-soft">{formatRupiah(displayHarga)}</p>}
                      {!isSingleBundle && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-ink-soft">
                          {g.kind === 'opsi'
                            ? g.combos
                                .map(
                                  (c) =>
                                    `${formatChosenOpsi(c.chosenOpsi)} ${c.qty}${
                                      c.note ? ` (${c.note})` : ''
                                    }`
                                )
                                .join(' · ')
                            : g.lines.map((l) => `${l.nama} ${l.qty}`).join(' · ')}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-full bg-ink/5 px-2.5 py-1 text-xs font-bold text-ink-soft">
                        {g.totalQty}x
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          g.kind === 'opsi'
                            ? onEditOptions(g.item)
                            : onEditGroup({ label: g.groupLabel, items: resolveGroupItems(menu, g.groupLabel) })
                        }
                        className="rounded-full bg-leaf/10 px-3 py-1.5 text-xs font-bold text-leaf-dark active:scale-95"
                      >
                        Edit
                      </button>
                    </div>
                  </li>
                  );
                })}
              </ul>

              <div className="flex flex-col gap-2.5 border-t border-dashed border-ink/10 py-4">
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nama kamu"
                  className="w-full rounded-2xl border border-ink/10 bg-cream/40 px-4 py-3 text-base text-ink placeholder:text-ink-soft/70 focus:border-leaf focus:outline-none"
                />
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Catatan untuk penjual (opsional): alamat, dll."
                  rows={2}
                  className="w-full resize-none rounded-2xl border border-ink/10 bg-cream/40 px-4 py-3 text-base text-ink placeholder:text-ink-soft/70 focus:border-leaf focus:outline-none"
                />
                {error && <p className="text-sm font-medium text-terracotta">{error}</p>}
              </div>
            </div>

            {/* Footer checkout — selalu terlihat, gaya e-commerce (Total + tombol bayar) */}
            <div className="shrink-0 border-t border-ink/5 bg-surface px-5 pb-5 pt-3">
              {storeClosed && (
                <p className="mb-3 rounded-xl bg-terracotta/10 px-3 py-2 text-center text-sm font-medium text-terracotta">
                  Warung baru saja tutup — checkout belum bisa dilakukan sekarang.
                </p>
              )}

              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-ink-soft">
                  Total {hasUnpriced && hasPriced ? '(sebagian)' : ''}
                </span>
                <span className="font-display text-xl font-bold text-terracotta">
                  {hasPriced ? formatRupiah(total) : 'Dikonfirmasi via WA'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleOrder}
                disabled={storeClosed}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-whatsapp py-4 text-[15px] font-bold text-white shadow-lg shadow-whatsapp/30 transition active:scale-[0.98] disabled:bg-ink-soft disabled:shadow-none disabled:active:scale-100"
              >
                <WhatsAppIcon />
                {storeClosed ? 'Warung Sedang Tutup' : 'Checkout via WhatsApp'}
              </button>
              <button
                type="button"
                onClick={onClear}
                className="mt-2 w-full py-1.5 text-center text-sm font-medium text-ink-soft underline underline-offset-2"
              >
                Kosongkan keranjang
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.39 1.26 4.81L2 22l5.42-1.34a9.9 9.9 0 0 0 4.62 1.15h.01c5.46 0 9.9-4.45 9.9-9.91S17.5 2 12.04 2Zm5.79 14.02c-.24.68-1.4 1.3-1.93 1.36-.5.06-1.12.08-1.8-.11-.42-.12-.95-.3-1.64-.6-2.89-1.25-4.78-4.16-4.93-4.35-.14-.19-1.18-1.57-1.18-3 0-1.42.75-2.12 1.02-2.41.26-.29.57-.36.76-.36.19 0 .38 0 .55.01.18.01.41-.07.64.49.24.58.81 2 .88 2.14.07.14.12.31.02.5-.1.19-.15.31-.29.48-.14.17-.3.37-.43.5-.14.14-.29.29-.12.57.17.29.75 1.24 1.61 2 1.11.99 2.04 1.29 2.33 1.44.29.14.46.12.63-.07.17-.19.72-.84.91-1.13.19-.29.38-.24.63-.14.26.1 1.65.78 1.93.92.29.14.48.22.55.34.07.13.07.71-.17 1.39Z" />
    </svg>
  );
}
