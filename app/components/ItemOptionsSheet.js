'use client';

import { useState } from 'react';
import Image from 'next/image';
import { formatChosenOpsi } from '@/lib/format';
import { SPICE_LEVEL_COLORS } from '@/lib/seed';
import { PlusIcon, MinusIcon } from './icons';
import useLockBodyScroll from './useLockBodyScroll';

// Catatan: parent me-render komponen ini dengan `key={item?.id}` supaya setiap kali
// item yang diatur berganti, komponen remount total dan state reset secara alami
// (tanpa perlu useEffect untuk sinkronisasi state).
export default function ItemOptionsSheet({ item, combos, onAddCombo, onRemoveCombo, onNoteChange, onClose, storeClosed }) {
  const [selection, setSelection] = useState({});
  useLockBodyScroll(Boolean(item));

  if (!item) return null;

  const isComplete = item.opsi.every((group) => selection[group.nama]);
  const canAdd = isComplete && !storeClosed;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Tutup"
        onClick={onClose}
        className="absolute inset-0 bg-ink/40 backdrop-blur-[1px] animate-fade-in"
      />

      <div className="relative z-10 flex max-h-[90dvh] w-full max-w-sm flex-col overflow-y-auto rounded-t-3xl bg-surface p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl animate-slide-up sm:rounded-3xl">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-ink/10 sm:hidden" />

        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-cream text-2xl">
              {item.foto ? (
                <Image src={item.foto} alt={item.nama} fill sizes="48px" className="object-cover" />
              ) : (
                item.icon || '🍽️'
              )}
            </span>
            <div>
              <p className="text-sm font-medium text-ink-soft">Atur Pesanan</p>
              <p className="font-display text-base font-bold text-ink">{item.nama}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink/5 text-ink-soft"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {item.opsi.map((group) => (
            <div key={group.nama}>
              <p className="mb-2 text-sm font-semibold text-ink">{group.nama}</p>
              <div className="flex flex-wrap gap-2">
                {group.pilihan.map((choice) => {
                  const spice = group.nama === 'Level Pedas' ? SPICE_LEVEL_COLORS[choice] : null;
                  const active = selection[group.nama] === choice;
                  const activeClass = spice
                    ? `${spice.borderActive} ${spice.bgActive} ${spice.text}`
                    : 'border-leaf bg-leaf/10 text-leaf-dark';
                  return (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => setSelection((prev) => ({ ...prev, [group.nama]: choice }))}
                      className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition active:scale-95 ${
                        active ? activeClass : 'border-ink/15 bg-ink/5 text-ink-soft'
                      }`}
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => canAdd && onAddCombo(selection)}
          disabled={!canAdd}
          className="mt-5 w-full rounded-2xl bg-leaf py-3.5 text-[15px] font-bold text-white shadow-lg shadow-leaf/20 active:scale-[0.98] disabled:opacity-40"
        >
          {storeClosed ? 'Warung Sedang Tutup' : isComplete ? '+ Tambahkan' : 'Pilih semua opsi dulu'}
        </button>

        {combos.length > 0 && (
          <div className="mt-5 border-t border-dashed border-ink/10 pt-4">
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">Sudah ditambahkan</p>
            <div className="flex flex-col gap-2">
              {combos.map((combo, i) => (
                <div key={i} className="rounded-2xl bg-cream/60 px-3.5 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-ink">{formatChosenOpsi(combo.chosenOpsi)}</span>
                    <div className="flex items-center gap-2 rounded-full bg-white px-1 py-1 shadow-sm">
                      <button
                        type="button"
                        onClick={() => onRemoveCombo(combo.chosenOpsi)}
                        aria-label="Kurangi"
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-cream text-ink active:scale-95"
                      >
                        <MinusIcon size={14} />
                      </button>
                      <span className="w-4 text-center text-sm font-bold text-ink">{combo.qty}</span>
                      <button
                        type="button"
                        onClick={() => onAddCombo(combo.chosenOpsi)}
                        disabled={storeClosed}
                        aria-label="Tambah"
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-leaf text-white active:scale-95 disabled:bg-ink-soft"
                      >
                        <PlusIcon size={14} />
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={combo.note || ''}
                    onChange={(e) => onNoteChange(combo.chosenOpsi, e.target.value)}
                    placeholder="Catatan untuk pilihan ini, mis. tanpa lontong (opsional)"
                    className="mt-2 w-full rounded-xl border border-ink/10 bg-white px-3 py-2 text-base text-ink placeholder:text-ink-soft/60 focus:border-leaf focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-2xl bg-ink/5 py-3 text-sm font-semibold text-ink-soft"
        >
          Selesai
        </button>
      </div>
    </div>
  );
}
