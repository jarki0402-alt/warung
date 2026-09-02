'use server';

import { timingSafeEqual } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getMenu, saveMenu, getSettings, saveSettings, incrementAntarCount } from './storage';
import { createSessionToken, isValidSessionToken, sessionCookieName, sessionCookieOptions } from './session';
import { slugify } from './format';
import { HARI_OPTIONS } from './seed';
import { checkRateLimit, recordFailedAttempt, clearAttempts } from './rateLimit';

async function getClientIp() {
  const h = await headers();
  const forwarded = h.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return h.get('x-real-ip') || 'unknown';
}

// Perbandingan tahan-timing-attack: waktu eksekusi tidak bocorkan info soal
// karakter mana yang cocok, beda dengan `password !== correct` biasa.
function safeCompare(input, correct) {
  const a = Buffer.from(input);
  const b = Buffer.from(correct);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

async function requireRole(role) {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName(role))?.value;
  if (!isValidSessionToken(role, token)) {
    throw new Error('Unauthorized');
  }
}

async function requireAdmin() {
  return requireRole('admin');
}

async function requireDriver() {
  return requireRole('driver');
}

function refreshPages() {
  revalidatePath('/');
  revalidatePath('/admin');
}

// Menu & pengaturan disimpan di Vercel Blob (atau file lokal saat dev). Kalau
// Blob Store belum terhubung di production, storage.js melempar pesan yang jelas —
// kita tangkap di sini supaya tampil rapi di form, bukan error mentah.
async function trySave(fn) {
  try {
    await fn();
    refreshPages();
    return null;
  } catch (err) {
    return { error: err?.message || 'Gagal menyimpan. Coba lagi.' };
  }
}

function parseHarga(raw) {
  const value = String(raw ?? '').trim();
  if (!value) return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.round(num);
}

// opsiJson dikirim dari MenuItemModal: array [{ nama, pilihan: [...] }]. Divalidasi
// ringan supaya data yang tersimpan selalu berbentuk benar walau ada input aneh.
function parseOpsi(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(String(raw));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((group) => ({
        nama: String(group?.nama || '').trim(),
        pilihan: Array.isArray(group?.pilihan)
          ? group.pilihan.map((p) => String(p).trim()).filter(Boolean)
          : [],
      }))
      .filter((group) => group.nama && group.pilihan.length > 0);
  } catch {
    return [];
  }
}

// ---------- Auth ----------

// Dipakai bareng oleh login admin & driver — beda role, beda password env var,
// beda cookie, tapi logika & proteksinya (rate limit, timing-safe compare) identik.
// Rate limit key diberi prefix role supaya percobaan gagal di satu role tidak ikut
// mengunci role yang lain dari IP yang sama.
async function loginWithRole(role, passwordEnv, redirectTo, formData) {
  const password = String(formData.get('password') || '');
  const correct = process.env[passwordEnv];
  const ip = await getClientIp();
  const rateLimitKey = `${role}:${ip}`;

  if (!correct) {
    return { error: `${passwordEnv} belum diatur di environment variables.` };
  }

  const { blocked, retryAfterMs } = checkRateLimit(rateLimitKey);
  if (blocked) {
    const minutes = Math.ceil(retryAfterMs / 60000);
    return { error: `Terlalu banyak percobaan salah. Coba lagi dalam ${minutes} menit.` };
  }

  // Jeda kecil di tiap percobaan supaya brute-force jadi lambat & mahal,
  // tanpa terasa mengganggu untuk login yang wajar.
  await new Promise((resolve) => setTimeout(resolve, 400));

  if (!safeCompare(password, correct)) {
    recordFailedAttempt(rateLimitKey);
    return { error: 'Password salah, coba lagi.' };
  }

  clearAttempts(rateLimitKey);
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName(role), createSessionToken(role), sessionCookieOptions);
  redirect(redirectTo);
}

export async function loginAction(_prevState, formData) {
  return loginWithRole('admin', 'ADMIN_PASSWORD', '/admin', formData);
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName('admin'));
  redirect('/admin/login');
}

export async function driverLoginAction(_prevState, formData) {
  return loginWithRole('driver', 'DRIVER_PASSWORD', '/driver', formData);
}

export async function driverLogoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName('driver'));
  redirect('/driver/login');
}

// ---------- Menu ----------

export async function addMenuItemAction(formData) {
  await requireAdmin();

  const nama = String(formData.get('nama') || '').trim();
  const kategori = String(formData.get('kategori') || '').trim();
  const subKategori = String(formData.get('subKategori') || '').trim();
  const harga = parseHarga(formData.get('harga'));
  const deskripsi = String(formData.get('deskripsi') || '').trim();
  const foto = String(formData.get('foto') || '').trim();
  const icon = String(formData.get('icon') || '🍽️').trim() || '🍽️';
  const opsi = parseOpsi(formData.get('opsiJson'));

  if (!nama || !kategori) {
    return { error: 'Nama dan kategori wajib diisi.' };
  }

  const menu = await getMenu();
  let id = slugify(nama);
  if (menu.some((item) => item.id === id)) {
    id = `${id}-${Date.now().toString(36)}`;
  }

  menu.push({
    id,
    nama,
    kategori,
    subKategori: subKategori || null,
    harga,
    deskripsi,
    icon,
    foto: foto || null,
    tersedia: true,
    opsi,
  });

  return trySave(() => saveMenu(menu));
}

export async function updateMenuItemAction(formData) {
  await requireAdmin();

  const id = String(formData.get('id') || '');
  const nama = String(formData.get('nama') || '').trim();
  const kategori = String(formData.get('kategori') || '').trim();
  const subKategori = String(formData.get('subKategori') || '').trim();
  const harga = parseHarga(formData.get('harga'));
  const deskripsi = String(formData.get('deskripsi') || '').trim();
  const foto = String(formData.get('foto') || '').trim();
  const icon = String(formData.get('icon') || '🍽️').trim() || '🍽️';
  const tersedia = formData.get('tersedia') === 'on';
  const opsi = parseOpsi(formData.get('opsiJson'));

  if (!id || !nama || !kategori) {
    return { error: 'Data menu tidak lengkap.' };
  }

  const menu = await getMenu();
  const index = menu.findIndex((item) => item.id === id);
  if (index === -1) return { error: 'Menu tidak ditemukan.' };

  menu[index] = {
    ...menu[index],
    nama,
    kategori,
    subKategori: subKategori || null,
    harga,
    deskripsi,
    foto: foto || null,
    icon,
    tersedia,
    opsi,
  };

  return trySave(() => saveMenu(menu));
}

export async function deleteMenuItemAction(formData) {
  await requireAdmin();

  const id = String(formData.get('id') || '');
  const menu = await getMenu();
  return trySave(() => saveMenu(menu.filter((item) => item.id !== id)));
}

export async function toggleAvailabilityAction(id, tersedia) {
  await requireAdmin();

  const menu = await getMenu();
  const index = menu.findIndex((item) => item.id === id);
  if (index === -1) return;

  menu[index] = { ...menu[index], tersedia };
  return trySave(() => saveMenu(menu));
}

// ---------- Settings ----------

export async function updateSettingsAction(formData) {
  await requireAdmin();

  const namaWarung = String(formData.get('namaWarung') || '').trim();
  const nomorWhatsApp = String(formData.get('nomorWhatsApp') || '').replace(/\D/g, '');

  if (!namaWarung) {
    return { error: 'Nama warung wajib diisi.' };
  }
  if (nomorWhatsApp.length < 9) {
    return { error: 'Nomor WhatsApp tidak valid. Gunakan format 62xxxxxxxxxx.' };
  }

  const hariLibur = String(formData.get('hariLibur') || '').trim();
  const hariAntar = String(formData.get('hariAntar') || '').trim();
  const batasAntarHarianRaw = String(formData.get('batasAntarHarian') || '').trim();
  const batasAntarHarian = Number.isFinite(Number(batasAntarHarianRaw)) && Number(batasAntarHarianRaw) >= 0
    ? Math.round(Number(batasAntarHarianRaw))
    : 0;

  const current = await getSettings();
  const next = {
    ...current,
    namaWarung,
    tagline: String(formData.get('tagline') || '').trim(),
    nomorWhatsApp,
    alamat: String(formData.get('alamat') || '').trim(),
    jamOperasional: String(formData.get('jamOperasional') || '').trim(),
    status: formData.get('status') === 'tutup' ? 'tutup' : 'buka',
    hariLibur: HARI_OPTIONS.includes(hariLibur) ? hariLibur : '',
    hariAntar: HARI_OPTIONS.includes(hariAntar) ? hariAntar : '',
    batasAntarHarian,
    catatanPesanan: String(formData.get('catatanPesanan') || '').trim(),
  };

  return trySave(() => saveSettings(next));
}

export async function toggleStoreStatusAction(status) {
  await requireAdmin();
  const current = await getSettings();
  return trySave(() => saveSettings({ ...current, status: status === 'tutup' ? 'tutup' : 'buka' }));
}

export async function toggleIstirahatAction(istirahat) {
  await requireAdmin();
  const current = await getSettings();
  return trySave(() => saveSettings({ ...current, istirahat: Boolean(istirahat) }));
}

// ---------- Driver (pengantar) ----------

export async function toggleSedangMengantarAction(sedangMengantar) {
  await requireDriver();
  const current = await getSettings();
  return trySave(() => saveSettings({ ...current, sedangMengantar: Boolean(sedangMengantar) }));
}

// Dipanggil dari checkout pelanggan (bukan aksi admin/driver) saat metode "Diantar"
// dipilih — jadi TIDAK pakai requireAdmin/requireDriver, siapa pun pengunjung boleh
// memicu ini. Tidak berbahaya: cuma nambah angka hitungan harian, tidak mengubah
// data lain, dan otomatis "reset" sendiri tiap hari baru (lihat lib/storage.js).
export async function incrementAntarCountAction() {
  try {
    const count = await incrementAntarCount();
    revalidatePath('/');
    return { count };
  } catch (err) {
    return { error: err?.message || 'Gagal mencatat pesanan antar.' };
  }
}
