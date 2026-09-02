export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/driver'] }],
    sitemap: 'https://www.warungmbaksepti.biz.id/sitemap.xml',
  };
}
