import { NextResponse } from 'next/server';
import { getMenu, getSettings, getAntarCountToday } from '@/lib/storage';

// Endpoint ringan buat halaman pelanggan polling status menu/warung secara berkala
// (tanpa perlu refresh manual) — cukup nama, harga, ketersediaan, dan status buka/tutup,
// bukan endpoint besar. Redis di baliknya sudah cepat & konsisten, jadi aman dipanggil sering.
export async function GET() {
  const [menu, settings, antarCountToday] = await Promise.all([getMenu(), getSettings(), getAntarCountToday()]);
  return NextResponse.json({ menu, settings, antarCountToday }, { headers: { 'Cache-Control': 'no-store' } });
}
