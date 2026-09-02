'use client';

import { formatRupiah } from '@/lib/format';
import { PlusIcon, MinusIcon } from './icons';
import useLockBodyScroll from './useLockBodyScroll';

export default function GroupedItemsSheet({ group, qtyByItemId, onAdd, onRemove, onClose, storeClosed }) {
  useLockBodyScroll(Boolean(group));

  if (!group) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Tutup"
        onClick={onClose}
        className="absolute inset-0 bg-ink/40 backdrop-blur-[1px] animate-fade-in"
      />

      <div className="relative z-10 flex max-h-[90dvh] w-full max-w-sm flex-col overflow-y-auto rounded-t-3xl bg-surface p-5 pb-6 shadow-2xl animate-slide-up sm:rounded-3xl">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-ink/10 sm:hidden" />

        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="font-display text-lg font-bold text-ink">{group.label}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink/5 text-ink-soft"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          {group.items.map((item) => {
            const qty = qtyByItemId?.[item.id] || 0;
            const disabled = storeClosed || !item.tersedia;
            return (
              <div key={item.id} className="flex items-center gap-3 rounded-2xl bg-cream/60 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-ink">{item.nama}</p>
                  {item.harga != null && <p className="text-xs text-ink-soft">{formatRupiah(item.harga)}</p>}
                  {!item.tersedia && <p className="text-xs font-semibold text-terracotta">Habis</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2 rounded-full bg-white px-1 py-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    disabled={qty === 0}
                    aria-label={`Kurangi ${item.nama}`}
                    className={`flex h-8 w-8 items-center justify-center rounded-full active:scale-95 ${
                      qty === 0 ? 'bg-cream/60 text-ink-soft/50' : 'bg-cream text-ink'
                    }`}
                  >
                    <MinusIcon size={15} />
                  </button>
                  <span className="w-4 text-center text-sm font-bold text-ink">{qty}</span>
                  <button
                    type="button"
                    onClick={() => onAdd(item.id)}
                    disabled={disabled}
                    aria-label={`Tambah ${item.nama}`}
                    className={`flex h-8 w-8 items-center justify-center rounded-full active:scale-95 ${
                      disabled ? 'bg-ink-soft text-white' : 'bg-leaf text-white'
                    }`}
                  >
                    <PlusIcon size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-2xl bg-leaf py-3.5 text-[15px] font-bold text-white shadow-lg shadow-leaf/20 active:scale-[0.98]"
        >
          Selesai
        </button>
      </div>
    </div>
  );
}
