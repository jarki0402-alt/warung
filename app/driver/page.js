import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isValidSessionToken, sessionCookieName } from '@/lib/session';
import { getSettings, getAntarCountToday } from '@/lib/storage';
import DriverDashboard from './DriverDashboard';

export const dynamic = 'force-dynamic';

export default async function DriverPage() {
  const cookieStore = await cookies();
  if (!isValidSessionToken('driver', cookieStore.get(sessionCookieName('driver'))?.value)) {
    redirect('/driver/login');
  }

  const [settings, antarCountToday] = await Promise.all([getSettings(), getAntarCountToday()]);
  return <DriverDashboard settings={settings} antarCountToday={antarCountToday} />;
}
