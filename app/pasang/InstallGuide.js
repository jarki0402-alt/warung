'use client';

import { useEffect, useState } from 'react';

function detectPlatform() {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

export default function InstallGuide({ namaWarung }) {
  const [platform, setPlatform] = useState('unknown');
  const [installed, setInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installState, setInstallState] = useState('idle'); // idle | prompting | accepted | dismissed

  // Pengecualian sah untuk aturan "hindari setState di effect" — baca
  // navigator/window (cuma ada di client) setelah mount, biar HTML dari server
  // tetap cocok dengan render awal di client (hindari hydration mismatch).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlatform(detectPlatform());
    setInstalled(isStandalone());

    // Service worker kosong (lihat public/sw.js) — cuma buat penuhi syarat teknis
    // Chrome sebelum dia mau kasih event install di bawah ini.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    function handleBeforeInstallPrompt(e) {
      e.preventDefault();
      setDeferredPrompt(e);
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    function handleAppInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
    }
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  async function handleInstallClick() {
    if (!deferredPrompt) return;
    setInstallState('prompting');
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setInstallState(outcome === 'accepted' ? 'accepted' : 'dismissed');
    setDeferredPrompt(null);
  }

  if (installed) {
    return (
      <div className="rounded-2xl bg-leaf/10 px-5 py-6 text-center">
        <p className="text-3xl">✅</p>
        <p className="mt-2 font-display text-lg font-bold text-leaf-dark">Sudah terpasang!</p>
        <p className="mt-1 text-sm text-ink-soft">
          {namaWarung} sudah ada di layar utama HP kamu. Tinggal buka dari sana kapan pun mau pesan.
        </p>
      </div>
    );
  }

  if (platform === 'android') {
    return (
      <div className="flex flex-col gap-4">
        {deferredPrompt ? (
          <button
            type="button"
            onClick={handleInstallClick}
            disabled={installState === 'prompting'}
            className="w-full rounded-2xl bg-leaf py-4 text-base font-bold text-white shadow-lg shadow-leaf/20 active:scale-[0.98] disabled:opacity-60"
          >
            {installState === 'prompting' ? 'Menunggu konfirmasi...' : '📲 Install Aplikasi'}
          </button>
        ) : (
          <div className="rounded-2xl bg-cream/60 px-4 py-4 text-sm text-ink-soft">
            <p className="mb-2 font-semibold text-ink">Cara pasang manual:</p>
            <ol className="list-decimal space-y-1 pl-4">
              <li>
                Tap ikon titik tiga (⋮) di pojok kanan atas Chrome
              </li>
              <li>Pilih &quot;Tambahkan ke layar Utama&quot; atau &quot;Install aplikasi&quot;</li>
              <li>Tap &quot;Pasang&quot; / &quot;Tambahkan&quot;</li>
            </ol>
          </div>
        )}
        {installState === 'dismissed' && (
          <p className="text-center text-sm text-ink-soft">Gak jadi pasang? Gapapa, tetap bisa lihat menu di bawah.</p>
        )}
      </div>
    );
  }

  if (platform === 'ios') {
    return (
      <div className="rounded-2xl bg-cream/60 px-4 py-4 text-sm text-ink-soft">
        <p className="mb-2 font-semibold text-ink">Cara pasang di iPhone (pastikan buka pakai Safari):</p>
        <ol className="list-decimal space-y-2 pl-4">
          <li>
            Tap tombol <strong className="text-ink">Share</strong> (kotak dengan panah ke atas) di bagian bawah layar
          </li>
          <li>
            Scroll ke bawah, tap <strong className="text-ink">&quot;Add to Home Screen&quot;</strong> (Tambah ke Layar Utama)
          </li>
          <li>
            Tap <strong className="text-ink">&quot;Add&quot;</strong> (Tambah) di pojok kanan atas
          </li>
        </ol>
      </div>
    );
  }

  return (
    <p className="rounded-2xl bg-cream/60 px-4 py-4 text-center text-sm text-ink-soft">
      Buka halaman ini dari HP kamu (Android/iPhone) untuk memasangnya ke layar utama.
    </p>
  );
}
