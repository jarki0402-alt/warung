import { Baloo_2, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { getSettings } from '@/lib/storage';

const display = Baloo_2({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
});

const body = Plus_Jakarta_Sans({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const SITE_URL = 'https://www.warungmbaksepti.biz.id';

export async function generateMetadata() {
  const settings = await getSettings();
  const title = `${settings.namaWarung} — Pecel Gurih & Soto Rumahan`;
  const description =
    settings.metaDescription ||
    settings.tagline ||
    'Pesan makanan warung favoritmu, langsung terkirim ke WhatsApp, ambil sendiri di warung.';

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: { canonical: '/' },
    robots: { index: true, follow: true },
    // Halaman sudah berbahasa Indonesia — cegah Chrome menawarkan auto-translate,
    // karena proses translate-nya mengubah DOM dan memicu warning hydration React.
    other: { google: 'notranslate' },
    openGraph: {
      title,
      description,
      url: '/',
      siteName: settings.namaWarung,
      locale: 'id_ID',
      type: 'website',
      images: ['/opengraph-image'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/opengraph-image'],
    },
    // Supaya "Add to Home Screen" di iPhone (Safari) juga buka tanpa address bar,
    // mirip Android — cuma meta tag, bukan service worker, jadi tidak nambah risiko cache.
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: settings.namaWarung,
    },
  };
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FBF3E7',
  // "cover" = layout boleh gambar sampai ke tepi layar (area notch/home-indicator),
  // dipadu env(safe-area-inset-*) di CSS supaya konten gak ketiban area itu. Tanpa
  // ini, bar checkout yang fixed di bawah bisa kelihatan "melayang"/gak presisi
  // nempel ke tepi layar — terutama pas dibuka standalone dari Add to Home Screen.
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" translate="no" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
