'use client';

import { useMemo, useOptimistic, useState, useTransition } from 'react';
import Link from 'next/link';
import { formatRupiah } from '@/lib/format';
import {
  deleteMenuItemAction,
  logoutAction,
  toggleAvailabilityAction,
  toggleIstirahatAction,
  toggleStoreStatusAction,
  updateSettingsAction,
} from '@/lib/actions';
import { HARI_OPTIONS } from '@/lib/seed';
import { getJakartaDayName, getStoreStatus } from '@/lib/storeStatus';
import useLockBodyScroll from '../components/useLockBodyScroll';
import { DownloadIcon } from '../components/icons';
import MenuItemModal from './MenuItemModal';

export default function AdminDashboard({ menu, settings }) {
  const [tab, setTab] = useState('menu');
  const [modal, setModal] = useState({ open: false, item: null });
  const [deleteConfirm, setDeleteConfirm] = useState(null); // item yang mau dihapus, nunggu konfirmasi
  useLockBodyScroll(Boolean(deleteConfirm));
  const [, startTransition] = useTransition();
  const [statusPending, startStatusTransition] = useTransition();
  const [istirahatPending, startIstirahatTransition] = useTransition();

  // Update tampilan LANGSUNG saat tombol diklik (gak nunggu round-trip server dulu),
  // baru disinkronkan ke data asli begitu server-nya selesai. Ini yang bikin toggle
  // "Habis/Tersedia" dan "Buka/Tutup" kerasa instan walau prosesnya di background.
  const [optimisticMenu, setOptimisticMenu] = useOptimistic(menu, (state, action) => {
    if (action.type === 'toggle') {
      return state.map((item) => (item.id === action.id ? { ...item, tersedia: action.tersedia } : item));
    }
    if (action.type === 'delete') {
      return state.filter((item) => item.id !== action.id);
    }
    return state;
  });
  const [optimisticSettings, setOptimisticSettings] = useOptimistic(settings, (state, patch) => ({
    ...state,
    ...patch,
  }));

  // Status yang beneran dilihat pelanggan (ikut jadwal jam buka/tutup), bukan cuma
  // field settings.status mentah — supaya admin lihat status yang sama persis.
  const effectiveStatus = getStoreStatus(optimisticSettings);
  const isForcedClosed = optimisticSettings.status === 'tutup';

  const categories = useMemo(() => [...new Set(menu.map((i) => i.kategori))].sort(), [menu]);
  const subCategories = useMemo(
    () => [...new Set(menu.map((i) => i.subKategori).filter(Boolean))].sort(),
    [menu]
  );

  function handleDelete(item) {
    setDeleteConfirm(item);
  }

  function confirmDelete() {
    const item = deleteConfirm;
    setDeleteConfirm(null);
    startTransition(async () => {
      setOptimisticMenu({ type: 'delete', id: item.id });
      const fd = new FormData();
      fd.set('id', item.id);
      const result = await deleteMenuItemAction(fd);
      if (result?.error) alert(result.error);
    });
  }

  function handleToggleAvailability(item) {
    startTransition(async () => {
      setOptimisticMenu({ type: 'toggle', id: item.id, tersedia: !item.tersedia });
      const result = await toggleAvailabilityAction(item.id, !item.tersedia);
      if (result?.error) alert(result.error);
    });
  }

  function handleToggleStatus() {
    const next = settings.status === 'tutup' ? 'buka' : 'tutup';
    startStatusTransition(async () => {
      setOptimisticSettings({ status: next });
      const result = await toggleStoreStatusAction(next);
      if (result?.error) alert(result.error);
    });
  }

  function handleToggleIstirahat() {
    const next = !settings.istirahat;
    startIstirahatTransition(async () => {
      setOptimisticSettings({ istirahat: next });
      const result = await toggleIstirahatAction(next);
      if (result?.error) alert(result.error);
    });
  }

  return (
    <div className="min-h-dvh bg-cream pb-16">
      <header
        className="sticky top-0 z-20 transform-gpu border-b border-ink/5 bg-cream/90 backdrop-blur-md will-change-transform"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="mx-auto max-w-3xl px-4 py-3.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Admin</p>
              <h1 className="font-display text-base font-bold text-ink">{settings.namaWarung}</h1>
            </div>
            <button
              type="button"
              onClick={() => logoutAction()}
              className="shrink-0 rounded-full bg-ink/5 px-3.5 py-2 text-xs font-semibold text-ink-soft"
            >
              Keluar
            </button>
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <Link
              href="/admin/pasang"
              className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-ink-soft shadow-sm ring-1 ring-black/5"
            >
              <DownloadIcon size={14} />
              Pasang
            </Link>
            <Link
              href="/admin/qr"
              className="rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-ink-soft shadow-sm ring-1 ring-black/5"
            >
              QR Pasang
            </Link>
            <Link
              href="/"
              target="_blank"
              className="rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-ink-soft shadow-sm ring-1 ring-black/5"
            >
              Lihat Web →
            </Link>
          </div>
        </div>

        <div className="mx-auto flex max-w-3xl gap-1 px-4 pb-3">
          {[
            ['menu', 'Menu'],
            ['pengaturan', 'Pengaturan'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                tab === key ? 'bg-leaf text-white' : 'bg-white text-ink-soft ring-1 ring-black/5'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-5">
        {/* Status warung: tutup penuh, istirahat sejenak, & info libur mingguan */}
        <div className="mb-5 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleToggleStatus}
            disabled={statusPending}
            className={`flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-semibold shadow-sm transition ${
              effectiveStatus.closed ? 'bg-terracotta/10 text-terracotta' : 'bg-leaf/10 text-leaf-dark'
            }`}
          >
            <span>
              Status warung: <strong>{effectiveStatus.closed ? 'Tutup' : 'Buka'}</strong>
              {isForcedClosed && <span className="ml-1.5 font-normal opacity-70">(ditutup manual)</span>}
              {!isForcedClosed && effectiveStatus.reason === 'di-luar-jam' && (
                <span className="ml-1.5 font-normal opacity-70">(di luar jam operasional)</span>
              )}
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-xs shadow-sm">
              {isForcedClosed ? 'Aktifkan Jadwal Otomatis' : 'Tutup Sekarang'}
            </span>
          </button>
          {!isForcedClosed && (
            <p className="px-1 text-xs text-ink-soft">
              Otomatis buka {settings.jamBuka || '-'} sampai {settings.jamTutup || '-'}. Pakai tombol di atas cuma
              kalau mau tutup mendadak di luar jadwal itu.
            </p>
          )}

          {/* Istirahat — tutup sejenak (sholat/istirahat), beda dari tutup penuh. Cuma
              relevan kalau warung lagi "Buka" — kalau sudah tutup penuh, gak perlu ini. */}
          {optimisticSettings.status !== 'tutup' && (
            <button
              type="button"
              onClick={handleToggleIstirahat}
              disabled={istirahatPending}
              className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold shadow-sm transition ${
                optimisticSettings.istirahat ? 'bg-gold/15 text-terracotta-dark' : 'bg-white text-ink-soft ring-1 ring-black/5'
              }`}
            >
              <span>{optimisticSettings.istirahat ? 'Sedang istirahat sebentar 🙏' : 'Lagi sholat/istirahat sebentar?'}</span>
              <span className="rounded-full bg-white px-3 py-1 text-xs shadow-sm ring-1 ring-black/5">
                {optimisticSettings.istirahat ? 'Sudah Balik' : 'Istirahat Dulu'}
              </span>
            </button>
          )}

          {settings.hariLibur && getJakartaDayName() === settings.hariLibur && (
            <p className="rounded-xl bg-ink/5 px-3.5 py-2 text-xs text-ink-soft">
              Hari ini {settings.hariLibur} — warung otomatis tampil tutup buat pelanggan (libur mingguan).
            </p>
          )}

          {/* Info-only — status ini dikontrol dari /driver oleh yang nganter, bukan dari sini */}
          {settings.sedangMengantar && (
            <p className="rounded-xl bg-gold/15 px-3.5 py-2 text-xs font-medium text-terracotta-dark">
              🛵 Lagi ada yang nganter pesanan sekarang.
            </p>
          )}
        </div>

        {tab === 'menu' ? (
          <MenuTab
            menu={optimisticMenu}
            categories={categories}
            onAdd={() => setModal({ open: true, item: null })}
            onEdit={(item) => setModal({ open: true, item })}
            onDelete={handleDelete}
            onToggle={handleToggleAvailability}
          />
        ) : (
          <SettingsTab settings={settings} />
        )}
      </main>

      {modal.open && (
        <MenuItemModal
          onClose={() => setModal({ open: false, item: null })}
          initialData={modal.item}
          categories={categories}
          subCategories={subCategories}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
          <button
            type="button"
            aria-label="Batal"
            onClick={() => setDeleteConfirm(null)}
            className="absolute inset-0 bg-ink/40 backdrop-blur-[1px] animate-fade-in"
          />
          <div className="relative z-10 w-full max-w-sm rounded-t-3xl bg-surface p-5 pb-6 shadow-2xl animate-slide-up sm:rounded-3xl">
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-ink/10 sm:hidden" />
            <p className="font-display text-lg font-bold text-ink">Hapus menu ini?</p>
            <p className="mt-1.5 text-sm text-ink-soft">
              &quot;{deleteConfirm.nama}&quot; akan dihapus permanen dari menu. Tindakan ini tidak bisa dibatalkan.
            </p>
            <div className="mt-5 flex gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-2xl bg-ink/5 py-3 text-sm font-semibold text-ink-soft active:scale-[0.98]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 rounded-2xl bg-terracotta py-3 text-sm font-bold text-white shadow-lg shadow-terracotta/20 active:scale-[0.98]"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuTab({ menu, categories, onAdd, onEdit, onDelete, onToggle }) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-base font-bold text-ink">Daftar Menu ({menu.length})</h2>
        <button
          type="button"
          onClick={onAdd}
          className="rounded-full bg-leaf px-4 py-2 text-xs font-bold text-white shadow-sm active:scale-95"
        >
          + Tambah Menu
        </button>
      </div>

      {menu.length === 0 && (
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-ink-soft shadow-sm">
          Belum ada menu. Klik &quot;+ Tambah Menu&quot; untuk mulai.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {categories.map((cat) => {
          const items = menu.filter((i) => i.kategori === cat);
          if (items.length === 0) return null;

          const direct = items.filter((i) => !i.subKategori);
          const subOrder = [];
          for (const i of items) {
            if (i.subKategori && !subOrder.includes(i.subKategori)) subOrder.push(i.subKategori);
          }

          return (
            <div key={cat}>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-soft">{cat}</p>

              {direct.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {direct.map((item) => (
                    <MenuRow key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} onToggle={onToggle} />
                  ))}
                </ul>
              )}

              {subOrder.map((sub) => (
                <div key={sub} className="mt-2.5">
                  <p className="mb-1.5 text-[11px] font-semibold text-ink-soft">↳ {sub}</p>
                  <ul className="flex flex-col gap-2">
                    {items
                      .filter((i) => i.subKategori === sub)
                      .map((item) => (
                        <MenuRow key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} onToggle={onToggle} />
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MenuRow({ item, onEdit, onDelete, onToggle }) {
  return (
    <li className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cream text-xl">
        {item.icon || '🍽️'}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{item.nama}</p>
        <p className="text-xs text-ink-soft">{item.harga != null ? formatRupiah(item.harga) : 'Tanpa harga'}</p>
      </div>

      <button
        type="button"
        onClick={() => onToggle(item)}
        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
          item.tersedia ? 'bg-leaf/10 text-leaf-dark' : 'bg-ink/10 text-ink-soft'
        }`}
      >
        {item.tersedia ? 'Tersedia' : 'Habis'}
      </button>

      <button
        type="button"
        onClick={() => onEdit(item)}
        aria-label={`Edit ${item.nama}`}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream text-ink-soft"
      >
        ✎
      </button>
      <button
        type="button"
        onClick={() => onDelete(item)}
        aria-label={`Hapus ${item.nama}`}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-terracotta/10 text-terracotta"
      >
        🗑
      </button>
    </li>
  );
}

function SettingsTab({ settings }) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    setSaved(false);
    setError('');
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateSettingsAction(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <Field label="Nama Warung">
        <input name="namaWarung" defaultValue={settings.namaWarung} required className="input" />
      </Field>
      <Field label="Tagline">
        <input name="tagline" defaultValue={settings.tagline} className="input" placeholder="Pecel segar setiap hari" />
      </Field>
      <Field label="Meta Description (teks cuplikan di hasil pencarian Google — kosongkan buat pakai Tagline)">
        <textarea
          name="metaDescription"
          rows={2}
          maxLength={200}
          defaultValue={settings.metaDescription}
          className="input resize-none"
          placeholder="Pecel segar dengan sambal gurih yang bikin nambah!..."
        />
      </Field>
      <Field label="Nomor WhatsApp">
        <input
          name="nomorWhatsApp"
          defaultValue={settings.nomorWhatsApp}
          required
          className="input"
          placeholder="6288287006242"
        />
      </Field>
      <Field label="Alamat (opsional)">
        <input name="alamat" defaultValue={settings.alamat} className="input" placeholder="Jl. ..." />
      </Field>
      <Field label="Jam Operasional (warung otomatis buka & tutup sendiri sesuai jam ini)">
        <div className="flex items-center gap-2.5">
          <input type="time" name="jamBuka" defaultValue={settings.jamBuka} required className="input" />
          <span className="text-sm text-ink-soft">sampai</span>
          <input type="time" name="jamTutup" defaultValue={settings.jamTutup} required className="input" />
        </div>
      </Field>
      <Field label="Libur Mingguan (otomatis tutup tiap minggu di hari ini, tanpa perlu di-toggle manual)">
        <select name="hariLibur" defaultValue={settings.hariLibur || ''} className="input">
          <option value="">Tidak ada libur tetap</option>
          {HARI_OPTIONS.map((hari) => (
            <option key={hari} value={hari}>
              {hari}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Hari Layanan Antar (opsi 'Diantar' cuma muncul di checkout pada hari ini)">
        <select name="hariAntar" defaultValue={settings.hariAntar || ''} className="input">
          <option value="">Tidak ada layanan antar</option>
          {HARI_OPTIONS.map((hari) => (
            <option key={hari} value={hari}>
              {hari}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Batas Pesanan Antar per Hari (0 = tanpa batas)">
        <input
          type="number"
          name="batasAntarHarian"
          min="0"
          defaultValue={settings.batasAntarHarian ?? 0}
          className="input"
        />
      </Field>
      <Field label="Catatan Pesanan (ditambahkan otomatis di pesan WhatsApp)">
        <textarea
          name="catatanPesanan"
          rows={2}
          defaultValue={settings.catatanPesanan}
          className="input resize-none"
        />
      </Field>

      <div>
        <label className="mb-1 block text-xs font-semibold text-ink-soft">Status Warung</label>
        <div className="flex gap-2">
          <label className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-ink/10 py-2.5 text-sm font-semibold has-[:checked]:border-leaf has-[:checked]:bg-leaf/10 has-[:checked]:text-leaf-dark">
            <input type="radio" name="status" value="buka" defaultChecked={settings.status !== 'tutup'} className="accent-leaf" />
            Buka
          </label>
          <label className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-ink/10 py-2.5 text-sm font-semibold has-[:checked]:border-terracotta has-[:checked]:bg-terracotta/10 has-[:checked]:text-terracotta">
            <input type="radio" name="status" value="tutup" defaultChecked={settings.status === 'tutup'} className="accent-terracotta" />
            Tutup
          </label>
        </div>
      </div>

      {error && <p className="rounded-xl bg-terracotta/10 px-3 py-2 text-xs font-medium text-terracotta">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 rounded-2xl bg-leaf py-3 text-sm font-bold text-white shadow-lg shadow-leaf/20 disabled:opacity-60"
      >
        {isPending ? 'Menyimpan...' : saved ? 'Tersimpan ✓' : 'Simpan Pengaturan'}
      </button>
    </form>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-ink-soft">{label}</label>
      {children}
    </div>
  );
}
