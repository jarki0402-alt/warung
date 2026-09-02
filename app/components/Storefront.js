'use client';

import { useMemo, useState } from 'react';
import { formatRupiah, slugify } from '@/lib/format';
import { CATEGORY_ORDER, SUBKATEGORI_FOTO } from '@/lib/seed';
import { normalizePhone } from '@/lib/whatsapp';
import MenuCard from './MenuCard';
import GroupCard from './GroupCard';
import CartDrawer from './CartDrawer';
import ItemOptionsSheet from './ItemOptionsSheet';
import GroupedItemsSheet from './GroupedItemsSheet';

// Kunci baris keranjang: item tanpa opsi = idnya sendiri; item dengan kombinasi opsi
// berbeda (mis. Pecel Pedas vs Pecel Tidak Pedas, atau Soto Kuah Pisah+Sambal Campur+Pedas)
// jadi baris terpisah supaya tiap kombinasi bisa diatur qty-nya sendiri-sendiri.
function serializeOpsi(chosenOpsi) {
  if (!chosenOpsi) return '';
  const entries = Object.entries(chosenOpsi).sort(([a], [b]) => a.localeCompare(b));
  return entries.map(([k, v]) => `${k}=${v}`).join('|');
}
function lineKey(id, chosenOpsi) {
  const s = serializeOpsi(chosenOpsi);
  return s ? `${id}::${s}` : id;
}

export default function Storefront({ menu, settings }) {
  const [cart, setCart] = useState({}); // { [lineKey]: { id, chosenOpsi, qty, note } }
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [optionsPrompt, setOptionsPrompt] = useState(null); // item lagi diatur opsinya (ItemOptionsSheet)
  const [groupPrompt, setGroupPrompt] = useState(null); // { label, items } lagi dipilih (GroupedItemsSheet)

  const storeClosed = settings.status === 'tutup';

  const categories = useMemo(() => {
    const present = [...new Set(menu.map((item) => item.kategori))];
    const ordered = CATEGORY_ORDER.filter((c) => present.includes(c));
    const extra = present.filter((c) => !CATEGORY_ORDER.includes(c));
    return [...ordered, ...extra];
  }, [menu]);

  // Kelompokkan tiap kategori menjadi: item tanpa sub-kategori, lalu grup per sub-kategori
  // (urut sesuai kemunculan pertama di data). Grup sub-kategori tampil sebagai SATU kartu
  // (GroupCard) yang membuka daftar pilihan, bukan kartu per item.
  const sectionsByCategory = useMemo(() => {
    const map = {};
    for (const cat of categories) {
      const items = menu.filter((item) => item.kategori === cat);
      const direct = items.filter((item) => !item.subKategori);
      const subOrder = [];
      for (const item of items) {
        if (item.subKategori && !subOrder.includes(item.subKategori)) subOrder.push(item.subKategori);
      }
      const subs = subOrder.map((sub) => ({
        nama: sub,
        items: items.filter((i) => i.subKategori === sub),
        foto: SUBKATEGORI_FOTO[sub],
      }));
      map[cat] = { direct, subs };
    }
    return map;
  }, [categories, menu]);

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, entry]) => entry.qty > 0)
        .map(([key, entry]) => ({
          ...menu.find((m) => m.id === entry.id),
          qty: entry.qty,
          chosenOpsi: entry.chosenOpsi,
          note: entry.note || '',
          lineKey: key,
        }))
        .filter((item) => item.id),
    [cart, menu]
  );

  // Agregat per item menu (lintas semua kombinasi opsi) — dipakai kartu menu & sheet
  // untuk tahu total qty & daftar kombinasi (+ catatan per kombinasi) yang sudah dipilih.
  const cartByItemId = useMemo(() => {
    const map = {};
    for (const entry of Object.values(cart)) {
      if (entry.qty <= 0) continue;
      if (!map[entry.id]) map[entry.id] = { totalQty: 0, combos: [] };
      map[entry.id].totalQty += entry.qty;
      map[entry.id].combos.push({ chosenOpsi: entry.chosenOpsi, qty: entry.qty, note: entry.note || '' });
    }
    return map;
  }, [cart]);

  const qtyByItemId = useMemo(
    () => Object.fromEntries(Object.entries(cartByItemId).map(([id, v]) => [id, v.totalQty])),
    [cartByItemId]
  );

  const totalItems = cartItems.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.harga != null ? item.harga * item.qty : 0), 0);
  const hasPricedInCart = cartItems.some((item) => item.harga != null);

  function addLine(id, chosenOpsi = null) {
    setCart((prev) => {
      const key = lineKey(id, chosenOpsi);
      const existing = prev[key];
      return { ...prev, [key]: { id, chosenOpsi, note: existing?.note || '', qty: (existing?.qty || 0) + 1 } };
    });
  }

  function removeLine(id, chosenOpsi = null) {
    setCart((prev) => {
      const key = lineKey(id, chosenOpsi);
      const existing = prev[key];
      if (!existing) return prev;
      const nextQty = Math.max(0, existing.qty - 1);
      const next = { ...prev };
      if (nextQty === 0) delete next[key];
      else next[key] = { ...existing, qty: nextQty };
      return next;
    });
  }

  // Catatan nempel ke baris kombinasi opsi tertentu (mis. hanya varian "Pedas"nya Pecel),
  // bukan ke seluruh item menu — supaya "2 Pecel: 1 pedas tanpa lontong, 1 sedang tanpa catatan" bisa.
  function setLineNote(id, chosenOpsi, note) {
    setCart((prev) => {
      const key = lineKey(id, chosenOpsi);
      if (!prev[key]) return prev;
      return { ...prev, [key]: { ...prev[key], note } };
    });
  }

  function handleRequestAdd(item) {
    if (item.opsi && item.opsi.length > 0) {
      setOptionsPrompt(item);
    } else {
      addLine(item.id);
    }
  }

  function clearCart() {
    setCart({});
    setDrawerOpen(false);
  }

  function scrollToCategory(cat) {
    document.getElementById(`kategori-${slugify(cat)}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const waLink = `https://wa.me/${normalizePhone(settings.nomorWhatsApp)}`;

  return (
    <div className="min-h-dvh" style={{ paddingBottom: totalItems > 0 ? 'calc(90px + env(safe-area-inset-bottom))' : '1rem' }}>
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-ink/5 bg-cream/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3 md:py-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-2.5 md:gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-leaf text-lg text-white md:h-12 md:w-12 md:text-xl">
              🥗
            </span>
            <div className="min-w-0">
              <h1 className="truncate font-display text-[15px] font-bold leading-tight text-ink sm:text-base md:text-lg">
                {settings.namaWarung}
              </h1>
              <span
                className={`inline-flex items-center gap-1 truncate text-xs font-semibold md:text-sm ${
                  storeClosed ? 'text-terracotta' : 'text-leaf'
                }`}
              >
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${storeClosed ? 'bg-terracotta' : 'bg-leaf'}`} />
                {storeClosed ? 'Tutup' : 'Buka'}
                {settings.jamOperasional ? ` · ${settings.jamOperasional}` : ''}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 md:gap-3">
            <a
              href={waLink}
              aria-label="Hubungi via WhatsApp"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-whatsapp text-white shadow-sm active:scale-95 md:h-12 md:w-12"
            >
              <WhatsAppIcon />
            </a>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Buka keranjang"
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white shadow-sm active:scale-95 md:h-12 md:w-12"
            >
              <CartIcon />
              {totalItems > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gold px-1 text-[11px] font-bold text-ink">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Category chips */}
        <div className="no-scrollbar mx-auto flex max-w-4xl gap-2 overflow-x-auto px-3 pb-2.5 sm:px-4 sm:pb-3 md:gap-3 md:pb-4">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => scrollToCategory(cat)}
              className="shrink-0 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-ink-soft shadow-sm ring-1 ring-black/5 transition active:scale-95 md:px-5 md:py-2.5 md:text-sm"
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-leaf px-3 py-7 text-cream sm:px-4 sm:py-8 md:py-10">
        <div className="pattern-dots pointer-events-none absolute inset-0 text-white/10" />
        <div className="relative mx-auto max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold">Warung Rumahan</p>
          <h2 className="mt-1 font-display text-xl font-extrabold leading-tight sm:text-2xl md:text-3xl">
            Selamat Datang! 👋
          </h2>
          {settings.tagline && <p className="mt-2 max-w-md text-sm text-cream/85">{settings.tagline}</p>}
          {settings.alamat && (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-cream/75">📍 {settings.alamat}</p>
          )}
        </div>
      </section>

      {storeClosed && (
        <div className="mx-3 mt-4 max-w-4xl rounded-2xl bg-terracotta/10 px-4 py-3 text-center text-sm font-medium text-terracotta sm:mx-auto">
          Warung sedang tutup{settings.jamOperasional ? ` · buka lagi ${settings.jamOperasional}` : ''}. Kamu tetap
          bisa lihat-lihat menu ya!
        </div>
      )}

      {/* Menu sections */}
      <main className="mx-auto mt-5 max-w-4xl px-3 sm:px-4">
        {(() => {
          // Hanya foto kartu pertama yang benar-benar terlihat begitu halaman dibuka
          // (di atas fold) yang dimuat prioritas tinggi — sisanya tetap lazy-load
          // supaya hemat data di koneksi lambat.
          let firstCardRendered = false;
          return categories.map((cat) => {
          const { direct, subs } = sectionsByCategory[cat] || { direct: [], subs: [] };
          if (direct.length === 0 && subs.length === 0) return null;
          return (
            <section key={cat} id={`kategori-${slugify(cat)}`} className="mb-8 scroll-mt-32">
              <h3 className="mb-3 font-display text-lg font-bold text-ink">{cat}</h3>

              <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
                {direct.map((item) => {
                  const isFirstCard = !firstCardRendered;
                  if (isFirstCard) firstCardRendered = true;
                  return (
                    <MenuCard
                      key={item.id}
                      item={item}
                      totalQty={cartByItemId[item.id]?.totalQty || 0}
                      combos={cartByItemId[item.id]?.combos || []}
                      onRequestAdd={handleRequestAdd}
                      onAdd={addLine}
                      onRemove={removeLine}
                      storeClosed={storeClosed}
                      priority={isFirstCard}
                    />
                  );
                })}

                {subs.map((sub) => (
                  <GroupCard
                    key={sub.nama}
                    label={sub.nama}
                    items={sub.items}
                    foto={sub.foto}
                    totalQty={sub.items.reduce((sum, i) => sum + (qtyByItemId[i.id] || 0), 0)}
                    onOpen={() => setGroupPrompt({ label: sub.nama, items: sub.items })}
                    storeClosed={storeClosed}
                  />
                ))}
              </div>
            </section>
          );
        });
        })()}

        {menu.length === 0 && (
          <p className="py-16 text-center text-sm text-ink-soft">Menu belum ditambahkan. Cek lagi nanti ya!</p>
        )}
      </main>

      <footer className="mx-auto max-w-4xl px-4 pb-6 pt-4 text-center text-xs text-ink-soft/70">
        Dibuat dengan ❤️ untuk {settings.namaWarung}
      </footer>

      {/* Bottom checkout bar — full-width, gaya aplikasi pesan-antar */}
      {totalItems > 0 && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/5 bg-surface/95 px-3 backdrop-blur-md sm:px-4"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 py-3 active:opacity-80"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-white">
                <CartIcon />
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gold px-1 text-[11px] font-bold text-ink">
                  {totalItems}
                </span>
              </span>
              <span className="truncate text-left">
                <span className="block text-xs text-ink-soft">Total</span>
                <span className="block font-display text-base font-bold text-terracotta">
                  {hasPricedInCart ? formatRupiah(totalPrice) : 'Lihat detail'}
                </span>
              </span>
            </span>
            <span className="shrink-0 rounded-2xl bg-leaf px-5 py-3 text-sm font-bold text-white shadow-md">
              Checkout
            </span>
          </button>
        </div>
      )}

      <CartDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        items={cartItems}
        menu={menu}
        settings={settings}
        onAdd={addLine}
        onRemove={removeLine}
        onClear={clearCart}
        onEditOptions={(item) => setOptionsPrompt(item)}
        onEditGroup={(group) => setGroupPrompt(group)}
      />

      <ItemOptionsSheet
        key={optionsPrompt?.id || 'none'}
        item={optionsPrompt}
        combos={optionsPrompt ? cartByItemId[optionsPrompt.id]?.combos || [] : []}
        onAddCombo={(chosenOpsi) => optionsPrompt && addLine(optionsPrompt.id, chosenOpsi)}
        onRemoveCombo={(chosenOpsi) => optionsPrompt && removeLine(optionsPrompt.id, chosenOpsi)}
        onNoteChange={(chosenOpsi, text) => optionsPrompt && setLineNote(optionsPrompt.id, chosenOpsi, text)}
        onClose={() => setOptionsPrompt(null)}
      />

      <GroupedItemsSheet
        group={groupPrompt}
        qtyByItemId={qtyByItemId}
        onAdd={(id) => addLine(id)}
        onRemove={(id) => removeLine(id)}
        onClose={() => setGroupPrompt(null)}
        storeClosed={storeClosed}
      />
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.39 1.26 4.81L2 22l5.42-1.34a9.9 9.9 0 0 0 4.62 1.15h.01c5.46 0 9.9-4.45 9.9-9.91S17.5 2 12.04 2Zm5.79 14.02c-.24.68-1.4 1.3-1.93 1.36-.5.06-1.12.08-1.8-.11-.42-.12-.95-.3-1.64-.6-2.89-1.25-4.78-4.16-4.93-4.35-.14-.19-1.18-1.57-1.18-3 0-1.42.75-2.12 1.02-2.41.26-.29.57-.36.76-.36.19 0 .38 0 .55.01.18.01.41-.07.64.49.24.58.81 2 .88 2.14.07.14.12.31.02.5-.1.19-.15.31-.29.48-.14.17-.3.37-.43.5-.14.14-.29.29-.12.57.17.29.75 1.24 1.61 2 1.11.99 2.04 1.29 2.33 1.44.29.14.46.12.63-.07.17-.19.72-.84.91-1.13.19-.29.38-.24.63-.14.26.1 1.65.78 1.93.92.29.14.48.22.55.34.07.13.07.71-.17 1.39Z" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 6h15l-1.5 9h-12z" />
      <path d="M6 6 5 3H2" />
      <circle cx="9.5" cy="19.5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="19.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
