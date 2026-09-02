import { NextResponse } from 'next/server';
import { getCheckoutLogs, clearCheckoutLogs } from '@/lib/storage';
import { getJakartaDateKey } from '@/lib/storeStatus';

// Dipanggil otomatis 1x sehari oleh Vercel Cron (lihat vercel.json), jam 00:10 waktu
// Jakarta — cukup telat dari tengah malam supaya semua checkout "kemarin" (Jakarta)
// sudah pasti lengkap. Membaca log checkout dari Redis, kirim ke Google Sheets lewat
// Apps Script Web App, baru hapus log-nya kalau sukses terkirim.
export async function GET(request) {
  // Vercel otomatis kirim header ini kalau CRON_SECRET di-set di environment variables
  // — mencegah orang lain memicu endpoint ini secara manual dari luar.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json({ error: 'GOOGLE_SHEETS_WEBHOOK_URL belum diatur di environment variables.' }, { status: 500 });
  }

  // "Kemarin" dihitung dari sekarang (waktu cron jalan, dini hari Jakarta) — dikurangi
  // 24 jam lalu diformat ulang ke zona Jakarta, supaya benar dapat tanggal yang baru
  // saja lewat, bukan hari ini yang baru mulai.
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const dateKey = getJakartaDateKey(yesterday);

  const logs = await getCheckoutLogs(dateKey);
  if (logs.length === 0) {
    return NextResponse.json({ synced: 0, tanggal: dateKey });
  }

  const rows = logs.map((log) => [log.tanggal, log.jam, log.nama, log.item, log.metode, log.alamat, log.total]);

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rows }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: `Gagal kirim ke Google Sheets (status ${res.status})`, tanggal: dateKey }, { status: 502 });
  }

  await clearCheckoutLogs(dateKey);
  return NextResponse.json({ synced: rows.length, tanggal: dateKey });
}
