// Keranjang disimpan di localStorage (device pelanggan sendiri) — bukan di server.
// Ini yang bikin keranjang tahan di-refresh TANPA nambah request jaringan sama
// sekali (tetap instan walau sinyal jelek), beda dari nyimpen ke database/Redis
// yang berarti nunggu round-trip server tiap kali +/- diklik.

const STORAGE_KEY = 'warung-cart-v1';
const TTL_MS = 60 * 60 * 1000; // 1 jam tidak ada aktivitas -> dianggap kadaluarsa

export function loadCart() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const { cart, savedAt } = JSON.parse(raw);
    if (!cart || typeof savedAt !== 'number' || Date.now() - savedAt > TTL_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return {};
    }
    return cart;
  } catch {
    return {};
  }
}

export function saveCart(cart) {
  if (typeof window === 'undefined') return;
  try {
    if (Object.keys(cart).length === 0) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    // Timestamp ditulis ulang tiap perubahan -> jam kadaluarsa otomatis mundur
    // 1 jam lagi dari aktivitas terakhir (bukan dari kapan pertama kali diisi).
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ cart, savedAt: Date.now() }));
  } catch {
    // localStorage bisa gagal (mode private/kuota penuh) — keranjang tetap
    // jalan normal di sesi ini, cuma tidak ikut tersimpan lintas refresh.
  }
}

export function clearStoredCart() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // abaikan
  }
}
