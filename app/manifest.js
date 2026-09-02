import { getSettings } from '@/lib/storage';

export default async function manifest() {
  const settings = await getSettings();
  return {
    name: settings.namaWarung,
    short_name: settings.namaWarung,
    description: settings.tagline || 'Pesan makanan warung favoritmu, langsung terkirim ke WhatsApp.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fbf3e5',
    theme_color: '#2e5e39',
    lang: 'id',
    icons: [{ src: '/icon', sizes: '64x64', type: 'image/png' }],
  };
}
