// Data awal. Bisa diubah kapan saja lewat halaman admin — file ini hanya dipakai
// sekali saat penyimpanan (Vercel Blob / lokal) belum pernah diisi.
//
// harga: boleh `null` kalau belum mau dicantumkan harganya di web (pelanggan tetap
// bisa pesan, dan Mbak Septi konfirmasi harga lewat WhatsApp).
// subKategori: opsional, untuk mengelompokkan beberapa item SEBAGAI SATU PRODUK dengan
// pilihan jenis (mis. Minuman -> "Es Seduh / Saset" berisi 3 jenis minuman). Tampil sebagai
// satu kartu di halaman pelanggan, dibuka jadi daftar pilihan saat diketuk.
// opsi: array grup pilihan sebelum item masuk keranjang, mis.
//   [{ nama: 'Level Pedas', pilihan: ['Tidak Pedas','Sedang','Pedas'] }]
//   Soto Ayam punya 3 grup: Kuah, Sambal, Level Pedas. Kosongkan ([]) kalau tidak perlu.

export const CATEGORY_ORDER = ['Makanan Berat', 'Makanan Ringan', 'Gorengan', 'Minuman'];
export const SPICE_LEVELS = ['Tidak Pedas', 'Sedang', 'Pedas'];

// Satu foto representatif per subKategori untuk kartu menu utama (bukan mozaik dari
// tiap item) — supaya gampang diganti cukup timpa 1 file, tidak perlu urus per item.
export const SUBKATEGORI_FOTO = {
  'Es Seduh / Saset': '/images/menu/es-seduh-saset.jpg',
};

// Penanda warna (bukan emoji, bukan titik) khusus untuk grup opsi bernama "Level Pedas"
// — garis tipis + isi warna lembut, hijau/kuning/merah, pola universal.
export const SPICE_LEVEL_COLORS = {
  'Tidak Pedas': {
    border: 'border-emerald-300',
    borderActive: 'border-emerald-500',
    bg: 'bg-emerald-50',
    bgActive: 'bg-emerald-100',
    text: 'text-emerald-700',
  },
  Sedang: {
    border: 'border-amber-300',
    borderActive: 'border-amber-500',
    bg: 'bg-amber-50',
    bgActive: 'bg-amber-100',
    text: 'text-amber-700',
  },
  Pedas: {
    border: 'border-red-300',
    borderActive: 'border-red-500',
    bg: 'bg-red-50',
    bgActive: 'bg-red-100',
    text: 'text-red-700',
  },
};

const LEVEL_PEDAS_3 = { nama: 'Level Pedas', pilihan: ['Tidak Pedas', 'Sedang', 'Pedas'] };

export const DEFAULT_MENU = [
  // ---------- Makanan Berat ----------
  {
    id: 'pecel',
    nama: 'Pecel',
    kategori: 'Makanan Berat',
    subKategori: null,
    harga: null,
    deskripsi: 'Sayuran rebus segar disiram sambal kacang khas rumahan.',
    icon: '🥗',
    foto: '/images/menu/pecel.jpg',
    tersedia: true,
    opsi: [LEVEL_PEDAS_3],
  },
  {
    id: 'karedok',
    nama: 'Karedok',
    kategori: 'Makanan Berat',
    subKategori: null,
    harga: null,
    deskripsi: 'Sayuran mentah segar dengan siraman bumbu kacang.',
    icon: '🥬',
    foto: '/images/menu/karedok.jpg',
    tersedia: true,
    opsi: [LEVEL_PEDAS_3],
  },
  {
    id: 'ketoprak',
    nama: 'Ketoprak',
    kategori: 'Makanan Berat',
    subKategori: null,
    harga: null,
    deskripsi: 'Lontong, tahu, bihun, dan taoge dengan siraman bumbu kacang.',
    icon: '🥘',
    foto: '/images/menu/ketoprak.jpg',
    tersedia: true,
    opsi: [LEVEL_PEDAS_3],
  },
  {
    id: 'soto-ayam',
    nama: 'Soto Ayam',
    kategori: 'Makanan Berat',
    subKategori: null,
    harga: null,
    deskripsi: 'Kuah bening gurih dengan suwiran ayam, soun, dan taburan bawang goreng.',
    icon: '🍜',
    foto: '/images/menu/soto-ayam.jpg',
    tersedia: true,
    opsi: [
      { nama: 'Kuah', pilihan: ['Campur', 'Pisah'] },
      { nama: 'Sambal', pilihan: ['Campur', 'Pisah'] },
      { nama: 'Level Pedas', pilihan: ['Sedang', 'Pedas'] },
    ],
  },

  // ---------- Makanan Ringan ----------
  {
    id: 'rujak-soun',
    nama: 'Rujak Soun',
    kategori: 'Makanan Ringan',
    subKategori: null,
    harga: null,
    deskripsi: 'Soun dan sayuran segar dengan bumbu rujak pedas manis.',
    icon: '🍲',
    foto: '/images/menu/rujak-soun.jpg',
    tersedia: true,
    opsi: [],
  },
  {
    id: 'pempek',
    nama: 'Pempek',
    kategori: 'Makanan Ringan',
    subKategori: null,
    harga: null,
    deskripsi: 'Pempek kenyal disajikan dengan kuah cuko.',
    icon: '🐟',
    foto: '/images/menu/pempek.jpg',
    tersedia: true,
    opsi: [],
  },

  // ---------- Gorengan ----------
  {
    id: 'bakwan',
    nama: 'Bakwan',
    kategori: 'Gorengan',
    subKategori: null,
    harga: null,
    deskripsi: 'Gorengan sayur renyah, digoreng hangat.',
    icon: '🧆',
    foto: '/images/menu/bakwan.jpg',
    tersedia: true,
    opsi: [],
  },
  {
    id: 'tahu',
    nama: 'Tahu',
    kategori: 'Gorengan',
    subKategori: null,
    harga: null,
    deskripsi: 'Tahu goreng garing di luar, lembut di dalam.',
    icon: '🍢',
    foto: '/images/menu/tahu.jpg',
    tersedia: true,
    opsi: [],
  },
  {
    id: 'tempe',
    nama: 'Tempe',
    kategori: 'Gorengan',
    subKategori: null,
    harga: null,
    deskripsi: 'Tempe goreng renyah, gurih khas rumahan.',
    icon: '🍘',
    foto: '/images/menu/tempe.jpg',
    tersedia: true,
    opsi: [],
  },
  {
    id: 'pisang',
    nama: 'Pisang',
    kategori: 'Gorengan',
    subKategori: null,
    harga: null,
    deskripsi: 'Pisang goreng manis dengan balutan tepung renyah.',
    icon: '🍌',
    foto: '/images/menu/pisang.jpg',
    tersedia: true,
    opsi: [],
  },

  // ---------- Minuman ----------
  {
    id: 'es-cendol',
    nama: 'Es Cendol',
    kategori: 'Minuman',
    subKategori: null,
    harga: null,
    deskripsi: 'Cendol, santan, dan gula merah cair yang segar dingin.',
    icon: '🍧',
    foto: '/images/menu/es-cendol.jpg',
    tersedia: true,
    opsi: [],
  },
  {
    id: 'tea-jus-gula-batu',
    nama: 'Tea Jus Gula Batu',
    kategori: 'Minuman',
    subKategori: 'Es Seduh / Saset',
    harga: null,
    deskripsi: '',
    icon: '🧊',
    foto: null,
    tersedia: true,
    opsi: [],
  },
  {
    id: 'marimas-jeruk',
    nama: 'Marimas Jeruk',
    kategori: 'Minuman',
    subKategori: 'Es Seduh / Saset',
    harga: null,
    deskripsi: '',
    icon: '🍊',
    foto: null,
    tersedia: true,
    opsi: [],
  },
  {
    id: 'nutrisari',
    nama: 'Nutrisari',
    kategori: 'Minuman',
    subKategori: 'Es Seduh / Saset',
    harga: null,
    deskripsi: '',
    icon: '🥤',
    foto: null,
    tersedia: true,
    opsi: [],
  },
];

export const DEFAULT_SETTINGS = {
  namaWarung: 'Warung Pecel Mbak Septi',
  tagline: 'Pecel & gado-gado segar, dibuat dengan cinta setiap hari',
  nomorWhatsApp: '6288287006242',
  alamat: '',
  jamBuka: '08:00', // format HH:MM (zona Jakarta) — dipakai buka/tutup otomatis
  jamTutup: '17:00',
  status: 'buka', // 'buka' = ikut jadwal otomatis (jamBuka-jamTutup); 'tutup' = dipaksa tutup manual, abaikan jadwal
  istirahat: false, // tutup sejenak (sholat/istirahat) — toggle cepat, beda dari tutup penuh
  hariLibur: 'Jumat', // libur mingguan otomatis, kosongkan ('') kalau tidak ada libur tetap
  hariAntar: 'Minggu', // hari layanan antar tersedia, kosongkan ('') kalau tidak ada layanan antar
  sedangMengantar: false, // dikontrol dari /driver, bukan admin — driver lagi otw
  batasAntarHarian: 3, // maksimal pesanan "Diantar" per hari, 0 = tanpa batas
  catatanPesanan: '',
};

export const HARI_OPTIONS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
