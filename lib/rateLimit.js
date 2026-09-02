import 'server-only';

// Pembatas percobaan login sederhana, disimpan di memori (bukan database) — sesuai
// prinsip proyek ini yang menghindari infrastruktur tambahan. Cukup untuk menahan
// brute-force password admin selama proses server tetap hidup (warm instance Vercel
// biasanya menangani banyak request berturut-turut dari IP yang sama).

const WINDOW_MS = 10 * 60 * 1000; // 10 menit
const MAX_ATTEMPTS = 5;
const BLOCK_MS = 15 * 60 * 1000; // 15 menit

const attempts = new Map(); // ip -> { count, firstAttempt, blockedUntil }

export function checkRateLimit(ip) {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry) return { blocked: false };

  if (entry.blockedUntil) {
    if (now < entry.blockedUntil) return { blocked: true, retryAfterMs: entry.blockedUntil - now };
    attempts.delete(ip);
    return { blocked: false };
  }

  if (now - entry.firstAttempt > WINDOW_MS) {
    attempts.delete(ip);
    return { blocked: false };
  }

  return { blocked: false };
}

export function recordFailedAttempt(ip) {
  const now = Date.now();
  const entry = attempts.get(ip);

  if (!entry || now - entry.firstAttempt > WINDOW_MS) {
    attempts.set(ip, { count: 1, firstAttempt: now });
    return;
  }

  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.blockedUntil = now + BLOCK_MS;
  }
}

export function clearAttempts(ip) {
  attempts.delete(ip);
}
