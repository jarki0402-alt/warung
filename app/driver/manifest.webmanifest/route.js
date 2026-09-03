import { getSettings } from '@/lib/storage';

// Manifest terpisah dari yang di pelanggan (app/manifest.js) — supaya ikon yang
// dipasang driver ke layar utama HP-nya beda nama/ikon & langsung buka /driver,
// bukan halaman menu pelanggan.
export async function GET() {
  const settings = await getSettings();
  const manifest = {
    id: '/driver',
    name: `${settings.namaWarung} — Driver`,
    short_name: 'Driver Warung',
    description: 'Tandai status lagi mengantar pesanan.',
    start_url: '/driver',
    scope: '/driver',
    display: 'standalone',
    background_color: '#fbf3e5',
    theme_color: '#e7a83c',
    lang: 'id',
    icons: [{ src: '/driver/icon', sizes: '64x64', type: 'image/png' }],
  };

  return new Response(JSON.stringify(manifest), {
    headers: { 'Content-Type': 'application/manifest+json' },
  });
}
