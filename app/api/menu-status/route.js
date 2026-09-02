import { NextResponse } from 'next/server';
import { getMenu, getSettings } from '@/lib/storage';

// Endpoint ringan buat halaman pelanggan polling status menu/warung secara berkala
// (tanpa perlu refresh manual) — cukup nama, harga, ketersediaan, dan status buka/tutup,
// bukan endpoint besar. Redis di baliknya sudah cepat & konsisten, jadi aman dipanggil sering.
export async function GET() {
  const [menu, settings] = await Promise.all([getMenu(), getSettings()]);
  return NextResponse.json({ menu, settings }, { headers: { 'Cache-Control': 'no-store' } });
}
