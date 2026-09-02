'use client';

import { useOptimistic, useTransition } from 'react';
import { driverLogoutAction, toggleSedangMengantarAction } from '@/lib/actions';

export default function DriverDashboard({ settings, antarCountToday }) {
  const [pending, startTransition] = useTransition();
  const [optimisticMengantar, setOptimisticMengantar] = useOptimistic(
    settings.sedangMengantar,
    (_state, next) => next
  );

  const batas = settings.batasAntarHarian || 0;

  function handleToggle() {
    const next = !settings.sedangMengantar;
    startTransition(async () => {
      setOptimisticMengantar(next);
      const result = await toggleSedangMengantarAction(next);
      if (result?.error) alert(result.error);
    });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-cream">
      <header className="flex items-center justify-between px-4 py-3.5" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Driver</p>
          <h1 className="font-display text-base font-bold text-ink">{settings.namaWarung}</h1>
        </div>
        <button
          type="button"
          onClick={() => driverLogoutAction()}
          className="rounded-full bg-ink/5 px-3.5 py-2 text-xs font-semibold text-ink-soft"
        >
          Keluar
        </button>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 pb-16">
        <div
          className={`flex h-40 w-40 flex-col items-center justify-center gap-1.5 rounded-full shadow-lg transition ${
            optimisticMengantar ? 'animate-pulse bg-terracotta/25 ring-4 ring-terracotta' : 'bg-leaf/10 ring-4 ring-leaf/30'
          }`}
        >
          <span className="text-4xl">{optimisticMengantar ? '🛵' : '✅'}</span>
          <span className={`font-display text-lg font-bold ${optimisticMengantar ? 'text-terracotta' : 'text-leaf-dark'}`}>
            {optimisticMengantar ? 'Mengantar' : 'Siap'}
          </span>
        </div>

        <button
          type="button"
          onClick={handleToggle}
          disabled={pending}
          className={`w-full max-w-xs rounded-3xl py-5 text-lg font-bold text-white shadow-xl transition active:scale-[0.97] disabled:opacity-60 ${
            optimisticMengantar ? 'bg-leaf shadow-leaf/30' : 'bg-terracotta shadow-terracotta/30'
          }`}
        >
          {optimisticMengantar ? 'Selesai Antar' : 'Mulai Antar'}
        </button>

        <p className="text-sm text-ink-soft">
          Pesanan antar hari ini: <strong className="text-ink">{antarCountToday}</strong>
          {batas > 0 && <>/{batas}</>}
        </p>
      </main>
    </div>
  );
}
