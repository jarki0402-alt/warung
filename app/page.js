import { getMenu, getSettings, getAntarCountToday } from '@/lib/storage';
import { normalizePhone } from '@/lib/whatsapp';
import Storefront from './components/Storefront';

// Sebelumnya 'force-dynamic' (selalu render ulang dari nol tiap ada yang buka —
// bikin rawan kena "cold start" server yang bisa nambah 1+ detik). Sekarang di-cache
// maksimal 5 detik (sama seperti interval polling di client), jadi kebanyakan orang
// dapat halaman yang sudah siap dari cache — bukan nunggu server "bangun" tiap kali.
// Begitu admin ubah menu/status, revalidatePath('/') di lib/actions.js langsung
// membatalkan cache ini seketika juga (tidak perlu nunggu 5 detik itu).
export const revalidate = 5;

const SITE_URL = 'https://warungmbaksepti.biz.id';

function buildJsonLd(settings) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: settings.namaWarung,
    description: settings.tagline || undefined,
    image: `${SITE_URL}/opengraph-image`,
    url: SITE_URL,
    telephone: `+${normalizePhone(settings.nomorWhatsApp)}`,
    servesCuisine: 'Indonesian',
    priceRange: 'Rp',
  };
  if (settings.alamat) {
    data.address = { '@type': 'PostalAddress', streetAddress: settings.alamat, addressCountry: 'ID' };
  }
  return data;
}

export default async function HomePage() {
  const [menu, settings, antarCountToday] = await Promise.all([getMenu(), getSettings(), getAntarCountToday()]);
  return (
    <>
      <script
        type="application/ld+json"
        // JSON.stringify tidak meng-escape "<" — tanpa ini, teks berisi "</script>" di
        // pengaturan (nama warung/tagline) bisa kabur dari tag script dan menyisipkan HTML/JS.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(settings)).replace(/</g, '\\u003c') }}
      />
      <Storefront menu={menu} settings={settings} antarCountToday={antarCountToday} />
    </>
  );
}
