import 'server-only';
import { cache } from 'react';
import { get, put } from '@vercel/blob';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { DEFAULT_MENU, DEFAULT_SETTINGS } from './seed';

const MENU_PATHNAME = 'warung-data/menu.json';
const SETTINGS_PATHNAME = 'warung-data/settings.json';

const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const localDir = path.join(process.cwd(), '.data');

// Vercel Blob itu didesain buat file besar (foto, dokumen) makanya nge-cache agresif
// di CDN demi kecepatan — bukan cocok buat data kecil yang sering gonta-ganti kayak
// status buka/tutup. Supaya perubahan langsung konsisten tanpa nunggu cache Blob
// reda, instance server ini nyimpen sendiri versi terbaru yang BARU SAJA dia tulis,
// dan pakai itu dulu tanpa baca ulang ke Blob — baru fallback ke Blob kalau memori
// ini masih kosong (baru nyala) atau sudah agak lama (data mungkin berubah dari
// instance lain). Aman dipakai karena datanya kecil (cuma daftar menu & pengaturan).
const MEMORY_TTL_MS = 5 * 60 * 1000; // 5 menit
const memoryCache = { menu: null, menuAt: 0, settings: null, settingsAt: 0 };

// Di Vercel, filesystem project bersifat read-only (kecuali /tmp yang sementara).
// Kalau Blob Store belum terhubung tapi sudah jalan di Vercel, gagal dengan pesan
// yang jelas — daripada error mentah "read-only file system" yang membingungkan.
function assertWritable() {
  if (process.env.VERCEL && !useBlob) {
    throw new Error(
      'Blob Store belum terhubung. Buka Vercel Dashboard → Storage → Create Database → Blob, hubungkan ke project ini, lalu redeploy.'
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

async function readBlobJson(pathname, fallback) {
  try {
    // Vercel Blob nge-cache hasil get() di CDN minimal 60 detik untuk akses "public",
    // dan itu tidak bisa dimatikan lewat opsi resmi SDK-nya. Tanpa ini, toggle
    // buka/tutup warung atau perubahan menu bisa "ketiban" data lama sampai 1 menit.
    // Query string pembeda di sini bikin tiap baca dianggap URL baru oleh CDN,
    // jadi selalu ambil data ter-update — nama object-nya sendiri tidak berubah.
    const result = await get(`${pathname}?t=${Date.now()}`, { access: 'public' });
    if (!result || result.statusCode !== 200) return fallback;
    const text = await new Response(result.stream).text();
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

async function writeBlobJson(pathname, value) {
  await put(pathname, JSON.stringify(value, null, 2), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 60,
  });
}

export const getMenu = cache(async function getMenu() {
  if (memoryCache.menu && Date.now() - memoryCache.menuAt < MEMORY_TTL_MS) return memoryCache.menu;
  const data = useBlob ? await readBlobJson(MENU_PATHNAME, DEFAULT_MENU) : await readLocalJson('menu.json', DEFAULT_MENU);
  memoryCache.menu = data;
  memoryCache.menuAt = Date.now();
  return data;
});

export async function saveMenu(items) {
  if (useBlob) await writeBlobJson(MENU_PATHNAME, items);
  else await writeLocalJson('menu.json', items);
  memoryCache.menu = items;
  memoryCache.menuAt = Date.now();
}

export const getSettings = cache(async function getSettings() {
  if (memoryCache.settings && Date.now() - memoryCache.settingsAt < MEMORY_TTL_MS) return memoryCache.settings;
  const data = useBlob
    ? await readBlobJson(SETTINGS_PATHNAME, DEFAULT_SETTINGS)
    : await readLocalJson('settings.json', DEFAULT_SETTINGS);
  memoryCache.settings = data;
  memoryCache.settingsAt = Date.now();
  return data;
});

export async function saveSettings(settings) {
  if (useBlob) await writeBlobJson(SETTINGS_PATHNAME, settings);
  else await writeLocalJson('settings.json', settings);
  memoryCache.settings = settings;
  memoryCache.settingsAt = Date.now();
}

export function isUsingBlobStorage() {
  return useBlob;
}
