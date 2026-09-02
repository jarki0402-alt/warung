'use client';

import { useActionState } from 'react';
import { driverLoginAction } from '@/lib/actions';

const initialState = { error: '' };

export default function DriverLoginForm() {
  const [state, formAction, pending] = useActionState(driverLoginAction, initialState);

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <div>
        <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-ink-soft">
          Password Driver
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-base text-ink focus:border-leaf focus:outline-none"
          placeholder="••••••••"
        />
      </div>

      {state?.error && (
        <p className="rounded-xl bg-terracotta/10 px-3 py-2 text-xs font-medium text-terracotta">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-leaf py-3 text-sm font-bold text-white shadow-lg shadow-leaf/20 transition active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? 'Memeriksa...' : 'Masuk'}
      </button>
    </form>
  );
}
