import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isValidSessionToken, sessionCookieName } from '@/lib/session';
import { getSettings } from '@/lib/storage';
import DriverLoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

export default async function DriverLoginPage() {
  const cookieStore = await cookies();
  if (isValidSessionToken('driver', cookieStore.get(sessionCookieName('driver'))?.value)) {
    redirect('/driver');
  }

  const settings = await getSettings();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-cream px-4">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-3xl bg-leaf text-2xl text-white">
          🛵
        </span>
        <h1 className="font-display text-xl font-bold text-ink">{settings.namaWarung}</h1>
        <p className="text-xs text-ink-soft">Masuk untuk atur status pengantaran</p>
      </div>
      <DriverLoginForm />
    </div>
  );
}
