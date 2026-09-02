import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isValidSessionToken, sessionCookieName } from '@/lib/session';
import { getMenu, getSettings } from '@/lib/storage';
import AdminDashboard from './AdminDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const cookieStore = await cookies();
  if (!isValidSessionToken('admin', cookieStore.get(sessionCookieName('admin'))?.value)) {
    redirect('/admin/login');
  }

  const [menu, settings] = await Promise.all([getMenu(), getSettings()]);
  return <AdminDashboard menu={menu} settings={settings} />;
}
