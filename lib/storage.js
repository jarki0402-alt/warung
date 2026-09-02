import 'server-only';
import { cache } from 'react';
import { Redis } from '@upstash/redis';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { DEFAULT_MENU, DEFAULT_SETTINGS } from './seed';

const MENU_KEY = 'warung:menu';
const SETTINGS_KEY = 'warung:settings';

// Upstash Redis: baca-tulis konsisten instan (bukan cache-CDN kayak Blob), pas
// buat data kecil yang sering berubah seperti status buka/tutup & daftar menu.
const useRedis = Boolean(
  (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) &&
    (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN)
);
const redis = useRedis ? Redis.fromEnv() : null;
const localDir = path.join(process.cwd(), '.data');

// Di Vercel, filesystem project bersifat read-only (kecuali /tmp yang sementara).
// Kalau Redis Store belum terhubung tapi sudah jalan di Vercel, gagal dengan pesan
// yang jelas — daripada error mentah "read-only file system" yang membingungkan.
function assertWritable() {
  if (process.env.VERCEL && !useRedis) {
    throw new Error(
      'Redis Store belum terhubung. Buka Vercel Dashboard → Storage → Create Database → Upstash (Redis), hubungkan ke project ini, lalu redeploy.'
    );
  }
}

async function readLocalJson(filename, fallback) {
  try {
    const raw = await fs.readFile(path.join(localDir, filename), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeLocalJson(filename, value) {
  assertWritable();
  await fs.mkdir(localDir, { recursive: true });
  await fs.writeFile(path.join(localDir, filename), JSON.stringify(value, null, 2), 'utf-8');
}

export const getMenu = cache(async function getMenu() {
  if (useRedis) {
    const data = await redis.get(MENU_KEY);
    return data ?? DEFAULT_MENU;
  }
  return readLocalJson('menu.json', DEFAULT_MENU);
});

export async function saveMenu(items) {
  if (useRedis) {
    await redis.set(MENU_KEY, items);
    return;
  }
  return writeLocalJson('menu.json', items);
}

export const getSettings = cache(async function getSettings() {
  if (useRedis) {
    const data = await redis.get(SETTINGS_KEY);
    return data ?? DEFAULT_SETTINGS;
  }
  return readLocalJson('settings.json', DEFAULT_SETTINGS);
});

export async function saveSettings(settings) {
  if (useRedis) {
    await redis.set(SETTINGS_KEY, settings);
    return;
  }
  return writeLocalJson('settings.json', settings);
}

export function isUsingRedisStorage() {
  return useRedis;
}
