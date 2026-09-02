/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    ],
  },
  // Supaya dev server bisa diakses & interaktif dari HP di WiFi yang sama (mis. buka
  // http://192.168.x.x:3000). Tanpa ini, tombol-tombol tidak merespons karena Next.js
  // memblokir koneksi HMR dari IP selain localhost. Cuma berlaku saat development —
  // tidak berpengaruh sama sekali saat di-deploy ke Vercel (production).
  allowedDevOrigins: ['192.168.0.100', '192.168.0.*'],

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
