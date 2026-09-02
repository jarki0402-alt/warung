import { createHmac, timingSafeEqual } from 'node:crypto';

const MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14 hari

// Dua peran login, masing-masing cookie & secret sendiri-sendiri (diturunkan dari
// password masing-masing) — supaya sesi admin & driver benar-benar terpisah total.
// Kalau salah satu password bocor, yang lain tetap aman (secret-nya beda).
const ROLES = {
  admin: { cookie: 'warung_admin_session', passwordEnv: 'ADMIN_PASSWORD', salt: 'web-ibu-session-salt-admin' },
  driver: { cookie: 'warung_driver_session', passwordEnv: 'DRIVER_PASSWORD', salt: 'web-ibu-session-salt-driver' },
};

function getSecret(role) {
  const password = process.env[ROLES[role].passwordEnv] || '';
  // Diturunkan dari password masing-masing role supaya konsisten di semua instance
  // serverless tanpa perlu env var tambahan, tapi tetap tidak bisa ditebak tanpa password asli.
  return createHmac('sha256', ROLES[role].salt).update(password).digest('hex');
}

function sign(role, payload) {
  return createHmac('sha256', getSecret(role)).update(payload).digest('base64url');
}

export function sessionCookieName(role) {
  return ROLES[role].cookie;
}

export function createSessionToken(role) {
  const payload = Buffer.from(JSON.stringify({ iat: Date.now() })).toString('base64url');
  return `${payload}.${sign(role, payload)}`;
}

export function isValidSessionToken(role, token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return false;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;

  const expected = sign(role, payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  try {
    const { iat } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    if (typeof iat !== 'number') return false;
    return Date.now() - iat < MAX_AGE_SECONDS * 1000;
  } catch {
    return false;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: MAX_AGE_SECONDS,
};
