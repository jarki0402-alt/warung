'use client';

import { useState, useTransition } from 'react';
import { addMenuItemAction, updateMenuItemAction } from '@/lib/actions';

const QUICK_ICONS = ['🍽️', '🥗', '🍲', '🍜', '🍢', '🍌', '🍧', '🥘', '🍛', '🧆', '🥟', '🍡'];

function opsiToFormState(opsi) {
  if (!Array.isArray(opsi) || opsi.length === 0) return [];
  return opsi.map((g) => ({ nama: g.nama, pilihan: (g.pilihan || []).join(', ') }));
}

export default function MenuItemModal({ onClose, initialData, categories, subCategories }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [icon, setIcon] = useState(initialData?.icon || '🍽️');
  const [opsiGroups, setOpsiGroups] = useState(() => opsiToFormState(initialData?.opsi));

  const isEdit = Boolean(initialData);

  function addOpsiGroup() {
    setOpsiGroups((prev) => [...prev, { nama: '', pilihan: '' }]);
  }

  function updateOpsiGroup(index, field, value) {
    setOpsiGroups((prev) => prev.map((g, i) => (i === index ? { ...g, [field]: value } : g)));
  }

  function removeOpsiGroup(index) {
    setOpsiGroups((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);
    formData.set('icon', icon);

    const opsi = opsiGroups
      .map((g) => ({ nama: g.nama.trim(), pilihan: g.pilihan.split(',').map((p) => p.trim()).filter(Boolean) }))
      .filter((g) => g.nama && g.pilihan.length > 0);
    formData.set('opsiJson', JSON.stringify(opsi));

    if (isEdit) {
      formData.set('id', initialData.id);
    }

    startTransition(async () => {
      try {
        const result = isEdit ? await updateMenuItemAction(formData) : await addMenuItemAction(formData);

        if (result?.error) {
          setError(result.error);
          return;
        }
        onClose();
      } catch {
        setError('Sesi admin berakhir. Silakan muat ulang halaman dan masuk lagi.');
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Tutup"
        onClick={onClose}
        className="absolute inset-0 bg-ink/40 backdrop-blur-[1px] animate-fade-in"
      />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-surface p-5 shadow-2xl animate-slide-up sm:rounded-3xl"
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-ink/10 sm:hidden" />
        <h2 className="mb-4 font-display text-lg font-bold text-ink">
          {isEdit ? 'Edit Menu' : 'Tambah Menu Baru'}
        </h2>

        <div className="flex flex-col gap-3.5">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-soft">Ikon</label>
            <div className="flex flex-wrap gap-2">
              {QUICK_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg ring-1 transition ${
                    icon === ic ? 'bg-leaf/15 ring-leaf' : 'bg-cream ring-black/5'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <Field label="Nama Menu">
            <input
              name="nama"
              required
              defaultValue={initialData?.nama}
              className="input"
              placeholder="Contoh: Pecel"
            />
          </Field>

          <Field label="Kategori">
            <input
              name="kategori"
              required
              list="kategori-list"
              defaultValue={initialData?.kategori}
              className="input"
              placeholder="Contoh: Makanan Berat"
            />
            <datalist id="kategori-list">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>

          <Field label="Sub-kategori (opsional)">
            <input
              name="subKategori"
              list="subkategori-list"
              defaultValue={initialData?.subKategori || ''}
              className="input"
              placeholder="Contoh: Es Seduh / Saset"
            />
            <datalist id="subkategori-list">
              {subCategories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>

          <Field label="Harga (opsional)">
            <input
              name="harga"
              type="number"
              min="0"
              step="500"
              defaultValue={initialData?.harga ?? ''}
              className="input"
              placeholder="Kosongkan kalau belum mau tampilkan harga"
            />
            <p className="mt-1 text-[11px] text-ink-soft">
              Tanpa harga, pelanggan tetap bisa pesan — total dikonfirmasi lewat WhatsApp.
            </p>
          </Field>

          <Field label="Deskripsi (opsional)">
            <textarea
              name="deskripsi"
              rows={2}
              defaultValue={initialData?.deskripsi}
              className="input resize-none"
              placeholder="Sayuran rebus segar dengan sambal kacang..."
            />
          </Field>

          <Field label="URL Foto (opsional)">
            <input
              name="foto"
              defaultValue={initialData?.foto || ''}
              className="input"
              placeholder="/images/menu/pecel.jpg"
            />
            <p className="mt-1 text-[11px] text-ink-soft">
              Kosongkan dulu kalau belum ada foto — bisa isi path setelah foto ditambahkan ke folder{' '}
              <code className="rounded bg-ink/5 px-1">public/images/menu</code>.
            </p>
          </Field>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-soft">
              Opsi sebelum masuk keranjang (opsional)
            </label>
            <p className="mb-2 text-[11px] text-ink-soft">
              Mis. grup <strong>Level Pedas</strong> dengan pilihan{' '}
              <code className="rounded bg-ink/5 px-1">Tidak Pedas, Sedang, Pedas</code>. Bisa tambah lebih dari satu
              grup (mis. Kuah, Sambal, Level Pedas untuk Soto).
            </p>
            <div className="flex flex-col gap-2.5">
              {opsiGroups.map((g, i) => (
                <div key={i} className="flex flex-col gap-1.5 rounded-2xl bg-cream/60 p-3">
                  <div className="flex items-center gap-2">
                    <input
                      value={g.nama}
                      onChange={(e) => updateOpsiGroup(i, 'nama', e.target.value)}
                      placeholder="Nama grup, mis. Level Pedas"
                      className="input flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => removeOpsiGroup(i)}
                      aria-label="Hapus grup opsi"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-terracotta/10 text-terracotta"
                    >
                      🗑
                    </button>
                  </div>
                  <input
                    value={g.pilihan}
                    onChange={(e) => updateOpsiGroup(i, 'pilihan', e.target.value)}
                    placeholder="Pilihan dipisah koma, mis. Tidak Pedas, Sedang, Pedas"
                    className="input"
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addOpsiGroup}
              className="mt-2 rounded-full bg-ink/5 px-3.5 py-1.5 text-xs font-semibold text-ink-soft"
            >
              + Tambah Grup Opsi
            </button>
          </div>

          {isEdit && (
            <label className="flex items-center gap-2 text-sm font-medium text-ink">
              <input type="checkbox" name="tersedia" defaultChecked={initialData?.tersedia ?? true} className="h-4 w-4 accent-leaf" />
              Tersedia (tampil bisa dipesan)
            </label>
          )}
        </div>

        {error && <p className="mt-3 rounded-xl bg-terracotta/10 px-3 py-2 text-xs font-medium text-terracotta">{error}</p>}

        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl bg-ink/5 py-3 text-sm font-semibold text-ink-soft"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-2xl bg-leaf py-3 text-sm font-bold text-white shadow-lg shadow-leaf/20 disabled:opacity-60"
          >
            {isPending ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
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
