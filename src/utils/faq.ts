export type FaqCategory =
  | 'Semua'
  | 'Syarat Sewa'
  | 'Pembayaran & PPN'
  | 'Antar Jemput Batam'
  | 'Asuransi & Kebijakan';

export interface FaqItem {
  id: string;
  category: Exclude<FaqCategory, 'Semua'>;
  question: string;
  answer: string;
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  'Semua',
  'Syarat Sewa',
  'Pembayaran & PPN',
  'Antar Jemput Batam',
  'Asuransi & Kebijakan',
];

export const BATAM_FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-syarat-dokumen',
    category: 'Syarat Sewa',
    question: 'Apa saja dokumen yang dibutuhkan untuk sewa lepas kunci di Batam?',
    answer:
      'Penyewa WNI cukup menyiapkan e-KTP asli dan SIM A yang masih berlaku. Untuk tamu mancanegara (seperti pendatang dari Singapura atau Malaysia melalui terminal ferry), wajib melampirkan paspor aktif serta SIM Internasional atau SIM negara asal yang diakui. Verifikasi identitas dilakukan secara digital saat serah terima unit tanpa proses berkas kertas yang memakan waktu.',
  },
  {
    id: 'faq-titik-antar',
    category: 'Antar Jemput Batam',
    question: 'Apakah tersedia layanan antar-jemput ke Bandara Hang Nadim dan pelabuhan ferry?',
    answer:
      'Ya. Tim operasional NusaDrive Batam melayani serah terima unit langsung di Bandara Internasional Hang Nadim (BTH), Pelabuhan Ferry Internasional Batam Centre, Harbour Bay (Batu Ampar), Terminal Sekupang, area hotel Nagoya, serta kawasan industri Batamindo dan Kabil dengan estimasi kesiapan 15 menit setelah jadwal kedatangan.',
  },
  {
    id: 'faq-pembayaran-ppn',
    category: 'Pembayaran & PPN',
    question: 'Bagaimana sistem pembayaran, perhitungan PPN 11%, dan struk resminya?',
    answer:
      'Seluruh tarif sewa dan jasa sopir dihitung transparan beserta PPN 11% sebelum Anda melakukan konfirmasi. Pembayaran diproses otomatis melalui QRIS Instan, BCA Virtual Account, Mandiri Virtual Account, atau GoPay/OVO dalam hitungan detik, lalu sistem langsung menerbitkan struk digital resmi yang dapat dicetak maupun diunduh untuk keperluan reimbursement kantor.',
  },
  {
    id: 'faq-wilayah-barelang',
    category: 'Asuransi & Kebijakan',
    question: 'Apakah mobil boleh digunakan melintasi Jembatan Barelang hingga Galang atau keluar Pulau Batam?',
    answer:
      'Seluruh armada bebas digunakan di seluruh jalan utama Pulau Batam hingga kawasan Jembatan 1–6 Barelang (Pulau Rempang dan Galang). Namun demi perlindungan asuransi dan pelacakan armada, kendaraan tidak diperbolehkan diseberangkan keluar Pulau Batam menggunakan kapal RoRo ke Bintan atau Tanjung Balai Karimun tanpa persetujuan tertulis dari manajemen.',
  },
  {
    id: 'faq-asuransi-darurat',
    category: 'Asuransi & Kebijakan',
    question: 'Bagaimana perlindungan asuransi dan penanganan jika terjadi kendala di jalan?',
    answer:
      'Setiap kendaraan dilindungi asuransi All-Risk dengan dukungan tim teknis darurat 24 jam di Pulau Batam. Apabila terjadi gangguan mesin atau ban di jalan, tim lapangan kami akan mengirimkan bantuan atau unit pengganti sekelasnya agar agenda bisnis maupun liburan keluarga Anda tetap berjalan lancar.',
  },
  {
    id: 'faq-jadwal-pembatalan',
    category: 'Antar Jemput Batam',
    question: 'Bagaimana jika jadwal ferry dari Singapura atau penerbangan di Hang Nadim mengalami keterlambatan?',
    answer:
      'Cukup informasikan nomor penerbangan atau jadwal ferry terbaru melalui balasan notifikasi WhatsApp minimal 2 jam sebelum waktu pengambilan. Tim kami menyesuaikan jam serah terima tanpa biaya tambahan. Untuk pemesanan yang masih berstatus Menunggu Pembayaran (pending), Anda juga dapat membatalkannya langsung dari Portal Pelanggan.',
  },
];

export function filterFaqItems(
  items: FaqItem[],
  category: FaqCategory,
  searchQuery = ''
): FaqItem[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return items.filter((item) => {
    const matchesCategory = category === 'Semua' || item.category === category;
    if (!matchesCategory) return false;
    if (!normalizedQuery) return true;

    return (
      item.question.toLowerCase().includes(normalizedQuery) ||
      item.answer.toLowerCase().includes(normalizedQuery) ||
      item.category.toLowerCase().includes(normalizedQuery)
    );
  });
}
