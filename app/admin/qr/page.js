import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import { isValidSessionToken, sessionCookieName } from '@/lib/session';
import { getSettings } from '@/lib/storage';

export const dynamic = 'force-dynamic';

const SITE_URL = 'https://www.warungmbaksepti.biz.id';
const INSTALL_URL = `${SITE_URL}/pasang`;

export default async function AdminQrPage() {
  const cookieStore = await cookies();
  if (!isValidSessionToken('admin', cookieStore.get(sessionCookieName('admin'))?.value)) {
    redirect('/admin/login');
  }

  const settings = await getSettings();
  const qrDataUrl = await QRCode.toDataURL(INSTALL_URL, {
    width: 640,
    margin: 2,
    color: { dark: '#2b2118', light: '#fffdf9' },
  });

  return (
    <div className="min-h-dvh bg-cream px-4 py-8">
      <div className="mx-auto flex max-w-md flex-col items-center gap-5 text-center">
        <div>
          <Link href="/admin" className="text-xs font-semibold text-ink-soft underline underline-offset-2">
            ← Kembali ke Admin
          </Link>
          <h1 className="mt-2 font-display text-lg font-bold text-ink">QR Kode — Pasang Aplikasi</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Cetak & tempel di meja/warung. Pelanggan scan pakai kamera HP, langsung diarahkan ke halaman pasang
            otomatis (beda instruksi buat Android & iPhone).
          </p>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element -- data URL, bukan aset yang perlu dioptimasi next/image */}
        <img src={qrDataUrl} alt="QR code pasang aplikasi" className="w-full max-w-xs rounded-2xl bg-white p-4 shadow-lg" />

        <p className="break-all rounded-xl bg-white px-4 py-2.5 text-xs text-ink-soft shadow-sm ring-1 ring-black/5">
          {INSTALL_URL}
        </p>

        <p className="text-xs text-ink-soft">
          {settings.namaWarung} · Klik kanan gambar QR di atas → Simpan Gambar, lalu cetak.
        </p>
      </div>
    </div>
  );
}
