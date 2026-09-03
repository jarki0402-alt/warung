import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { isValidSessionToken, sessionCookieName } from '@/lib/session';
import { getSettings } from '@/lib/storage';
import InstallGuide from '@/app/pasang/InstallGuide';

export const dynamic = 'force-dynamic';

export default async function AdminPasangPage() {
  const cookieStore = await cookies();
  if (!isValidSessionToken('admin', cookieStore.get(sessionCookieName('admin'))?.value)) {
    redirect('/admin/login');
  }

  const settings = await getSettings();

  return (
    <div className="flex min-h-dvh flex-col items-center bg-cream px-5 py-10">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-ink text-3xl text-white shadow-lg shadow-ink/20">
          🧾
        </span>
        <h1 className="font-display text-xl font-bold text-ink">{settings.namaWarung} — Admin</h1>
        <p className="max-w-xs text-sm text-ink-soft">
          Pasang halaman Admin di layar utama HP kamu — sekali pasang, besok-besok tinggal buka dari ikon, langsung
          masuk ke sini.
        </p>
      </div>

      <div className="w-full max-w-sm">
        <InstallGuide namaWarung={`${settings.namaWarung} — Admin`} />
      </div>

      <Link
        href="/admin"
        className="mt-8 rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-ink-soft shadow-sm ring-1 ring-black/5"
      >
        ← Kembali ke Admin
      </Link>
    </div>
  );
}
