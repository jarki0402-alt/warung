import { createHmac, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = 'warung_admin_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14 hari

function getSecret() {
  const password = process.env.ADMIN_PASSWORD || '';
  // Diturunkan dari ADMIN_PASSWORD supaya konsisten di semua instance serverless
  // tanpa perlu env var tambahan, tapi tetap tidak bisa ditebak tanpa password asli.
  return createHmac('sha256', 'web-ibu-session-salt').update(password).digest('hex');
}

function sign(payload) {
  return createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

export function createSessionToken() {
  const payload = Buffer.from(JSON.stringify({ iat: Date.now() })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function isValidSessionToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return false;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;

  const expected = sign(payload);
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
