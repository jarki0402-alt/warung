import Link from 'next/link';
import { getSettings } from '@/lib/storage';
import InstallGuide from './InstallGuide';

// Namanya warung jarang berubah, tidak perlu se-real-time halaman menu utama.
export const revalidate = 60;

export default async function PasangPage() {
  const settings = await getSettings();

  return (
    <div className="flex min-h-dvh flex-col items-center bg-cream px-5 py-10">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-leaf text-3xl text-white shadow-lg shadow-leaf/20">
          🥗
        </span>
        <h1 className="font-display text-xl font-bold text-ink">{settings.namaWarung}</h1>
        <p className="max-w-xs text-sm text-ink-soft">
          Pasang di layar utama HP kamu — sekali pasang, besok-besok tinggal buka dari ikon, gak perlu cari-cari lagi.
        </p>
      </div>

      <div className="w-full max-w-sm">
        <InstallGuide namaWarung={settings.namaWarung} />
      </div>

      <Link
        href="/"
        className="mt-8 rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-ink-soft shadow-sm ring-1 ring-black/5"
      >
        Lihat Menu Sekarang →
      </Link>
    </div>
  );
}
