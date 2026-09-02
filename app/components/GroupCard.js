'use client';

import Image from 'next/image';
import { PlusIcon } from './icons';

export default function GroupCard({ label, items, foto, totalQty, onOpen, storeClosed }) {
  const disabled = storeClosed || items.every((i) => !i.tersedia);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative flex flex-col overflow-visible rounded-2xl bg-surface text-left shadow-[0_2px_10px_rgba(43,33,24,0.06)] ring-1 ring-black/5 active:scale-[0.98]"
    >
      <div className="relative">
        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-t-2xl bg-gradient-to-br from-leaf/10 via-gold/10 to-terracotta/10">
          {foto ? (
            <Image src={foto} alt={label} fill sizes="(max-width: 480px) 45vw, (max-width: 768px) 30vw, 220px" className="object-cover" />
          ) : (
            <span className="text-5xl sm:text-6xl" aria-hidden="true">
              🍽️
            </span>
          )}
        </div>

        {/* Sembunyikan total kalau belum ada yang ditambahkan & tidak bisa dipesan (habis/tutup) —
            selaras dengan MenuCard. Tetap tampilkan jumlah kalau sudah ada di keranjang. */}
        {(totalQty > 0 || !disabled) && (
          <span
            className={`absolute -bottom-3.5 right-2 flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white shadow-md ring-4 ring-cream ${
              disabled ? 'bg-ink-soft' : 'bg-leaf'
            }`}
          >
            {totalQty > 0 ? totalQty : <PlusIcon size={18} />}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 px-3 pb-3 pt-4">
        <h3 className="font-display text-[15px] font-semibold leading-tight text-ink line-clamp-1">{label}</h3>
        <p className="text-[12.5px] leading-snug text-ink-soft">{items.length} jenis pilihan · ketuk untuk pilih</p>
      </div>
    </button>
  );
}
