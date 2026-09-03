import { getSettings } from '@/lib/storage';

export async function generateMetadata() {
  const settings = await getSettings();
  return {
    title: `${settings.namaWarung} — Driver`,
    robots: { index: false, follow: false },
    manifest: '/driver/manifest.webmanifest',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: 'Driver Warung',
    },
  };
}

export default function DriverLayout({ children }) {
  return children;
}
