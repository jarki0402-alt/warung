'use client';

import Image from 'next/image';
import { formatRupiah, formatChosenOpsi } from '@/lib/format';
import { PlusIcon, MinusIcon } from './icons';

export default function MenuCard({ item, totalQty, combos, onRequestAdd, onAdd, onRemove, storeClosed, priority = false }) {
  const disabled = storeClosed || !item.tersedia;
  const hasPrice = item.harga != null;
  const hasOpsi = item.opsi && item.opsi.length > 0;
  const opsiSummary = hasOpsi && combos.length > 0 ? combos.map((c) => `${formatChosenOpsi(c.chosenOpsi)} ${c.qty}`).join(' · ') : '';

  return (
    <div className="relative flex flex-col overflow-visible rounded-2xl bg-surface shadow-[0_2px_10px_rgba(43,33,24,0.06)] ring-1 ring-black/5">
      <div className="relative">
        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-t-2xl bg-gradient-to-br from-leaf/10 via-gold/10 to-terracotta/10">
          {item.foto ? (
            <Image
              src={item.foto}
              alt={item.nama}
              fill
              sizes="(max-width: 480px) 45vw, (max-width: 768px) 30vw, 220px"
              className="object-cover"
              priority={priority}
              loading={priority ? undefined : 'lazy'}
            />
          ) : (
            <span className="text-5xl sm:text-6xl" aria-hidden="true">
              {item.icon || '🍽️'}
            </span>
          )}
          {!item.tersedia && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink/50">
              <span className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-cream">Habis</span>
            </div>
          )}
        </div>

        {/* Tombol tambah gaya e-commerce: nempel di sudut kanan-bawah foto, di luar area overflow-hidden supaya tidak terpotong.
            Disembunyikan saat tidak bisa dipesan — badge "Habis"/banner tutup di atas sudah cukup menjelaskan. */}
        {totalQty === 0 && !disabled && (
          <button
            type="button"
            onClick={() => onRequestAdd(item)}
            aria-label={`Tambah ${item.nama}`}
            className="absolute -bottom-3.5 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-leaf text-white shadow-md ring-4 ring-cream transition active:scale-90"
          >
            <PlusIcon size={18} />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 px-3 pb-3 pt-4">
        <h3 className="font-display text-[15px] font-semibold leading-tight text-ink line-clamp-1">{item.nama}</h3>
        {item.deskripsi && (
          <p className="line-clamp-2 text-[12.5px] leading-snug text-ink-soft">{item.deskripsi}</p>
        )}

        {hasPrice && (
          <span className="mt-1 font-display text-[15.5px] font-bold text-terracotta">{formatRupiah(item.harga)}</span>
        )}

        {hasOpsi ? (
          totalQty > 0 && (
            <div className="mt-1.5 flex items-center justify-between gap-1.5">
              <span className="line-clamp-1 flex-1 text-[11px] text-ink-soft">{opsiSummary}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => onRequestAdd(item)}
                  className="shrink-0 rounded-full bg-leaf/10 px-2.5 py-1 text-[11px] font-bold text-leaf-dark active:scale-95"
                >
                  Atur
                </button>
              )}
            </div>
          )
        ) : (
          totalQty > 0 && (
            <div className="mt-1.5 flex items-center justify-end gap-2">
              <div className="flex items-center gap-2 rounded-full bg-leaf/10 px-1 py-1">
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  aria-label={`Kurangi ${item.nama}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-leaf shadow-sm active:scale-95"
                >
                  <MinusIcon size={16} />
                </button>
                <span className="w-4 text-center text-sm font-bold text-leaf-dark">{totalQty}</span>
                <button
                  type="button"
                  onClick={() => onAdd(item.id)}
                  disabled={disabled}
                  aria-label={`Tambah ${item.nama}`}
                  className={`flex h-8 w-8 items-center justify-center rounded-full shadow-sm active:scale-95 ${
                    disabled ? 'bg-ink-soft text-white' : 'bg-leaf text-white'
                  }`}
                >
                  <PlusIcon size={16} />
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
