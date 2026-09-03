import { getSettings } from '@/lib/storage';

export async function generateMetadata() {
  const settings = await getSettings();
  return {
    title: `${settings.namaWarung} — Admin`,
    robots: { index: false, follow: false },
    manifest: '/admin/manifest.webmanifest',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: 'Admin Warung',
    },
  };
}

export default function AdminLayout({ children }) {
  return children;
}
