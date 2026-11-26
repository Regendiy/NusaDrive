export type TestimonialCategory = 'Semua' | 'Korporat' | 'Bisnis' | 'Keluarga';

export interface TestimonialItem {
  id: string;
  customerName: string;
  role: string;
  organization: string;
  category: Exclude<TestimonialCategory, 'Semua'>;
  vehicleUsed: string;
  pickupHub: string;
  tripDate: string;
  rating: number;
  quote: string;
  outcomeMetric: string;
}

export const TESTIMONIAL_CATEGORIES: TestimonialCategory[] = [
  'Semua',
  'Korporat',
  'Bisnis',
  'Keluarga',
];

export const BATAM_TESTIMONIALS: TestimonialItem[] = [
  {
    id: 'testi-batamindo-1',
    customerName: 'Hendra Wijaya',
    role: 'Operations Manager',
    organization: 'PT Elektronik Presisi Batamindo',
    category: 'Korporat',
    vehicleUsed: 'Toyota Alphard Hybrid',
    pickupHub: 'Bandara Hang Nadim (BTH)',
    tripDate: 'November 2026',
    rating: 5,
    quote:
      'Sebelumnya tim kami sering menunggu konfirmasi manual hingga dua jam saat menjemput direksi dari Singapura. Dengan NusaDrive, unit Alphard sudah siap di pintu kedatangan Hang Nadim dalam 12 menit lengkap dengan struk PPN 11% untuk klaim keuangan.',
    outcomeMetric: 'Serah terima 12 menit · Invoice PPN instan',
  },
  {
    id: 'testi-harbourbay-2',
    customerName: 'Nadya Tanuwijaya',
    role: 'Regional Procurement Lead',
    organization: 'Sembcorp Marine Supplier SG–Batam',
    category: 'Bisnis',
    vehicleUsed: 'Hyundai Ioniq 5 Signature',
    pickupHub: 'Harbour Bay Ferry Terminal',
    tripDate: 'Oktober 2026',
    rating: 5,
    quote:
      'Jadwal ferry dari HarbourFront sering berubah, namun tim operasional langsung memantau via WhatsApp real-time. Pembayaran QRIS langsung lunas dalam hitungan detik dan mobil listriknya sangat nyaman untuk mobilitas kawasan industri Batu Ampar hingga Kabil.',
    outcomeMetric: 'Konfirmasi QRIS < 3 detik · Bebas antre loket',
  },
  {
    id: 'testi-nongsa-3',
    customerName: 'Dr. Rahmat Hidayat',
    role: 'Konsultan Medis & Akademisi',
    organization: 'Kunjungan Keluarga & Konferensi Nongsa',
    category: 'Keluarga',
    vehicleUsed: 'Toyota Kijang Innova Zenix Q',
    pickupHub: 'Batam Centre Ferry Terminal',
    tripDate: 'Oktober 2026',
    rating: 5,
    quote:
      'Kami menyewa tiga hari untuk perjalanan keluarga dari Batam Centre menuju Barelang dan resor di Nongsa. Harga yang tampil di awal sudah final termasuk opsi sopir ramah yang hafal rute alternatif bebas macet Nagoya.',
    outcomeMetric: '3 hari sewa · Tarif final tanpa biaya tersembunyi',
  },
  {
    id: 'testi-kabil-4',
    customerName: 'Dian Prasetyo',
    role: 'Site Engineering Coordinator',
    organization: 'Kabil Integrated Industrial Estate',
    category: 'Korporat',
    vehicleUsed: 'Toyota Fortuner VRZ 4x2',
    pickupHub: 'Nagoya / Lubuk Baja',
    tripDate: 'September 2026',
    rating: 5,
    quote:
      'Untuk inspeksi lapangan proyek di kawasan Kabil dan Tanjung Uncang, unit Fortuner dalam kondisi prima dan bersih. Notifikasi WhatsApp otomatis memudahkan tim admin kantor memantau jam ambil hingga pengembalian unit.',
    outcomeMetric: 'Update status real-time · Unit tahun 2025',
  },
];

export function filterTestimonials(
  items: TestimonialItem[],
  category: TestimonialCategory
): TestimonialItem[] {
  if (category === 'Semua') return items;
  return items.filter((item) => item.category === category);
}

export function summarizeTestimonials(items: TestimonialItem[]): {
  totalCount: number;
  averageRating: number;
} {
  if (items.length === 0) {
    return { totalCount: 0, averageRating: 0 };
  }
  const sum = items.reduce((acc, item) => acc + item.rating, 0);
  const averageRating = Math.round((sum / items.length) * 10) / 10;
  return {
    totalCount: items.length,
    averageRating,
  };
}
