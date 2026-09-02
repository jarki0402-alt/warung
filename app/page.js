import { getMenu, getSettings } from '@/lib/storage';
import { normalizePhone } from '@/lib/whatsapp';
import Storefront from './components/Storefront';

export const dynamic = 'force-dynamic';

const SITE_URL = 'https://www.warungmbaksepti.biz.id';

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
  const [menu, settings] = await Promise.all([getMenu(), getSettings()]);
  return (
    <>
      <script
        type="application/ld+json"
        // JSON.stringify tidak meng-escape "<" — tanpa ini, teks berisi "</script>" di
        // pengaturan (nama warung/tagline) bisa kabur dari tag script dan menyisipkan HTML/JS.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(settings)).replace(/</g, '\\u003c') }}
      />
      <Storefront menu={menu} settings={settings} />
    </>
  );
}
