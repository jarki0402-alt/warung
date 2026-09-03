import { getSettings } from '@/lib/storage';

// Manifest terpisah dari yang di pelanggan (app/manifest.js) — supaya ikon yang
// dipasang admin ke layar utama HP-nya beda nama/ikon & langsung buka /admin,
// bukan halaman menu pelanggan.
export async function GET() {
  const settings = await getSettings();
  const manifest = {
    id: '/admin',
    name: `${settings.namaWarung} — Admin`,
    short_name: 'Admin Warung',
    description: 'Kelola menu, status buka/tutup, dan pengaturan warung.',
    start_url: '/admin',
    scope: '/admin',
    display: 'standalone',
    background_color: '#fbf3e5',
    theme_color: '#2e5e39',
    lang: 'id',
    icons: [{ src: '/admin/icon', sizes: '64x64', type: 'image/png' }],
  };

  return new Response(JSON.stringify(manifest), {
    headers: { 'Content-Type': 'application/manifest+json' },
  });
}
