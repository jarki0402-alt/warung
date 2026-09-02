import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isValidSessionToken, SESSION_COOKIE } from '@/lib/session';
import { getMenu, getSettings } from '@/lib/storage';
import AdminDashboard from './AdminDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const cookieStore = await cookies();
  if (!isValidSessionToken(cookieStore.get(SESSION_COOKIE)?.value)) {
    redirect('/admin/login');
  }

  const [menu, settings] = await Promise.all([getMenu(), getSettings()]);
  return <AdminDashboard menu={menu} settings={settings} />;
}
