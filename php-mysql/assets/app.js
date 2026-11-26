(function () {
  'use strict';

  const boot = window.__NUSADRIVE_BOOTSTRAP__ || {
    initialView: 'armada',
    vehicles: [],
    bookings: [],
    notifications: [],
    users: [],
  };

  const BATAM_PICKUP_LOCATIONS = [
    'Batam Centre · Pelabuhan Ferry Internasional',
    'Bandara Internasional Hang Nadim (BTH)',
    'Nagoya / Lubuk Baja',
    'Harbour Bay Ferry Terminal (Batu Ampar)',
    'Nongsa / Kabil Industrial Estate',
    'Sekupang Ferry Terminal',
  ];

  const BATAM_REQUIREMENTS = [
    'Wajib melampirkan e-KTP asli (NIK 16 digit) & Kartu Keluarga (KK).',
    'Sewa lepas kunci wajib memiliki SIM A aktif yang masih berlaku.',
    'Unit hanya beroperasi di wilayah Pulau Batam hingga Jembatan 1–6 Barelang.',
    'Toleransi penyesuaian jadwal ferry Singapura / Hang Nadim 2 jam sebelum serah terima.',
  ];

  const BATAM_HUBS = [
    {
      id: 'hub-bth',
      area: 'Bandara & Pelabuhan',
      name: 'Bandara Internasional Hang Nadim (BTH)',
      address: 'Jl. Hang Nadim, Batu Besar, Kec. Nongsa, Batam',
      lat: 1.1210,
      lng: 104.1186,
      eta: '15 menit antar ke terminal kedatangan',
    },
    {
      id: 'hub-btc',
      area: 'Batam Centre',
      name: 'Batam Centre · Pelabuhan Ferry Internasional',
      address: 'Jl. Engku Putri, Teluk Tering, Batam Kota',
      lat: 1.1286,
      lng: 104.0539,
      eta: '10 menit dari pool pusat Engku Putri',
    },
    {
      id: 'hub-hb',
      area: 'Bandara & Pelabuhan',
      name: 'Harbour Bay Ferry Terminal (Batu Ampar)',
      address: 'Jl. Duyung, Sungai Jodoh, Kec. Batu Ampar, Batam',
      lat: 1.1536,
      lng: 104.0005,
      eta: '15 menit ke area parkir VIP terminal',
    },
    {
      id: 'hub-ngy',
      area: 'Nagoya & Jodoh',
      name: 'Nagoya / Lubuk Baja',
      address: 'Jl. Teuku Umar, Lubuk Baja, Kota Batam',
      lat: 1.1422,
      lng: 104.0138,
      eta: '15 menit ke hotel & pusat bisnis Nagoya',
    },
    {
      id: 'hub-nongsa',
      area: 'Nongsa & Sekupang',
      name: 'Nongsa / Kabil Industrial Estate',
      address: 'Kawasan Nongsa Pura & Kabil Terpadu, Batam',
      lat: 1.1895,
      lng: 104.0958,
      eta: '20 menit ke resor Nongsa & gate industri',
    },
    {
      id: 'hub-sekupang',
      area: 'Nongsa & Sekupang',
      name: 'Sekupang Ferry Terminal',
      address: 'Jl. RE Martadinata, Sekupang, Kota Batam',
      lat: 1.1264,
      lng: 103.9278,
      eta: '20 menit ke dermaga domestik & internasional',
    },
  ];

  const PROMO_OFFERS = [
    {
      id: 'batam-holiday-2026',
      discountSummary: 'Diskon 15%',
      seasonLabel: 'Penawaran Libur Akhir Tahun Batam',
      validPeriodLabel: '23 Nov – 31 Des 2026',
      countdownText: '36 hari tersisa',
      title: 'Hemat 15% untuk Sewa MPV Keluarga & Eksekutif Minimal 3 Hari',
      description:
        'Berlaku untuk penjemputan di Bandara Hang Nadim, Pelabuhan Ferry Batam Centre, dan Harbour Bay selama periode liburan.',
      promoCode: 'BATAMLIBUR15',
      targetCategory: 'MPV',
    },
    {
      id: 'batam-ev-weekend',
      discountSummary: 'Hemat Rp 150.000/hari',
      seasonLabel: 'Promo Terbatas Mobilitas Hijau Batam',
      validPeriodLabel: 'Berlaku s/d 15 Des 2026',
      countdownText: '20 hari tersisa',
      title: 'Potongan Langsung Rp 150.000/Hari untuk Unit Mobil Listrik (EV)',
      description:
        'Nikmati perjalanan bebas bising keliling Nagoya, Nongsa, hingga Jembatan Barelang dengan dukungan pengisian daya penuh sebelum serah terima.',
      promoCode: 'EVBATAM150',
      targetCategory: 'EV',
    },
  ];

  const TESTIMONIALS = [
    {
      category: 'Korporat',
      vehicleUsed: 'Toyota Alphard Hybrid',
      pickupHub: 'Bandara Hang Nadim (BTH)',
      rating: '5.0 ★',
      quote:
        'Sebelumnya tim kami sering menunggu konfirmasi manual hingga dua jam saat menjemput direksi dari Singapura. Dengan NusaDrive, unit Alphard sudah siap di pintu kedatangan Hang Nadim dalam 12 menit lengkap dengan struk PPN 11% untuk klaim keuangan.',
      outcomeMetric: 'Serah terima 12 menit · Invoice PPN instan',
      customerName: 'Hendra Wijaya',
      org: 'Operations Manager, PT Elektronik Presisi Batamindo',
      tripDate: 'November 2026',
    },
    {
      category: 'Bisnis',
      vehicleUsed: 'Hyundai Ioniq 5 Signature',
      pickupHub: 'Harbour Bay Ferry Terminal',
      rating: '5.0 ★',
      quote:
        'Jadwal ferry dari HarbourFront sering berubah, namun tim operasional langsung memantau via WhatsApp real-time. Pembayaran QRIS langsung lunas dalam hitungan detik dan mobil listriknya sangat nyaman untuk mobilitas kawasan industri Batu Ampar hingga Kabil.',
      outcomeMetric: 'Konfirmasi QRIS < 3 detik · Bebas antre loket',
      customerName: 'Nadya Tanuwijaya',
      org: 'Regional Procurement Lead, Sembcorp Marine Supplier SG–Batam',
      tripDate: 'Oktober 2026',
    },
    {
      category: 'Keluarga',
      vehicleUsed: 'Toyota Kijang Innova Zenix Q',
      pickupHub: 'Batam Centre Ferry Terminal',
      rating: '5.0 ★',
      quote:
        'Kami menyewa tiga hari untuk perjalanan keluarga dari Batam Centre menuju Barelang dan resor di Nongsa. Harga yang tampil di awal sudah final termasuk opsi sopir ramah yang hafal rute alternatif bebas macet Nagoya.',
      outcomeMetric: '3 hari sewa · Tarif final tanpa biaya tersembunyi',
      customerName: 'Dr. Rahmat Hidayat',
      org: 'Konsultan Medis & Akademisi, Kunjungan Keluarga & Konferensi Nongsa',
      tripDate: 'Oktober 2026',
    },
    {
      category: 'Korporat',
      vehicleUsed: 'Mitsubishi Pajero Sport Dakar',
      pickupHub: 'Nagoya / Lubuk Baja',
      rating: '5.0 ★',
      quote:
        'Untuk inspeksi lapangan proyek di kawasan Kabil dan Tanjung Uncang, unit Pajero dalam kondisi prima dan bersih. Notifikasi WhatsApp otomatis memudahkan tim admin kantor memantau jam ambil hingga pengembalian unit.',
      outcomeMetric: 'Update status real-time · Unit tahun 2024',
      customerName: 'Dian Prasetyo',
      org: 'Site Engineering Coordinator, Kabil Integrated Industrial Estate',
      tripDate: 'September 2026',
    },
  ];

  const FAQ_ITEMS = [
    {
      id: 'faq-syarat-dokumen',
      category: 'Syarat Sewa',
      question: 'Apa saja dokumen yang dibutuhkan untuk sewa lepas kunci di Batam?',
      answer:
        'Penyewa WNI cukup menyiapkan e-KTP asli dan SIM A yang masih berlaku beserta Kartu Keluarga (KK). Untuk tamu mancanegara, wajib melampirkan paspor aktif serta SIM Internasional. Unggah foto berkas langsung melalui formulir pemesanan agar verifikasi KYC selesai sebelum unit tiba.',
    },
    {
      id: 'faq-titik-antar',
      category: 'Antar Jemput Batam',
      question: 'Apakah tersedia layanan antar-jemput ke Bandara Hang Nadim dan pelabuhan ferry?',
      answer:
        'Ya. Tim operasional NusaDrive Batam melayani serah terima unit langsung di Bandara Internasional Hang Nadim (BTH), Pelabuhan Ferry Internasional Batam Centre, Harbour Bay, Terminal Sekupang, Nagoya, serta kawasan industri Batamindo & Kabil dengan estimasi 15 menit.',
    },
    {
      id: 'faq-pembayaran-ppn',
      category: 'Pembayaran & PPN',
      question: 'Bagaimana sistem pembayaran, perhitungan PPN 11%, dan struk resminya?',
      answer:
        'Seluruh tarif sewa dan jasa sopir dihitung transparan beserta PPN 11% sebelum konfirmasi. Pembayaran diproses otomatis via QRIS Instan atau Virtual Account, lalu sistem menerbitkan struk digital resmi siap cetak.',
    },
    {
      id: 'faq-wilayah-barelang',
      category: 'Asuransi & Kebijakan',
      question: 'Apakah mobil boleh digunakan melintasi Jembatan Barelang hingga Galang atau keluar Pulau Batam?',
      answer:
        'Seluruh armada bebas digunakan di seluruh jalan utama Pulau Batam hingga kawasan Jembatan 1–6 Barelang (Rempang & Galang). Kendaraan tidak diperbolehkan diseberangkan ke luar Pulau Batam tanpa persetujuan tertulis manajemen.',
    },
    {
      id: 'faq-asuransi-darurat',
      category: 'Asuransi & Kebijakan',
      question: 'Bagaimana perlindungan asuransi dan penanganan jika terjadi kendala di jalan?',
      answer:
        'Setiap kendaraan dilindungi asuransi All-Risk dengan dukungan tim teknis darurat 24 jam dan pelacakan GPS real-time di seluruh koridor Pulau Batam.',
    },
    {
      id: 'faq-jadwal-pembatalan',
      category: 'Antar Jemput Batam',
      question: 'Bagaimana jika jadwal ferry dari Singapura atau penerbangan di Hang Nadim mengalami keterlambatan?',
      answer:
        'Informasikan nomor penerbangan atau jadwal ferry terbaru minimal 2 jam sebelum waktu pengambilan melalui WhatsApp, dan tim kami akan menyesuaikan jam serah terima tanpa biaya tambahan.',
    },
  ];

  const todayIso = new Date().toISOString().slice(0, 10);
  const plusTwoIso = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);

  const state = {
    view: boot.initialView || 'armada',
    role: 'customer',
    vehicles: Array.isArray(boot.vehicles) ? boot.vehicles : [],
    bookings: Array.isArray(boot.bookings) ? boot.bookings : [],
    notifications: Array.isArray(boot.notifications) ? boot.notifications : [],
    users: Array.isArray(boot.users) ? boot.users : [],
    adminTab: 'fleet',
    ownerTab: 'units',
    customerStatusFilter: 'Semua',
    bookingSearch: '',
    waSearch: '',
    promoIndex: 0,
    promoDismissed: false,
    promoCopied: false,
    category: 'Semua',
    searchQuery: '',
    fuelFilter: 'Semua',
    transmissions: [],
    minPrice: null,
    maxPrice: null,
    quickSchedule: {
      startDate: todayIso,
      endDate: plusTwoIso,
      pickupLocation: BATAM_PICKUP_LOCATIONS[0],
      applied: false,
    },
    mapSearchQuery: '',
    mapSelectedHubId: 'hub-btc',
    mapLayerMode: 'road',
    trackingFilter: 'all',
    selectedTrackedVehicleId: null,
    testiCategory: 'Semua',
    faqCategory: 'Semua',
    faqSearch: '',
    faqOpenId: 'faq-syarat-dokumen',
    maps: {},
  };

  function esc(val) {
    return String(val ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatRupiah(amount) {
    return 'Rp ' + Number(amount || 0).toLocaleString('id-ID');
  }

  function showToast(msg) {
    const el = document.getElementById('toast-root');
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => {
      el.classList.add('hidden');
    }, 3600);
  }

  function getActiveUser() {
    if (state.role === 'admin') {
      return state.users.find((u) => u.role === 'admin') || { id: 1, name: 'Admin Operasional Batam', role: 'admin', whatsapp: '628117700123' };
    }
    if (state.role === 'owner') {
      return state.users.find((u) => u.role === 'owner') || { id: 2, name: 'Hendra Wijaya (Mitra Batam)', role: 'owner', whatsapp: '6281270001122' };
    }
    return state.users.find((u) => u.role === 'customer') || { id: 3, name: 'Budi Santoso', role: 'customer', whatsapp: '6281377889900' };
  }

  function computePriceBounds() {
    if (!state.vehicles.length) return { min: 500000, max: 5000000, step: 50000 };
    let min = Infinity;
    let max = 0;
    for (const v of state.vehicles) {
      if (v.dailyRate < min) min = v.dailyRate;
      if (v.dailyRate > max) max = v.dailyRate;
    }
    min = Math.floor(min / 50000) * 50000;
    max = Math.ceil(max / 50000) * 50000;
    if (min === max) max = min + 100000;
    return { min, max, step: 50000 };
  }

  function getFilteredVehicles() {
    const bounds = computePriceBounds();
    const minP = state.minPrice !== null ? state.minPrice : bounds.min;
    const maxP = state.maxPrice !== null ? state.maxPrice : bounds.max;
    const q = state.searchQuery.trim().toLowerCase();

    return state.vehicles.filter((v) => {
      if (state.category !== 'Semua' && v.category !== state.category) return false;
      if (state.fuelFilter !== 'Semua' && v.fuelType !== state.fuelFilter) return false;
      if (state.transmissions.length > 0 && !state.transmissions.includes(v.transmission)) return false;
      if (v.dailyRate < minP || v.dailyRate > maxP) return false;
      if (q && !v.name.toLowerCase().includes(q) && !v.brand.toLowerCase().includes(q) && !v.plateNumber.toLowerCase().includes(q)) return false;
      return true;
    });
  }

  function hasRefinements() {
    const bounds = computePriceBounds();
    const minP = state.minPrice !== null ? state.minPrice : bounds.min;
    const maxP = state.maxPrice !== null ? state.maxPrice : bounds.max;
    return (
      state.category !== 'Semua' ||
      state.searchQuery.trim() !== '' ||
      state.fuelFilter !== 'Semua' ||
      state.transmissions.length > 0 ||
      minP > bounds.min ||
      maxP < bounds.max
    );
  }

  function updateThemeButton() {
    const btn = document.getElementById('theme-toggle-btn');
    if (!btn) return;
    const isDark = document.documentElement.classList.contains('dark');
    btn.setAttribute('aria-label', isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap');
    btn.innerHTML = isDark
      ? '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>'
      : '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';
  }

  function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
    try {
      localStorage.setItem('nusadrive_theme', isDark ? 'dark' : 'light');
    } catch (_) {}
    updateThemeButton();
    render();
  }

  function syncNavChrome() {
    document.querySelectorAll('.nav-tab').forEach((btn) => {
      const active = btn.getAttribute('data-nav') === state.view;
      btn.className = `nav-tab py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 border-b-2 ${
        active
          ? 'text-blue-700 dark:text-blue-400 border-blue-700 dark:border-blue-400'
          : 'text-slate-600 dark:text-slate-300 border-transparent hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600'
      }`;
    });
    document.querySelectorAll('.mobile-nav-tab').forEach((btn) => {
      const active = btn.getAttribute('data-nav') === state.view;
      btn.className = `mobile-nav-tab w-full text-left px-3 min-h-[44px] flex items-center text-sm font-medium rounded-lg ${
        active
          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400'
          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
      }`;
    });
    const rSel = document.getElementById('role-account-select');
    const mrSel = document.getElementById('mobile-role-select');
    if (rSel) rSel.value = state.role;
    if (mrSel) mrSel.value = state.role;
  }

  async function refreshAllData() {
    try {
      const [vRes, bRes, nRes] = await Promise.all([
        fetch('api/vehicles.php'),
        fetch('api/bookings.php'),
        fetch('api/whatsapp_notify.php'),
      ]);
      if (vRes.ok) {
        const vd = await vRes.json();
        if (Array.isArray(vd.vehicles)) state.vehicles = vd.vehicles;
      }
      if (bRes.ok) {
        const bd = await bRes.json();
        if (Array.isArray(bd.bookings)) state.bookings = bd.bookings;
      }
      if (nRes.ok) {
        const nd = await nRes.json();
        if (Array.isArray(nd.notifications)) state.notifications = nd.notifications;
      }
    } catch (err) {
      console.error('Refresh error:', err);
    }
  }

  function statusBadge(status) {
    if (status === 'available') {
      return '<span class="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"><span class="w-2 h-2 rounded-full bg-emerald-600"></span>Tersedia</span>';
    }
    if (status === 'rented') {
      return '<span class="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400"><span class="w-2 h-2 rounded-full bg-amber-500"></span>Sedang Disewa</span>';
    }
    return '<span class="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 dark:text-red-400"><span class="w-2 h-2 rounded-full bg-red-600"></span>Perawatan</span>';
  }

  function kycBadge(kycStatus) {
    if (kycStatus === 'verified') {
      return '<span class="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">KYC Valid</span>';
    }
    if (kycStatus === 'rejected') {
      return '<span class="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">KYC Ditolak</span>';
    }
    return '<span class="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">Periksa KYC</span>';
  }

  function bookingStatusBadge(status) {
    const map = {
      pending: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      confirmed: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      active: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      completed: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      cancelled: 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
    };
    const cls = map[status] || map.pending;
    return `<span class="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded border ${cls}">${esc(status)}</span>`;
  }

  // Hero & Armada Sections
  function renderHero() {
    const pickupOpts = BATAM_PICKUP_LOCATIONS.map(
      (loc) => `<option value="${esc(loc)}" ${state.quickSchedule.pickupLocation === loc ? 'selected' : ''}>${esc(loc)}</option>`
    ).join('');

    return `
      <section id="top" class="bg-gradient-to-b from-slate-50 via-white to-white dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 lg:pt-14 lg:pb-16">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            <div class="lg:col-span-5 flex flex-col justify-between py-1">
              <div>
                <p class="text-sm font-medium text-blue-700 dark:text-blue-400 mb-3">
                  Batam Centre · Hang Nadim · Nagoya · Harbour Bay · Nongsa
                </p>
                <h1 class="font-display font-bold tracking-tight text-slate-950 dark:text-white text-balance" style="font-size: clamp(2.15rem, 3.5vw, 3.35rem); line-height: 1.07">
                  Sewa mobil di Batam dengan konfirmasi instan.
                </h1>
                <p class="mt-5 text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                  Pilih unit MPV, SUV, Sedan, atau mobil listrik terawat untuk perjalanan bisnis dan wisata di Batam. Hitung tarif transparan, bayar otomatis lewat QRIS atau Virtual Account, cetak struk digital, dan terima status langsung di WhatsApp.
                </p>
              </div>
              <div class="mt-8 space-y-6">
                <div class="flex flex-wrap items-center gap-3">
                  <button type="button" id="hero-explore-btn" class="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0">
                    <span>Pilih Armada Sekarang</span>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                  </button>
                  <button type="button" id="hero-map-btn" class="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0">
                    <span>Lihat Peta Batam</span>
                  </button>
                </div>
                <div class="pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-6 text-sm">
                  <div>
                    <p class="font-mono text-lg font-bold text-slate-950 dark:text-white tabular-nums">15 Menit</p>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Antar ke pelabuhan &amp; bandara</p>
                  </div>
                  <div>
                    <p class="font-mono text-lg font-bold text-slate-950 dark:text-white tabular-nums">Struk &amp; WA</p>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Bukti pembayaran terverifikasi</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="lg:col-span-7">
              <div class="h-full min-h-[280px] lg:min-h-[410px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 relative">
                <img src="assets/images/hero_rental_fleet_1794672684541.jpg" alt="Armada mobil eksekutif NusaDrive di Kota Batam" class="w-full h-full object-cover" />
                <div class="absolute inset-x-0 bottom-0 p-5 sm:p-6 bg-gradient-to-t from-slate-950/95 via-slate-950/65 to-transparent text-white flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p class="text-xs text-slate-300">Operasional Resmi Pulau Batam · 2024–2025</p>
                    <p class="font-display text-base sm:text-lg font-semibold mt-0.5">Asuransi All-Risk &amp; Layanan Darurat 24 Jam</p>
                  </div>
                  <p class="font-mono text-sm sm:text-base font-semibold tabular-nums text-white">Mulai Rp 950.000 / hari</p>
                </div>
              </div>
            </div>
          </div>

          <form id="quick-search-form" class="mt-8 p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label for="quick-pickup-location" class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Lokasi Pengambilan (Batam)</label>
              <select id="quick-pickup-location" class="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100">
                ${pickupOpts}
              </select>
            </div>
            <div>
              <label for="quick-start-date" class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Tanggal Mulai</label>
              <input id="quick-start-date" type="date" min="${todayIso}" value="${esc(state.quickSchedule.startDate)}" class="w-full px-3 py-2.5 text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg" />
            </div>
            <div>
              <label for="quick-end-date" class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Tanggal Selesai</label>
              <input id="quick-end-date" type="date" min="${esc(state.quickSchedule.startDate)}" value="${esc(state.quickSchedule.endDate)}" class="w-full px-3 py-2.5 text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg" />
            </div>
            <div class="flex items-end gap-2">
              <div class="flex-1">
                <label for="quick-category" class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Kategori Unit</label>
                <select id="quick-category" class="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg">
                  ${['Semua', 'MPV', 'SUV', 'EV', 'Sedan'].map((c) => `<option value="${c}" ${state.category === c ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
              </div>
              <button type="submit" class="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-slate-950 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg min-h-[42px]">Cari</button>
            </div>
          </form>
        </div>
      </section>
    `;
  }

  function renderPromoBanner() {
    if (state.promoDismissed) return '';
    const offer = PROMO_OFFERS[state.promoIndex % PROMO_OFFERS.length];
    return `
      <aside class="animate-promo-slide-down mb-8 rounded-xl border border-blue-200 dark:border-blue-900/70 bg-gradient-to-r from-blue-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/40 p-4 sm:px-6 sm:py-5">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div class="min-w-0 space-y-1.5">
            <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-blue-800 dark:text-blue-300">
              <span class="font-semibold">${esc(offer.discountSummary)}</span>
              <span aria-hidden="true">·</span>
              <span>${esc(offer.seasonLabel)}</span>
              <span aria-hidden="true">·</span>
              <span class="font-mono tabular-nums text-slate-600 dark:text-slate-400">${esc(offer.validPeriodLabel)} (${esc(offer.countdownText)})</span>
            </div>
            <h3 class="font-display text-base sm:text-lg font-semibold text-slate-950 dark:text-white tracking-tight">${esc(offer.title)}</h3>
            <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-3xl">${esc(offer.description)}</p>
          </div>
          <div class="flex flex-wrap items-center gap-2.5 shrink-0">
            <button type="button" id="promo-copy-btn" class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-mono font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
              ${state.promoCopied ? `Tersalin: ${esc(offer.promoCode)}` : `Kode: ${esc(offer.promoCode)}`}
            </button>
            <button type="button" id="promo-apply-cat-btn" data-cat="${esc(offer.targetCategory)}" class="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 text-white">
              Lihat Unit ${esc(offer.targetCategory)} →
            </button>
            <button type="button" id="promo-next-btn" class="inline-flex items-center gap-1 px-3 py-2 text-xs font-mono font-medium rounded-lg border border-slate-200 dark:border-slate-700">
              ${(state.promoIndex % PROMO_OFFERS.length) + 1}/${PROMO_OFFERS.length} ›
            </button>
            <button type="button" id="promo-close-btn" aria-label="Tutup promo" class="w-9 h-9 inline-flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200/60 dark:hover:bg-slate-800">✕</button>
          </div>
        </div>
      </aside>
    `;
  }

  function renderFleetCatalog() {
    const bounds = computePriceBounds();
    const minP = state.minPrice !== null ? Math.max(bounds.min, Math.min(state.minPrice, bounds.max)) : bounds.min;
    const maxP = state.maxPrice !== null ? Math.min(bounds.max, Math.max(state.maxPrice, minP)) : bounds.max;
    const span = Math.max(1, bounds.max - bounds.min);
    const minPct = ((minP - bounds.min) / span) * 100;
    const maxPct = ((maxP - bounds.min) / span) * 100;
    const filtered = getFilteredVehicles();

    const otoCount = state.vehicles.filter((v) => v.transmission === 'Otomatis').length;
    const manCount = state.vehicles.filter((v) => v.transmission === 'Manual').length;

    const cardsHtml =
      filtered.length === 0
        ? `<div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center">
            <p class="font-display text-lg font-semibold">Tidak ada unit yang sesuai filter</p>
            <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">Coba ubah kategori, rentang tarif, atau kata kunci pencarian.</p>
            <button type="button" id="empty-reset-filters" class="mt-4 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg">Tampilkan Semua Unit</button>
           </div>`
        : `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${filtered
              .map((v) => {
                let feats = [];
                try {
                  feats = JSON.parse(v.features || '[]');
                } catch (_) {}
                const isMaint = v.status === 'maintenance';
                return `
                  <article class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between transition-colors hover:border-slate-300 dark:hover:border-slate-700">
                    <div>
                      <img src="${esc(v.imageUrl)}" alt="${esc(v.name)}" class="w-full aspect-[4/3] object-cover bg-slate-100 dark:bg-slate-800" />
                      <div class="p-5">
                        <div class="flex items-start justify-between gap-3">
                          <h3 class="font-display text-lg font-semibold text-slate-900 dark:text-white leading-snug">${esc(v.name)}</h3>
                          ${statusBadge(v.status)}
                        </div>
                        <div class="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                          <span>${esc(v.category)}</span><span>·</span>
                          <span>${esc(v.transmission)}</span><span>·</span>
                          <span>${esc(v.fuelType)}</span><span>·</span>
                          <span class="tabular-nums">${v.seats} Kursi</span><span>·</span>
                          <span class="font-mono">${esc(v.plateNumber)}</span>
                        </div>
                        ${feats.length ? `<p class="mt-3 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">${esc(feats.join(' · '))}</p>` : ''}
                      </div>
                    </div>
                    <div class="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/60">
                      <div>
                        <p class="text-xs text-slate-500 dark:text-slate-400">Tarif per hari</p>
                        <p class="font-mono text-lg font-semibold text-slate-900 dark:text-white tabular-nums">${formatRupiah(v.dailyRate)}</p>
                      </div>
                      <button type="button" data-book-vehicle="${v.id}" ${isMaint ? 'disabled' : ''} class="px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                        isMaint
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white'
                      }">
                        ${isMaint ? 'Perawatan' : 'Pesan Unit'}
                      </button>
                    </div>
                  </article>
                `;
              })
              .join('')}
           </div>`;

    return `
      <section id="katalog-armada" class="scroll-mt-16 py-14 bg-slate-50 dark:bg-slate-950 transition-colors">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          ${renderPromoBanner()}

          <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-6">
            <div>
              <h2 class="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Pilihan Armada Siap Jalan di Batam</h2>
              <p class="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
                Seluruh unit terdaftar dengan pemeriksaan berkala, pajak aktif Kepulauan Riau, serta tarif harian transparan untuk lepas kunci maupun dengan sopir.
              </p>
              ${
                state.quickSchedule.applied
                  ? `<div class="mt-3 inline-flex flex-wrap items-center gap-3 text-xs text-blue-800 dark:text-blue-200 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-1.5">
                      <span class="font-mono tabular-nums">Jadwal pilihan: ${esc(state.quickSchedule.startDate)} s/d ${esc(state.quickSchedule.endDate)} · ${esc(state.quickSchedule.pickupLocation)}</span>
                      <button type="button" id="clear-schedule-btn" class="font-semibold underline">Reset</button>
                    </div>`
                  : ''
              }
            </div>

            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div role="tablist" class="inline-flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg overflow-x-auto">
                ${['Semua', 'MPV', 'SUV', 'EV', 'Sedan']
                  .map((cat) => {
                    const active = state.category === cat;
                    return `<button type="button" data-cat-tab="${cat}" class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      active ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }">${cat}</button>`;
                  })
                  .join('')}
              </div>
              <div class="flex items-center gap-2">
                <input id="catalog-search" type="search" value="${esc(state.searchQuery)}" placeholder="Cari unit..." class="w-full sm:w-48 px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg" />
                <select id="catalog-fuel" class="px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg">
                  ${['Semua', 'Hybrid', 'Listrik', 'Diesel', 'Bensin']
                    .map((f) => `<option value="${f}" ${state.fuelFilter === f ? 'selected' : ''}>${f === 'Semua' ? 'Semua BBM' : f === 'Listrik' ? 'Listrik (EV)' : f}</option>`)
                    .join('')}
                </select>
              </div>
            </div>
          </div>

          <div class="mb-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-stretch lg:items-start">
              <div class="lg:col-span-6 space-y-2.5">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <span class="text-xs font-medium text-slate-700 dark:text-slate-300">Rentang Tarif Harian</span>
                  <span id="price-readout" class="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                    ${formatRupiah(minP)} — ${formatRupiah(maxP)} / hari
                  </span>
                </div>
                <div class="relative h-6 flex items-center">
                  <div class="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full relative">
                    <div id="price-slider-fill" class="absolute h-1.5 bg-blue-700 dark:bg-blue-500 rounded-full" style="left:${minPct}%; right:${100 - maxPct}%"></div>
                  </div>
                  <input id="price-min-input" type="range" min="${bounds.min}" max="${bounds.max}" step="${bounds.step}" value="${minP}" class="dual-range-input absolute inset-0 w-full h-6 m-0 z-10" />
                  <input id="price-max-input" type="range" min="${bounds.min}" max="${bounds.max}" step="${bounds.step}" value="${maxP}" class="dual-range-input absolute inset-0 w-full h-6 m-0 z-20" />
                </div>
                <div class="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                  <span>Min ${formatRupiah(bounds.min)}</span>
                  <span>Maks ${formatRupiah(bounds.max)}</span>
                </div>
              </div>

              <fieldset class="lg:col-span-4 space-y-2">
                <legend class="text-xs font-medium text-slate-700 dark:text-slate-300">Tipe Transmisi</legend>
                <div class="flex flex-wrap items-center gap-2.5">
                  ${[
                    { label: 'Otomatis', count: otoCount },
                    { label: 'Manual', count: manCount },
                  ]
                    .map((t) => {
                      const checked = state.transmissions.includes(t.label);
                      return `<label class="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium cursor-pointer ${
                        checked
                          ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-700 text-blue-800 dark:text-blue-200'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }">
                        <input type="checkbox" data-trans-cb="${t.label}" ${checked ? 'checked' : ''} class="w-4 h-4 rounded accent-blue-700" />
                        <span>${t.label}</span>
                        <span class="font-mono text-[11px] text-slate-500">(${t.count})</span>
                      </label>`;
                    })
                    .join('')}
                </div>
              </fieldset>

              <div class="lg:col-span-2 flex items-center lg:flex-col lg:items-end justify-between gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                <p id="fleet-count-readout" class="font-mono text-xs text-slate-600 dark:text-slate-400 tabular-nums">${filtered.length} / ${state.vehicles.length} unit</p>
                <button type="button" id="reset-filters-btn" ${hasRefinements() ? '' : 'disabled'} class="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-45">Reset Filter</button>
              </div>
            </div>
          </div>

          <div id="fleet-cards-grid">${cardsHtml}</div>
        </div>
      </section>
    `;
  }

  function renderBatamMapSection() {
    const q = state.mapSearchQuery.trim().toLowerCase();
    const filteredHubs = BATAM_HUBS.filter(
      (h) => !q || h.name.toLowerCase().includes(q) || h.area.toLowerCase().includes(q) || h.address.toLowerCase().includes(q)
    );
    const activeHub = BATAM_HUBS.find((h) => h.id === state.mapSelectedHubId) || BATAM_HUBS[1];

    return `
      <section id="peta-batam" class="scroll-mt-16 py-14 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
            <div>
              <p class="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1.5">Jangkauan Layanan Pulau Batam</p>
              <h2 class="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Peta Interaktif Titik Pengambilan Batam</h2>
            </div>
            <p class="text-sm text-slate-600 dark:text-slate-300 max-w-xl">
              Tersedia layanan antar-jemput armada ke Bandara Hang Nadim, terminal ferry internasional, kawasan bisnis Nagoya, hingga area industri Batamindo dan Kabil.
            </p>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div class="lg:col-span-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between gap-4">
              <div class="space-y-4">
                <div>
                  <h3 class="font-display text-base font-semibold text-slate-900 dark:text-white">Cari Lokasi Pengambilan di Batam</h3>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Pilih area atau titik hub di bawah untuk memfokuskan peta dan mengatur titik jemput otomatis.</p>
                </div>
                <input id="batam-hub-search" type="search" value="${esc(state.mapSearchQuery)}" placeholder="Cari bandara, ferry, Nagoya..." class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg" />
                <div class="flex flex-wrap gap-1.5">
                  ${['Bandara & Pelabuhan', 'Batam Centre', 'Nagoya & Jodoh', 'Nongsa & Sekupang']
                    .map((a) => `<button type="button" data-hub-area="${esc(a)}" class="px-2.5 py-1.5 text-[11px] font-medium rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-600">${esc(a)}</button>`)
                    .join('')}
                </div>
                <div class="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  ${filteredHubs
                    .map((h) => {
                      const sel = h.id === activeHub.id;
                      return `<button type="button" data-select-hub="${esc(h.id)}" class="w-full text-left p-3 rounded-lg border transition-colors ${
                        sel ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-700 dark:border-blue-500' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      }">
                        <p class="text-xs font-semibold text-slate-900 dark:text-white">${esc(h.name)}</p>
                        <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">${esc(h.address)}</p>
                        <p class="text-[11px] font-medium text-blue-700 dark:text-blue-400 mt-1">${esc(h.eta)}</p>
                      </button>`;
                    })
                    .join('')}
                </div>
              </div>
              <button type="button" id="apply-hub-pickup-btn" class="w-full py-2.5 px-4 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg">
                Jadikan Titik Jemput: ${esc(activeHub.name.split(' ')[0])}
              </button>
            </div>

            <div class="lg:col-span-8 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 relative min-h-[430px]">
              <div class="absolute top-3 right-3 z-20 inline-flex items-center gap-1 p-1 rounded-lg bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 shadow-sm text-xs">
                <button type="button" data-map-layer="road" class="px-2.5 py-1 rounded font-medium ${state.mapLayerMode === 'road' ? 'bg-blue-700 text-white' : 'text-slate-700 dark:text-slate-200'}">Peta Jalan</button>
                <button type="button" data-map-layer="satellite" class="px-2.5 py-1 rounded font-medium ${state.mapLayerMode === 'satellite' ? 'bg-blue-700 text-white' : 'text-slate-700 dark:text-slate-200'}">Satelit</button>
              </div>
              <div id="batam-leaflet-map" class="w-full h-full min-h-[430px] z-10"></div>
              <div class="absolute bottom-3 left-3 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono">
                ${activeHub.lat.toFixed(4)}° N, ${activeHub.lng.toFixed(4)}° E · ${esc(activeHub.name)}
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderFleetTrackingSection(embedded = false, ownerOnly = false) {
    const baseVehicles = ownerOnly
      ? state.vehicles.filter((v) => v.ownerUserId === 2 || v.ownerUserId === getActiveUser().id)
      : state.vehicles;
    const movingCount = baseVehicles.filter((v) => v.trackingStatus === 'en_route').length;
    const parkedCount = baseVehicles.length - movingCount;

    const list = baseVehicles.filter((v) => {
      if (state.trackingFilter === 'en_route') return v.trackingStatus === 'en_route';
      if (state.trackingFilter === 'parked') return v.trackingStatus !== 'en_route';
      return true;
    });
    const focusVehicle =
      list.find((v) => v.id === state.selectedTrackedVehicleId) || list[0] || baseVehicles[0] || null;
    const canSimulate = state.role === 'admin' || state.role === 'owner';

    const inner = `
      <div class="space-y-6">
        <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <p class="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">Telemetri GPS Armada</p>
            <h2 class="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Pelacakan GPS Armada Real-Time Batam</h2>
            <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">Pantau posisi terkini unit di jalan raya, kecepatan, arah kompas, serta lokasi parkir resmi di seluruh koridor Kota Batam.</p>
          </div>
          <div class="inline-flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg self-start">
            <button type="button" data-track-filter="all" class="px-3 py-1.5 text-xs font-medium rounded-md ${state.trackingFilter === 'all' ? 'bg-white dark:bg-slate-900 shadow-sm font-semibold' : 'text-slate-600 dark:text-slate-300'}">Semua (${baseVehicles.length})</button>
            <button type="button" data-track-filter="en_route" class="px-3 py-1.5 text-xs font-medium rounded-md ${state.trackingFilter === 'en_route' ? 'bg-white dark:bg-slate-900 shadow-sm font-semibold' : 'text-slate-600 dark:text-slate-300'}">Sedang Jalan (${movingCount})</button>
            <button type="button" data-track-filter="parked" class="px-3 py-1.5 text-xs font-medium rounded-md ${state.trackingFilter === 'parked' ? 'bg-white dark:bg-slate-900 shadow-sm font-semibold' : 'text-slate-600 dark:text-slate-300'}">Standby (${parkedCount})</button>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div class="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col">
            <div class="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold">
              <span>Daftar Unit Terlacak</span>
              <span class="font-mono text-slate-500">${list.length} unit</span>
            </div>
            <div class="divide-y divide-slate-100 dark:divide-slate-800 max-h-[410px] overflow-y-auto">
              ${list
                .map((v) => {
                  const active = focusVehicle && focusVehicle.id === v.id;
                  return `<div class="p-4 ${active ? 'bg-blue-50/70 dark:bg-blue-950/40' : ''}">
                    <div class="flex items-start justify-between gap-2">
                      <button type="button" data-focus-vehicle="${v.id}" class="text-left flex-1">
                        <p class="font-display text-sm font-semibold text-slate-900 dark:text-white">${esc(v.name)}</p>
                        <p class="text-[11px] font-mono text-slate-500">${esc(v.plateNumber)} · ${esc(v.ownerName)}</p>
                      </button>
                      <span class="text-[11px] font-mono font-semibold px-2 py-0.5 rounded ${
                        v.trackingStatus === 'en_route'
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }">${v.currentSpeedKmh} km/j</span>
                    </div>
                    <p class="text-xs text-slate-600 dark:text-slate-300 mt-1.5">${esc(v.trackingLocationLabel)}</p>
                    <div class="mt-2 flex items-center justify-between gap-2">
                      <span class="text-[11px] font-mono text-slate-400">${Number(v.currentLat).toFixed(4)}, ${Number(v.currentLng).toFixed(4)} · Arah ${v.currentHeading || 90}°</span>
                      ${canSimulate ? `<button type="button" data-ping-gps="${v.id}" class="text-[11px] font-semibold text-blue-700 dark:text-blue-400 hover:underline">Simulasi Ping GPS</button>` : ''}
                    </div>
                  </div>`;
                })
                .join('')}
            </div>
          </div>

          <div class="lg:col-span-7 flex flex-col gap-3">
            <div class="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 relative min-h-[370px] flex-1">
              <div id="fleet-tracking-leaflet-map" class="w-full h-full min-h-[370px] z-10"></div>
              <div class="absolute bottom-3 left-3 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                Pin hijau: sedang berjalan · Pin biru: standby · Pulau Batam
              </div>
            </div>
            ${
              focusVehicle
                ? `<div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <p class="font-semibold text-slate-900 dark:text-white">${esc(focusVehicle.name)} (${esc(focusVehicle.plateNumber)})</p>
                      <p class="text-slate-500 font-mono mt-0.5">${esc(focusVehicle.trackingLocationLabel)} · ${focusVehicle.currentSpeedKmh} km/j · Kompas ${focusVehicle.currentHeading || 90}°</p>
                    </div>
                    ${canSimulate ? `<button type="button" data-ping-gps="${focusVehicle.id}" class="px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg">Perbarui Posisi GPS</button>` : ''}
                  </div>`
                : ''
            }
          </div>
        </div>
      </div>
    `;

    if (embedded) return inner;
    return `
      <section id="pelacakan-armada" class="py-12 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 transition-colors">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">${inner}</div>
      </section>
    `;
  }

  function renderServiceMechanism() {
    return `
      <section id="alur-sewa" class="py-16 bg-slate-950 dark:bg-slate-900/90 text-white border-t border-slate-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            <div class="lg:col-span-5">
              <p class="text-xs font-medium text-blue-400 mb-2">Standar Operasional Batam</p>
              <h2 class="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">Alur Pemesanan Cepat, Transparan, dan Terukur</h2>
              <p class="mt-3 text-base text-slate-300 leading-relaxed">
                Dirancang untuk tamu bisnis lintas pelabuhan Singapura–Batam maupun perjalanan keluarga tanpa administrasi berbelit. Seluruh transaksi dan struk tercatat rapi.
              </p>
              <dl class="mt-8 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-5 pt-6 border-t border-slate-800">
                <div><dt class="font-mono text-2xl font-bold text-white">15 Menit</dt><dd class="mt-0.5 text-sm text-slate-400">Rata-rata waktu serah terima unit di terminal ferry &amp; Bandara Hang Nadim</dd></div>
                <div><dt class="font-mono text-2xl font-bold text-white">99,4%</dt><dd class="mt-0.5 text-sm text-slate-400">Tingkat ketepatan jadwal pengantaran armada di seluruh Pulau Batam</dd></div>
                <div><dt class="font-mono text-2xl font-bold text-white">&lt; 3 Detik</dt><dd class="mt-0.5 text-sm text-slate-400">Penerbitan struk lunas otomatis dan pengiriman notifikasi WhatsApp</dd></div>
              </dl>
            </div>
            <div class="lg:col-span-7 divide-y divide-slate-800 border border-slate-800 rounded-xl bg-slate-900/70">
              <div class="p-6 sm:p-7 flex flex-col sm:flex-row gap-4 sm:gap-6">
                <span class="font-mono text-lg font-semibold text-blue-400 shrink-0">01.</span>
                <div>
                  <h3 class="font-display text-lg font-semibold text-white">Cek Jadwal &amp; Upload Dokumen Syarat Sewa</h3>
                  <p class="mt-1.5 text-sm text-slate-300 leading-relaxed">Pilih titik jemput Batam, unggah e-KTP, Kartu Keluarga, dan SIM A secara digital dengan kalkulasi PPN 11% otomatis.</p>
                </div>
              </div>
              <div class="p-6 sm:p-7 flex flex-col sm:flex-row gap-4 sm:gap-6">
                <span class="font-mono text-lg font-semibold text-blue-400 shrink-0">02.</span>
                <div>
                  <h3 class="font-display text-lg font-semibold text-white">Pembayaran Gateway &amp; Struk Resmi</h3>
                  <p class="mt-1.5 text-sm text-slate-300 leading-relaxed">Bayar via QRIS atau Virtual Account. Status langsung lunas dan struk digital resmi siap dicetak maupun diunduh.</p>
                </div>
              </div>
              <div class="p-6 sm:p-7 flex flex-col sm:flex-row gap-4 sm:gap-6">
                <span class="font-mono text-lg font-semibold text-blue-400 shrink-0">03.</span>
                <div>
                  <h3 class="font-display text-lg font-semibold text-white">Pelacakan GPS &amp; Notifikasi WhatsApp Real-Time</h3>
                  <p class="mt-1.5 text-sm text-slate-300 leading-relaxed">Pantau posisi unit di Pulau Batam serta terima pembaruan status langsung ke WhatsApp pelanggan maupun pemilik mobil.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderTestimonials() {
    const filtered = state.testiCategory === 'Semua' ? TESTIMONIALS : TESTIMONIALS.filter((t) => t.category === state.testiCategory);
    return `
      <section class="py-16 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 transition-colors">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
            <div>
              <p class="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2">Ulasan Penyewa Terverifikasi · Pulau Batam</p>
              <h2 class="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Dipercaya Tamu Bisnis &amp; Keluarga di Setiap Titik Jemput Batam</h2>
              <p class="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">Evaluasi langsung dari penyewa korporat kawasan industri, pelintas terminal ferry internasional, hingga perjalanan keluarga.</p>
            </div>
            <div class="flex flex-col sm:flex-row sm:items-center gap-3">
              <div class="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <span class="font-mono">5.0 / 5.0</span><span>·</span><span class="text-xs font-normal text-slate-500">4 ulasan pilihan</span>
              </div>
              <div class="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                ${['Semua', 'Korporat', 'Bisnis', 'Keluarga']
                  .map((c) => `<button type="button" data-testi-cat="${c}" class="px-3 py-1.5 text-xs font-medium rounded-md ${state.testiCategory === c ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}">${c}</button>`)
                  .join('')}
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            ${filtered
              .map(
                (t) => `<article class="bg-slate-50/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between gap-5">
                  <div>
                    <div class="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
                      <span>${esc(t.category)} · ${esc(t.vehicleUsed)} · ${esc(t.pickupHub)}</span>
                      <span class="font-mono font-semibold text-amber-600 dark:text-amber-400">${esc(t.rating)}</span>
                    </div>
                    <blockquote class="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed">“${esc(t.quote)}”</blockquote>
                  </div>
                  <div class="pt-4 border-t border-slate-200 dark:border-slate-800">
                    <p class="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">${esc(t.outcomeMetric)}</p>
                    <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span class="font-semibold text-slate-900 dark:text-white">${esc(t.customerName)} · <span class="font-normal text-slate-500">${esc(t.org)}</span></span>
                      <span class="text-slate-400">${esc(t.tripDate)}</span>
                    </div>
                  </div>
                </article>`
              )
              .join('')}
          </div>

          <div class="mt-8 p-5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p class="text-sm text-slate-700 dark:text-slate-300">Seluruh perjalanan dilindungi asuransi All-Risk, pajak aktif Kepulauan Riau, dan dukungan darurat 24 jam di Pulau Batam.</p>
            <button type="button" id="testi-book-now-btn" class="px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg whitespace-nowrap shrink-0">Pesan Unit Sekarang</button>
          </div>
        </div>
      </section>
    `;
  }

  function renderFaq() {
    const q = state.faqSearch.trim().toLowerCase();
    const list = FAQ_ITEMS.filter((item) => {
      if (state.faqCategory !== 'Semua' && item.category !== state.faqCategory) return false;
      if (q && !item.question.toLowerCase().includes(q) && !item.answer.toLowerCase().includes(q)) return false;
      return true;
    });

    return `
      <section class="py-16 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 transition-colors">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div class="lg:col-span-5 space-y-5">
            <div>
              <p class="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2">Pusat Informasi · Operasional Batam</p>
              <h2 class="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Syarat, Ketentuan &amp; Pertanyaan Umum</h2>
              <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">Panduan ringkas mengenai dokumen penyewaan, jangkauan Pulau Batam, PPN 11%, serta kebijakan keterlambatan.</p>
            </div>
            <input id="faq-search-input" type="search" value="${esc(state.faqSearch)}" placeholder="Cari topik: KTP, Barelang, QRIS, Hang Nadim..." class="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg" />
            <div class="flex flex-wrap gap-2">
              ${['Semua', 'Syarat Sewa', 'Pembayaran & PPN', 'Antar Jemput Batam', 'Asuransi & Kebijakan']
                .map((c) => `<button type="button" data-faq-cat="${esc(c)}" class="px-3 py-1.5 text-xs font-medium rounded-lg border ${state.faqCategory === c ? 'bg-slate-900 dark:bg-blue-600 text-white border-transparent' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'}">${esc(c)}</button>`)
                .join('')}
            </div>
            <div class="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-3">
              <button type="button" id="faq-fleet-btn" class="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg">Lihat Daftar Armada</button>
              <button type="button" id="faq-map-btn" class="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg">Cek Titik Jemput Batam</button>
            </div>
          </div>

          <div class="lg:col-span-7 divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            ${list
              .map((item) => {
                const open = state.faqOpenId === item.id;
                return `<div class="p-5">
                  <button type="button" data-faq-toggle="${esc(item.id)}" class="w-full text-left flex items-start justify-between gap-4">
                    <div>
                      <span class="block text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">${esc(item.category)}</span>
                      <span class="font-display text-base font-semibold text-slate-900 dark:text-white">${esc(item.question)}</span>
                    </div>
                    <span class="text-slate-400 font-mono text-lg leading-none">${open ? '−' : '+'}</span>
                  </button>
                  ${open ? `<p class="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">${esc(item.answer)}</p>` : ''}
                </div>`;
              })
              .join('')}
          </div>
        </div>
      </section>
    `;
  }

  // Portal Pelanggan View
  function renderCustomerView() {
    const user = getActiveUser();
    const allCustomerBookings = state.bookings.filter((b) => b.userId === user.id || state.role !== 'customer');
    const paidCount = allCustomerBookings.filter((b) => b.paymentStatus === 'paid').length;
    const unpaidTotal = allCustomerBookings
      .filter((b) => b.paymentStatus === 'unpaid' && b.bookingStatus !== 'cancelled')
      .reduce((acc, b) => acc + b.totalAmount, 0);

    const filteredBookings =
      state.customerStatusFilter === 'Semua'
        ? allCustomerBookings
        : allCustomerBookings.filter((b) => b.bookingStatus === state.customerStatusFilter);

    const activeBooking = allCustomerBookings.find((b) => ['confirmed', 'active', 'pending'].includes(b.bookingStatus));

    return `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p class="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">Portal Pelanggan / ${esc(user.name)}</p>
            <h1 class="font-display text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white">Pemesanan &amp; Pembayaran Saya</h1>
          </div>
          <button type="button" data-nav="armada" class="px-4 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg self-start">+ Pesan Mobil Baru</button>
        </div>

        <dl class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <dt class="text-xs font-medium text-slate-500">Total Pemesanan</dt>
            <dd class="mt-2 font-mono text-2xl font-bold tabular-nums">${allCustomerBookings.length}</dd>
          </div>
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <dt class="text-xs font-medium text-slate-500">Transaksi Lunas</dt>
            <dd class="mt-2 font-mono text-2xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">${paidCount}</dd>
          </div>
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <dt class="text-xs font-medium text-slate-500">Tagihan Menunggu Bayar</dt>
            <dd class="mt-2 font-mono text-2xl font-bold tabular-nums">${formatRupiah(unpaidTotal)}</dd>
          </div>
        </dl>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div class="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div class="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <h2 class="font-display text-base font-semibold">Daftar Pemesanan</h2>
              <div class="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                ${[
                  { key: 'Semua', label: 'Semua' },
                  { key: 'pending', label: 'Pending' },
                  { key: 'confirmed', label: 'Terkonfirmasi' },
                  { key: 'completed', label: 'Selesai' },
                ]
                  .map(
                    (tab) => `<button type="button" data-cust-status="${tab.key}" class="px-2.5 py-1 text-xs font-medium rounded-md ${state.customerStatusFilter === tab.key ? 'bg-white dark:bg-slate-950 shadow-sm' : 'text-slate-600 dark:text-slate-400'}">${tab.label}</button>`
                  )
                  .join('')}
              </div>
            </div>
            <div class="divide-y divide-slate-200 dark:divide-slate-800">
              ${
                filteredBookings.length === 0
                  ? `<div class="p-10 text-center text-sm text-slate-500">Belum ada pemesanan pada filter ini.</div>`
                  : filteredBookings
                      .map(
                        (b) => `<div class="p-5 space-y-3">
                          <div class="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div class="flex flex-wrap items-center gap-2">
                                <span class="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400">${esc(b.bookingCode)}</span>
                                ${bookingStatusBadge(b.bookingStatus)}
                                ${kycBadge(b.kycStatus)}
                              </div>
                              <h3 class="font-display text-base font-semibold mt-1">${esc(b.vehicleName)} (${esc(b.plateNumber)})</h3>
                              <p class="text-xs text-slate-500 font-mono mt-0.5">${esc(b.startDate)} s/d ${esc(b.endDate)} (${b.totalDays} hari) · ${b.withDriver ? 'Dengan Sopir' : 'Lepas Kunci'} · ${esc(b.pickupLocation)}</p>
                              ${b.kycNotes ? `<p class="text-xs text-slate-500 mt-1">Catatan KYC: ${esc(b.kycNotes)}</p>` : ''}
                            </div>
                            <div class="text-right">
                              <p class="font-mono text-lg font-bold tabular-nums">${formatRupiah(b.totalAmount)}</p>
                              <p class="text-xs font-semibold ${b.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}">${b.paymentStatus === 'paid' ? 'LUNAS' : 'Belum Dibayar'}</p>
                            </div>
                          </div>
                          <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
                            ${
                              b.paymentStatus !== 'paid' && b.bookingStatus !== 'cancelled'
                                ? `<button type="button" data-pay-booking="${b.id}" class="px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg">Bayar Sekarang (QRIS/VA)</button>`
                                : `<button type="button" data-view-receipt="${b.id}" class="px-3.5 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 rounded-lg">Lihat &amp; Cetak Struk</button>`
                            }
                            <button type="button" data-inspect-kyc="${b.id}" class="px-3 py-2 text-xs font-medium border border-slate-300 dark:border-slate-700 rounded-lg">Berkas KYC</button>
                            ${
                              b.bookingStatus === 'pending'
                                ? `<button type="button" data-cancel-booking="${b.id}" class="px-3 py-2 text-xs font-medium text-red-700 border border-red-200 dark:border-red-900 rounded-lg">Batalkan</button>`
                                : ''
                            }
                          </div>
                        </div>`
                      )
                      .join('')
              }
            </div>
          </div>

          <div class="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <h3 class="font-display text-base font-semibold mb-3">Log Notifikasi WhatsApp</h3>
            <div class="space-y-3 max-h-[360px] overflow-y-auto">
              ${state.notifications
                .slice(0, 8)
                .map(
                  (n) => `<div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                    <div class="flex justify-between font-mono text-[11px] text-slate-500"><span>${esc(n.bookingCode)}</span><span>${esc(n.deliveryStatus)}</span></div>
                    <p class="mt-1 text-slate-700 dark:text-slate-300">${esc(n.messageBody)}</p>
                  </div>`
                )
                .join('')}
            </div>
          </div>
        </div>

        ${activeBooking ? `<div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">${renderFleetTrackingSection(true, false)}</div>` : ''}
      </div>
    `;
  }

  // Portal Pemilik Mobil (Mitra Batam) View
  function renderOwnerView() {
    const owner = getActiveUser();
    const myUnits = state.vehicles.filter((v) => v.ownerUserId === owner.id || (owner.id === 2 && v.ownerUserId === 2));
    const myUnitIds = new Set(myUnits.map((v) => v.id));
    const ownerBookings = state.bookings.filter((b) => myUnitIds.has(b.vehicleId));

    const paidBookings = ownerBookings.filter((b) => b.paymentStatus === 'paid' && b.bookingStatus !== 'cancelled');
    const grossPaid = paidBookings.reduce((s, b) => s + b.baseAmount, 0);
    const ownerNetPayout = paidBookings.reduce((s, b) => s + Math.round((b.baseAmount * (b.ownerSharePercent || 80)) / 100), 0);
    const platformFee = grossPaid - ownerNetPayout;
    const movingCount = myUnits.filter((v) => v.trackingStatus === 'en_route').length;

    let tabBody = '';
    if (state.ownerTab === 'units') {
      tabBody = `
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-200 dark:border-slate-800 font-display font-semibold">Armada Milik Mitra</div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm text-left">
              <thead class="bg-slate-50 dark:bg-slate-950 text-xs text-slate-500">
                <tr><th class="px-5 py-3">Unit &amp; Plat</th><th class="px-5 py-3">Tarif Harian</th><th class="px-5 py-3">Bagi Hasil</th><th class="px-5 py-3">Lokasi GPS</th><th class="px-5 py-3">Status</th></tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                ${myUnits
                  .map(
                    (v) => `<tr>
                      <td class="px-5 py-3 font-semibold">${esc(v.name)} <span class="block font-mono text-xs text-slate-500">${esc(v.plateNumber)} · ${esc(v.transmission)}</span></td>
                      <td class="px-5 py-3 font-mono">${formatRupiah(v.dailyRate)}</td>
                      <td class="px-5 py-3 font-mono">${v.ownerSharePercent}%</td>
                      <td class="px-5 py-3 text-xs">${esc(v.trackingLocationLabel)} · <button type="button" data-ping-gps="${v.id}" class="text-blue-700 dark:text-blue-400 font-semibold hover:underline">Ping GPS</button></td>
                      <td class="px-5 py-3">
                        <select data-vehicle-status="${v.id}" class="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                          <option value="available" ${v.status === 'available' ? 'selected' : ''}>Tersedia</option>
                          <option value="rented" ${v.status === 'rented' ? 'selected' : ''}>Disewa</option>
                          <option value="maintenance" ${v.status === 'maintenance' ? 'selected' : ''}>Perawatan</option>
                        </select>
                      </td>
                    </tr>`
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } else if (state.ownerTab === 'bookings') {
      tabBody = `
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-200 dark:border-slate-800 font-display font-semibold">Penyewa Unit Mitra &amp; Pemeriksaan KYC</div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm text-left">
              <thead class="bg-slate-50 dark:bg-slate-950 text-xs text-slate-500">
                <tr><th class="px-5 py-3">Kode Booking</th><th class="px-5 py-3">Penyewa &amp; Unit</th><th class="px-5 py-3">Bagi Hasil Anda</th><th class="px-5 py-3">Status KYC</th><th class="px-5 py-3">Aksi</th></tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                ${
                  ownerBookings.length === 0
                    ? '<tr><td colspan="5" class="px-5 py-8 text-center text-sm text-slate-500">Belum ada transaksi untuk unit mitra ini.</td></tr>'
                    : ownerBookings
                        .map((b) => {
                          const share = Math.round((b.baseAmount * (b.ownerSharePercent || 80)) / 100);
                          return `<tr>
                            <td class="px-5 py-3 font-mono text-xs">${esc(b.bookingCode)}</td>
                            <td class="px-5 py-3 text-xs"><strong>${esc(b.customerName)}</strong> · ${esc(b.vehicleName)}</td>
                            <td class="px-5 py-3 font-mono text-xs text-emerald-700 dark:text-emerald-400">${formatRupiah(share)}</td>
                            <td class="px-5 py-3">${kycBadge(b.kycStatus)}</td>
                            <td class="px-5 py-3"><button type="button" data-inspect-kyc="${b.id}" class="px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg">Periksa KYC</button></td>
                          </tr>`;
                        })
                        .join('')
                }
              </tbody>
            </table>
          </div>
        </div>
      `;
    } else {
      tabBody = `<div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">${renderFleetTrackingSection(true, true)}</div>`;
    }

    return `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p class="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">Portal Pemilik Mobil · ${esc(owner.name)}</p>
            <h1 class="font-display text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white">Manajemen Unit &amp; Bagi Hasil Mitra Batam</h1>
          </div>
          <div class="flex flex-wrap gap-2">
            <button type="button" id="owner-claim-demo-btn" class="px-3.5 py-2 text-xs font-semibold border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-lg">Hubungkan Unit Mitra Demo</button>
            <button type="button" id="open-add-vehicle-btn" class="px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg">+ Daftarkan Mobil</button>
          </div>
        </div>

        <dl class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <dt class="text-xs text-slate-500">Pendapatan Bersih Pemilik</dt>
            <dd class="mt-1.5 font-mono text-xl font-bold text-emerald-700 dark:text-emerald-400">${formatRupiah(ownerNetPayout)}</dd>
          </div>
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <dt class="text-xs text-slate-500">Gross Sewa Lunas</dt>
            <dd class="mt-1.5 font-mono text-xl font-bold">${formatRupiah(grossPaid)}</dd>
          </div>
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <dt class="text-xs text-slate-500">Komisi Pengelolaan (20%)</dt>
            <dd class="mt-1.5 font-mono text-xl font-bold">${formatRupiah(platformFee)}</dd>
          </div>
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <dt class="text-xs text-slate-500">Unit Terdaftar / Jalan</dt>
            <dd class="mt-1.5 font-mono text-xl font-bold">${myUnits.length} Unit (${movingCount} Jalan)</dd>
          </div>
        </dl>

        <div class="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          ${[
            { id: 'units', label: `Armada Saya (${myUnits.length})` },
            { id: 'bookings', label: `Pemesanan & KYC Unit (${ownerBookings.length})` },
            { id: 'tracking', label: 'Pelacakan GPS Armada' },
          ]
            .map((t) => `<button type="button" data-owner-tab="${t.id}" class="px-4 py-2 text-xs sm:text-sm font-medium rounded-lg ${state.ownerTab === t.id ? 'bg-blue-700 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'}">${t.label}</button>`)
            .join('')}
        </div>

        ${tabBody}
      </div>
    `;
  }

  // Admin Revenue 30-Day SVG Chart
  function renderAdminRevenueSvg() {
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const iso = d.toISOString().slice(0, 10);
      const label = iso.slice(5);
      const sum = state.bookings
        .filter((b) => b.paymentStatus === 'paid' && b.bookingStatus !== 'cancelled' && (b.paidAt || b.createdAt || '').slice(0, 10) === iso)
        .reduce((acc, b) => acc + b.totalAmount, 0);
      days.push({ label, total: sum });
    }
    const maxVal = Math.max(1000000, ...days.map((d) => d.total));
    const width = 640;
    const height = 160;
    const padL = 70;
    const padB = 24;
    const plotW = width - padL - 20;
    const plotH = height - padB - 16;

    const coords = days.map((d, idx) => {
      const x = padL + (idx / Math.max(1, days.length - 1)) * plotW;
      const y = 16 + plotH - (d.total / maxVal) * plotH;
      return { x: Math.round(x), y: Math.round(y), label: d.label, total: d.total };
    });

    const linePts = coords.map((c) => `${c.x},${c.y}`).join(' ');
    const areaPts = `${coords[0].x},${16 + plotH} ${linePts} ${coords[coords.length - 1].x},${16 + plotH}`;
    const totalPaid = state.bookings.filter((b) => b.paymentStatus === 'paid').reduce((s, b) => s + b.totalAmount, 0);

    return `
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h3 class="font-display text-base font-semibold">Grafik Pendapatan Harian (14 Hari Terakhir)</h3>
            <p class="text-xs text-slate-500">Akumulasi pembayaran lunas terverifikasi: <strong class="font-mono text-slate-900 dark:text-white">${formatRupiah(totalPaid)}</strong></p>
          </div>
          <span class="font-mono text-xs text-blue-700 dark:text-blue-400">QRIS &amp; Virtual Account</span>
        </div>
        <svg viewBox="0 0 ${width} ${height}" class="w-full h-44 overflow-visible">
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#1d4ed8" stop-opacity="0.22" />
              <stop offset="100%" stop-color="#1d4ed8" stop-opacity="0.0" />
            </linearGradient>
          </defs>
          <line x1="${padL}" y1="16" x2="${width - 20}" y2="16" stroke="currentColor" stroke-opacity="0.1" stroke-dasharray="3 3" />
          <line x1="${padL}" y1="${16 + plotH / 2}" x2="${width - 20}" y2="${16 + plotH / 2}" stroke="currentColor" stroke-opacity="0.1" stroke-dasharray="3 3" />
          <line x1="${padL}" y1="${16 + plotH}" x2="${width - 20}" y2="${16 + plotH}" stroke="currentColor" stroke-opacity="0.2" />
          <text x="0" y="20" font-size="10" fill="#64748b" font-family="monospace">${(maxVal / 1000000).toFixed(1)} jt</text>
          <text x="0" y="${20 + plotH / 2}" font-size="10" fill="#64748b" font-family="monospace">${(maxVal / 2000000).toFixed(1)} jt</text>
          <text x="0" y="${16 + plotH}" font-size="10" fill="#64748b" font-family="monospace">Rp 0</text>
          <polygon fill="url(#revGrad)" points="${areaPts}" />
          <polyline fill="none" stroke="#1d4ed8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${linePts}" />
          ${coords
            .map((c, idx) => {
              const showLbl = idx % 3 === 0 || idx === coords.length - 1;
              return `<circle cx="${c.x}" cy="${c.y}" r="3" fill="#1d4ed8" />` +
                (showLbl ? `<text x="${c.x}" y="${height - 4}" text-anchor="middle" font-size="9" fill="#64748b" font-family="monospace">${esc(c.label)}</text>` : '');
            })
            .join('')}
        </svg>
      </div>
    `;
  }

  function renderAdminView() {
    const totalRevenue = state.bookings.filter((b) => b.paymentStatus === 'paid').reduce((s, b) => s + b.totalAmount, 0);
    const activeCount = state.bookings.filter((b) => ['pending', 'confirmed', 'active'].includes(b.bookingStatus)).length;
    const availCount = state.vehicles.filter((v) => v.status === 'available').length;
    const bq = state.bookingSearch.trim().toLowerCase();
    const filteredBookings = state.bookings.filter(
      (b) => !bq || b.bookingCode.toLowerCase().includes(bq) || b.customerName.toLowerCase().includes(bq) || b.vehicleName.toLowerCase().includes(bq)
    );
    const wq = state.waSearch.trim().toLowerCase();
    const filteredWa = state.notifications.filter(
      (n) => !wq || n.bookingCode.toLowerCase().includes(wq) || n.recipientPhone.includes(wq) || n.messageBody.toLowerCase().includes(wq)
    );

    let tabBody = '';
    if (state.adminTab === 'fleet') {
      tabBody = `
        <div class="space-y-6">
          ${renderAdminRevenueSvg()}
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div class="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 class="font-display font-semibold">Daftar Armada &amp; Mitra Pemilik</h3>
              <button type="button" id="open-add-vehicle-btn" class="px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg">+ Tambah Armada</button>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm text-left">
                <thead class="bg-slate-50 dark:bg-slate-950 text-xs text-slate-500">
                  <tr><th class="px-5 py-3">Unit &amp; Plat</th><th class="px-5 py-3">Pemilik / Mitra</th><th class="px-5 py-3">Tarif</th><th class="px-5 py-3">Status</th><th class="px-5 py-3">Hapus</th></tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                  ${state.vehicles
                    .map(
                      (v) => `<tr>
                        <td class="px-5 py-3 font-semibold">${esc(v.name)} <span class="block font-mono text-xs text-slate-500">${esc(v.plateNumber)} · ${esc(v.category)} · ${esc(v.transmission)}</span></td>
                        <td class="px-5 py-3 text-xs">${esc(v.ownerName)} (${v.ownerSharePercent}%)</td>
                        <td class="px-5 py-3 font-mono">${formatRupiah(v.dailyRate)}</td>
                        <td class="px-5 py-3">
                          <select data-vehicle-status="${v.id}" class="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                            <option value="available" ${v.status === 'available' ? 'selected' : ''}>Tersedia</option>
                            <option value="rented" ${v.status === 'rented' ? 'selected' : ''}>Sedang Disewa</option>
                            <option value="maintenance" ${v.status === 'maintenance' ? 'selected' : ''}>Perawatan</option>
                          </select>
                        </td>
                        <td class="px-5 py-3"><button type="button" data-delete-vehicle="${v.id}" class="px-2.5 py-1 text-xs font-medium text-red-700 border border-red-200 dark:border-red-900 rounded">Hapus</button></td>
                      </tr>`
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    } else if (state.adminTab === 'bookings') {
      tabBody = `
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 class="font-display font-semibold">Kelola Pemesanan &amp; Verifikasi Berkas KYC</h3>
            <input id="admin-booking-search" type="search" value="${esc(state.bookingSearch)}" placeholder="Cari kode booking / nama..." class="px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950" />
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm text-left">
              <thead class="bg-slate-50 dark:bg-slate-950 text-xs text-slate-500">
                <tr><th class="px-5 py-3">Booking</th><th class="px-5 py-3">Penyewa &amp; Unit</th><th class="px-5 py-3">KYC</th><th class="px-5 py-3">Pembayaran</th><th class="px-5 py-3">Status Sewa</th><th class="px-5 py-3">Aksi</th></tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                ${filteredBookings
                  .map(
                    (b) => `<tr>
                      <td class="px-5 py-3 font-mono text-xs">${esc(b.bookingCode)}<span class="block text-slate-400">${esc(b.startDate)}</span></td>
                      <td class="px-5 py-3 text-xs"><strong>${esc(b.customerName)}</strong><span class="block text-slate-500">${esc(b.vehicleName)}</span></td>
                      <td class="px-5 py-3">${kycBadge(b.kycStatus)}</td>
                      <td class="px-5 py-3 font-mono text-xs">${formatRupiah(b.totalAmount)}<span class="block ${b.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}">${esc(b.paymentStatus)}</span></td>
                      <td class="px-5 py-3">
                        <select data-booking-status="${b.id}" class="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950">
                          ${['pending', 'confirmed', 'active', 'completed', 'cancelled']
                            .map((s) => `<option value="${s}" ${b.bookingStatus === s ? 'selected' : ''}>${s}</option>`)
                            .join('')}
                        </select>
                      </td>
                      <td class="px-5 py-3 flex flex-wrap gap-1.5">
                        <button type="button" data-inspect-kyc="${b.id}" class="px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200 dark:border-blue-800 rounded">Periksa KYC</button>
                        <button type="button" data-view-receipt="${b.id}" class="px-2.5 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 rounded">Struk</button>
                      </td>
                    </tr>`
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } else if (state.adminTab === 'tracking') {
      tabBody = `<div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">${renderFleetTrackingSection(true, false)}</div>`;
    } else {
      tabBody = `
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 class="font-display font-semibold">Log Notifikasi WhatsApp Real-Time</h3>
            <input id="admin-wa-search" type="search" value="${esc(state.waSearch)}" placeholder="Cari kode booking / no WA..." class="px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950" />
          </div>
          <div class="divide-y divide-slate-100 dark:divide-slate-800">
            ${filteredWa
              .map(
                (n) => `<div class="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <p class="font-mono font-semibold text-slate-900 dark:text-white">${esc(n.bookingCode)} · ${esc(n.recipientPhone)} · ${esc(n.eventType)}</p>
                    <p class="text-slate-600 dark:text-slate-300 mt-1">${esc(n.messageBody)}</p>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <span class="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono">${esc(n.deliveryStatus)}</span>
                    ${n.bookingId ? `<button type="button" data-resend-wa="${n.bookingId}" class="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 font-semibold">Kirim Ulang WA</button>` : ''}
                  </div>
                </div>`
              )
              .join('')}
          </div>
        </div>
      `;
    }

    return `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div>
          <p class="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">Console Operasional Admin Batam</p>
          <h1 class="font-display text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white">Manajemen Armada, Verifikasi KYC &amp; GPS</h1>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5"><p class="text-xs text-slate-500">Total Pendapatan Lunas</p><p class="font-mono text-xl font-bold mt-2">${formatRupiah(totalRevenue)}</p></div>
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5"><p class="text-xs text-slate-500">Pemesanan Aktif</p><p class="font-mono text-xl font-bold mt-2">${activeCount} Booking</p></div>
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5"><p class="text-xs text-slate-500">Armada Tersedia</p><p class="font-mono text-xl font-bold mt-2">${availCount} / ${state.vehicles.length} Unit</p></div>
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5"><p class="text-xs text-slate-500">Log WhatsApp</p><p class="font-mono text-xl font-bold mt-2">${state.notifications.length} Pesan</p></div>
        </div>

        <div class="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          ${[
            { id: 'fleet', label: 'Armada & Ringkasan' },
            { id: 'bookings', label: 'Pemesanan & KYC' },
            { id: 'tracking', label: 'Pelacakan GPS Armada' },
            { id: 'whatsapp', label: 'Log WhatsApp Real-Time' },
          ]
            .map((t) => `<button type="button" data-admin-tab="${t.id}" class="px-4 py-2 text-xs sm:text-sm font-medium rounded-lg ${state.adminTab === t.id ? 'bg-blue-700 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'}">${t.label}</button>`)
            .join('')}
        </div>

        ${tabBody}
      </div>
    `;
  }

  // Interactive Leaflet Maps
  function initLeafletMaps() {
    if (typeof window.L === 'undefined') return;
    const L = window.L;

    const batamEl = document.getElementById('batam-leaflet-map');
    if (batamEl) {
      if (state.maps.batam) {
        state.maps.batam.remove();
        state.maps.batam = null;
      }
      const activeHub = BATAM_HUBS.find((h) => h.id === state.mapSelectedHubId) || BATAM_HUBS[1];
      const map = L.map(batamEl, { scrollWheelZoom: false }).setView([activeHub.lat, activeHub.lng], 12);
      const tileUrl =
        state.mapLayerMode === 'satellite'
          ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      L.tileLayer(tileUrl, { attribution: '&copy; OpenStreetMap', maxZoom: 18 }).addTo(map);
      BATAM_HUBS.forEach((h) => {
        const marker = L.circleMarker([h.lat, h.lng], {
          radius: h.id === activeHub.id ? 9 : 7,
          fillColor: h.id === activeHub.id ? '#1d4ed8' : '#0f172a',
          color: '#ffffff',
          weight: 2,
          fillOpacity: 0.95,
        }).addTo(map);
        marker.bindPopup(`<strong>${esc(h.name)}</strong><br/>${esc(h.eta)}`);
        marker.on('click', () => {
          state.mapSelectedHubId = h.id;
          state.quickSchedule.pickupLocation = h.name;
          showToast(`Titik pengambilan diatur ke: ${h.name}`);
        });
      });
      state.maps.batam = map;
    }

    const trackEl = document.getElementById('fleet-tracking-leaflet-map');
    if (trackEl) {
      if (state.maps.tracking) {
        state.maps.tracking.remove();
        state.maps.tracking = null;
      }
      const focusV =
        state.vehicles.find((v) => v.id === state.selectedTrackedVehicleId) || state.vehicles[0] || { currentLat: 1.1286, currentLng: 104.0539 };
      const map = L.map(trackEl, { scrollWheelZoom: false }).setView(
        [Number(focusV.currentLat) || 1.1286, Number(focusV.currentLng) || 104.0539],
        12
      );
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 18,
      }).addTo(map);
      state.vehicles.forEach((v) => {
        const isMoving = v.trackingStatus === 'en_route';
        const marker = L.circleMarker([Number(v.currentLat) || 1.1286, Number(v.currentLng) || 104.0539], {
          radius: state.selectedTrackedVehicleId === v.id ? 10 : 8,
          fillColor: isMoving ? '#059669' : '#1d4ed8',
          color: '#ffffff',
          weight: 2,
          fillOpacity: 0.95,
        }).addTo(map);
        marker.bindPopup(`<strong>${esc(v.name)}</strong> (${esc(v.plateNumber)})<br/>${esc(v.trackingLocationLabel)}<br/>Kecepatan: ${v.currentSpeedKmh} km/j`);
      });
      state.maps.tracking = map;
    }
  }

  function closeModal() {
    const root = document.getElementById('modal-root');
    if (root) root.innerHTML = '';
  }

  // Booking Modal with Live Date Conflict Check, Preview Thumbnails & Batam Terms Checklist
  async function openBookingModal(vehicleId) {
    const v = state.vehicles.find((item) => item.id === vehicleId);
    if (!v) return;
    const root = document.getElementById('modal-root');
    const user = getActiveUser();
    let bookedDates = [];

    root.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
          <div class="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <p class="text-xs font-semibold text-blue-700 dark:text-blue-400">Formulir Pemesanan &amp; Verifikasi Dokumen (KYC)</p>
              <h3 class="font-display text-xl font-bold mt-0.5">${esc(v.name)} · ${formatRupiah(v.dailyRate)}/hari</h3>
              <p class="text-xs text-slate-500 mt-0.5">${esc(v.category)} · ${esc(v.transmission)} · ${esc(v.plateNumber)}</p>
            </div>
            <button type="button" data-close-modal class="w-9 h-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-bold">✕</button>
          </div>

          <form id="booking-kyc-form" enctype="multipart/form-data" class="space-y-4">
            <input type="hidden" name="vehicle_id" value="${v.id}" />
            <input type="hidden" name="user_id" value="${user.id}" />

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium mb-1">Nama Lengkap Penyewa (Sesuai e-KTP)</label>
                <input name="customer_name" value="${esc(user.name)}" required class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950" />
              </div>
              <div>
                <label class="block text-xs font-medium mb-1">Nomor WhatsApp Aktif</label>
                <input name="customer_whatsapp" value="${esc(user.whatsapp || '081377889900')}" placeholder="081234567890" required class="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium mb-1">Tanggal Mulai</label>
                <input id="bk-start" name="start_date" type="date" min="${todayIso}" value="${esc(state.quickSchedule.startDate)}" required class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950" />
              </div>
              <div>
                <label class="block text-xs font-medium mb-1">Tanggal Selesai</label>
                <input id="bk-end" name="end_date" type="date" min="${esc(state.quickSchedule.startDate)}" value="${esc(state.quickSchedule.endDate)}" required class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950" />
              </div>
            </div>

            <div id="bk-date-conflict-warn" class="hidden p-3 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 font-medium"></div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium mb-1">Lokasi Jemput di Batam</label>
                <select name="pickup_location" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950">
                  ${BATAM_PICKUP_LOCATIONS.map((loc) => `<option value="${esc(loc)}" ${state.quickSchedule.pickupLocation === loc ? 'selected' : ''}>${esc(loc)}</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium mb-1">Catatan Penerbangan / Ferry (Opsional)</label>
                <input name="notes" placeholder="Contoh: Tiba jam 10:30 WIB di Batam Centre" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950" />
              </div>
            </div>

            <label class="flex items-center gap-2.5 text-sm p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
              <input id="bk-driver" type="checkbox" name="with_driver" value="1" class="w-4 h-4 accent-blue-700" />
              <span>Tambahkan Jasa Sopir (+ ${formatRupiah(v.driverFeePerDay)}/hari · tidak wajib upload SIM A)</span>
            </label>

            <div class="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 space-y-3">
              <p class="text-xs font-bold text-blue-900 dark:text-blue-200">Syarat Identitas Penyewa (Upload Foto Dokumen KYC)</p>
              <div>
                <label class="block text-xs font-medium mb-1">NIK e-KTP (16 Digit)</label>
                <input name="ktp_number" maxlength="16" placeholder="2171051208940001" required class="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" />
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                ${[
                  { name: 'ktp_photo', label: 'Foto e-KTP (Wajib)', req: true, id: 'bk-ktp-file', prev: 'prev-ktp' },
                  { name: 'kk_photo', label: 'Foto Kartu Keluarga / KK (Wajib)', req: true, id: 'bk-kk-file', prev: 'prev-kk' },
                  { name: 'sim_photo', label: 'Foto SIM A (Wajib Lepas Kunci)', req: true, id: 'bk-sim-file', prev: 'prev-sim' },
                  { name: 'selfie_photo', label: 'Swafoto + KTP (Opsional)', req: false, id: 'bk-selfie-file', prev: 'prev-selfie' },
                ]
                  .map(
                    (f) => `<div class="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                      <label class="block font-semibold">${f.label}</label>
                      <input id="${f.id}" type="file" name="${f.name}" accept="image/*" ${f.req ? 'required' : ''} data-preview-target="${f.prev}" class="w-full text-[11px]" />
                      <img id="${f.prev}" alt="Preview ${f.label}" class="hidden w-full h-24 object-cover rounded border border-slate-200 dark:border-slate-700" />
                    </div>`
                  )
                  .join('')}
              </div>

              <div class="p-3 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                <p class="font-semibold text-slate-800 dark:text-slate-100">Ketentuan Operasional Pulau Batam:</p>
                <ul class="list-disc pl-4 space-y-0.5">
                  ${BATAM_REQUIREMENTS.map((req) => `<li>${esc(req)}</li>`).join('')}
                </ul>
              </div>

              <label class="flex items-start gap-2 text-xs pt-1 cursor-pointer">
                <input type="checkbox" name="terms_accepted" value="1" required class="mt-0.5 w-4 h-4 accent-blue-700" />
                <span>Saya menyatakan dokumen yang diunggah asli dan menyetujui ketentuan operasional Pulau Batam.</span>
              </label>
            </div>

            <div id="bk-price-summary" class="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 font-mono"></div>

            <div id="bk-error" class="hidden p-3 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-xs"></div>

            <div class="flex justify-end gap-3 pt-2">
              <button type="button" data-close-modal class="px-4 py-2.5 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700">Batal</button>
              <button type="submit" id="bk-submit-btn" class="px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg">Pesan &amp; Lanjut Pembayaran</button>
            </div>
          </form>
        </div>
      </div>
    `;

    try {
      const bdRes = await fetch(`api/bookings.php?mode=booked_dates&vehicle_id=${v.id}`);
      if (bdRes.ok) {
        const bdData = await bdRes.json();
        bookedDates = Array.isArray(bdData.bookedDates) ? bdData.bookedDates : [];
      }
    } catch (_) {}

    function checkConflictAndRecalc() {
      const s = document.getElementById('bk-start')?.value;
      const e = document.getElementById('bk-end')?.value;
      const withDriver = document.getElementById('bk-driver')?.checked;
      const simInp = document.getElementById('bk-sim-file');
      if (simInp) simInp.required = !withDriver;

      const warn = document.getElementById('bk-date-conflict-warn');
      if (warn && s && e) {
        const overlap = bookedDates.some((b) => b.startDate <= e && b.endDate >= s);
        if (overlap) {
          warn.textContent = 'Perhatian: Tanggal yang dipilih bertabrakan dengan jadwal booking yang sudah ada untuk unit ini.';
          warn.classList.remove('hidden');
        } else {
          warn.classList.add('hidden');
        }
      }

      const diff = Math.max(1, Math.round((Date.parse(e) - Date.parse(s)) / 86400000) || 1);
      const base = v.dailyRate * diff;
      const drv = withDriver ? v.driverFeePerDay * diff : 0;
      const tax = Math.round((base + drv) * 0.11);
      const total = base + drv + tax;
      const sumEl = document.getElementById('bk-price-summary');
      if (sumEl) {
        sumEl.innerHTML = `
          <div class="flex justify-between"><span>Sewa ${diff} hari × ${formatRupiah(v.dailyRate)}</span><span>${formatRupiah(base)}</span></div>
          ${withDriver ? `<div class="flex justify-between"><span>Jasa Sopir (${diff} hari)</span><span>${formatRupiah(drv)}</span></div>` : ''}
          <div class="flex justify-between"><span>PPN 11%</span><span>${formatRupiah(tax)}</span></div>
          <div class="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-900 dark:text-white"><span>Total Tagihan</span><span>${formatRupiah(total)}</span></div>
        `;
      }
    }

    checkConflictAndRecalc();
    document.getElementById('bk-start')?.addEventListener('change', checkConflictAndRecalc);
    document.getElementById('bk-end')?.addEventListener('change', checkConflictAndRecalc);
    document.getElementById('bk-driver')?.addEventListener('change', checkConflictAndRecalc);

    root.querySelectorAll('[data-preview-target]').forEach((inp) => {
      inp.addEventListener('change', (ev) => {
        const file = ev.target.files?.[0];
        const prev = document.getElementById(inp.getAttribute('data-preview-target'));
        if (!prev) return;
        if (file) {
          prev.src = URL.createObjectURL(file);
          prev.classList.remove('hidden');
        } else {
          prev.classList.add('hidden');
        }
      });
    });

    document.getElementById('booking-kyc-form')?.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const errBox = document.getElementById('bk-error');
      const btn = document.getElementById('bk-submit-btn');
      errBox.classList.add('hidden');
      btn.disabled = true;
      btn.textContent = 'Mengunggah berkas KYC...';
      try {
        const fd = new FormData(ev.target);
        fd.append('action', 'create_booking');
        const res = await fetch('api/bookings.php', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal membuat pemesanan.');
        await refreshAllData();
        render();
        showToast(`Booking ${data.booking.bookingCode} tersimpan!`);
        openPaymentModal(data.booking.id);
      } catch (err) {
        errBox.textContent = err.message;
        errBox.classList.remove('hidden');
        btn.disabled = false;
        btn.textContent = 'Pesan & Lanjut Pembayaran';
      }
    });
  }

  // Payment Modal matching PaymentModal.tsx (QRIS Visual + Bank VA Numbers)
  function openPaymentModal(bookingId) {
    const b = state.bookings.find((x) => x.id === bookingId);
    if (!b) return;
    const channels = [
      { id: 'QRIS Instan', title: 'QRIS Instan', sub: 'Scan QR Code untuk semua e-wallet & mobile banking' },
      { id: 'BCA Virtual Account', title: 'BCA Virtual Account', sub: 'Nomor VA: 8801 0812 9940 2211 · Konfirmasi 2 detik' },
      { id: 'Mandiri Virtual Account', title: 'Mandiri Virtual Account', sub: 'Nomor VA: 8950 2201 8840 1120 · Bebas biaya admin' },
      { id: 'GoPay / OVO Otomatis', title: 'GoPay / OVO', sub: 'Pembayaran langsung terhubung aplikasi dompet digital' },
    ];
    let selected = channels[0].id;

    const root = document.getElementById('modal-root');
    root.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
          <div class="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <p class="text-xs font-semibold text-blue-700 dark:text-blue-400">Pembayaran Otomatis</p>
              <h3 class="font-display text-lg font-bold">${esc(b.bookingCode)} · ${esc(b.vehicleName)}</h3>
            </div>
            <button type="button" data-close-modal class="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">✕</button>
          </div>
          <div class="p-4 rounded-xl bg-slate-950 text-white flex items-center justify-between gap-4">
            <div>
              <p class="text-xs text-slate-300">Total Tagihan</p>
              <p class="font-mono text-2xl font-bold mt-0.5">${formatRupiah(b.totalAmount)}</p>
            </div>
            <div class="text-right text-xs text-slate-300 font-mono">
              <p>${esc(b.startDate)}</p>
              <p>s/d ${esc(b.endDate)}</p>
            </div>
          </div>

          <div class="space-y-2">
            ${channels
              .map(
                (c, i) => `<label class="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-600">
                  <input type="radio" name="pay_channel" value="${esc(c.id)}" ${i === 0 ? 'checked' : ''} class="mt-1 accent-blue-700" />
                  <div>
                    <p class="text-sm font-semibold">${esc(c.title)}</p>
                    <p class="text-xs text-slate-500">${esc(c.sub)}</p>
                  </div>
                </label>`
              )
              .join('')}
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button type="button" data-close-modal class="px-4 py-2.5 text-sm font-medium border border-slate-300 dark:border-slate-700 rounded-lg">Bayar Nanti</button>
            <button type="button" id="confirm-pay-btn" class="px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg">Konfirmasi Pembayaran Sekarang</button>
          </div>
        </div>
      </div>
    `;
    root.querySelectorAll('input[name="pay_channel"]').forEach((r) => {
      r.addEventListener('change', () => {
        selected = r.value;
      });
    });
    document.getElementById('confirm-pay-btn')?.addEventListener('click', async () => {
      const res = await fetch('api/payment_webhook.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkout_mode: 'xampp_gateway',
          order_id: b.bookingCode,
          payment_type: selected,
          transaction_status: 'settlement',
        }),
      });
      const data = await res.json();
      if (res.ok && data.booking) {
        await refreshAllData();
        render();
        showToast('Pembayaran lunas & struk digital diterbitkan!');
        openReceiptModal(data.booking.id);
      }
    });
  }

  function openReceiptModal(bookingId) {
    const b = state.bookings.find((x) => x.id === bookingId);
    if (!b) return;
    const root = document.getElementById('modal-root');
    root.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
        <div data-receipt-printable="true" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
          <div class="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <p class="font-display font-bold text-lg">STRUK PEMBAYARAN RESMI</p>
              <p class="text-xs text-slate-500">NusaDrive Batam · Kepulauan Riau</p>
            </div>
            <button type="button" data-close-modal class="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">✕</button>
          </div>
          <div class="font-mono text-xs space-y-1.5">
            <div class="flex justify-between"><span>No. Referensi</span><span>${esc(b.paymentReference || b.bookingCode)}</span></div>
            <div class="flex justify-between"><span>Kode Booking</span><span>${esc(b.bookingCode)}</span></div>
            <div class="flex justify-between"><span>Penyewa</span><span>${esc(b.customerName)}</span></div>
            <div class="flex justify-between"><span>Armada</span><span>${esc(b.vehicleName)} (${esc(b.plateNumber)})</span></div>
            <div class="flex justify-between"><span>Periode</span><span>${esc(b.startDate)} s/d ${esc(b.endDate)} (${b.totalDays} hari)</span></div>
            <div class="flex justify-between"><span>Metode</span><span>${esc(b.paymentMethod || 'QRIS Instan')}</span></div>
            <div class="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800"><span>Tarif Dasar</span><span>${formatRupiah(b.baseAmount)}</span></div>
            <div class="flex justify-between"><span>Jasa Sopir</span><span>${formatRupiah(b.driverAmount)}</span></div>
            <div class="flex justify-between"><span>PPN 11%</span><span>${formatRupiah(b.taxAmount)}</span></div>
            <div class="flex justify-between text-sm font-bold pt-2 border-t border-slate-200 dark:border-slate-800"><span>TOTAL LUNAS</span><span>${formatRupiah(b.totalAmount)}</span></div>
          </div>
          <div class="flex gap-2 pt-2">
            <button type="button" onclick="window.print()" class="flex-1 py-2.5 text-xs font-semibold text-white bg-blue-700 rounded-lg">Cetak Struk</button>
            <button type="button" id="download-txt-receipt" class="flex-1 py-2.5 text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-lg">Unduh Struk (.txt)</button>
          </div>
        </div>
      </div>
    `;
    document.getElementById('download-txt-receipt')?.addEventListener('click', () => {
      const txt = [
        'NUSADRIVE BATAM - STRUK PEMBAYARAN RESMI',
        '========================================',
        `Referensi : ${b.paymentReference || b.bookingCode}`,
        `Booking   : ${b.bookingCode}`,
        `Penyewa   : ${b.customerName}`,
        `Armada    : ${b.vehicleName} (${b.plateNumber})`,
        `Periode   : ${b.startDate} s/d ${b.endDate} (${b.totalDays} hari)`,
        `Total     : ${formatRupiah(b.totalAmount)} (LUNAS)`,
      ].join('\n');
      const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `Struk-${b.bookingCode}.txt`;
      a.click();
    });
  }

  function openKycModal(bookingId) {
    const b = state.bookings.find((x) => x.id === bookingId);
    if (!b) return;
    const docs = [
      { label: 'Foto e-KTP', path: b.ktpPhotoPath },
      { label: 'Foto Kartu Keluarga (KK)', path: b.kkPhotoPath },
      { label: 'Foto SIM A', path: b.simPhotoPath },
      { label: 'Swafoto + KTP', path: b.selfiePhotoPath },
    ];
    const canModerate = state.role === 'admin' || state.role === 'owner';
    const root = document.getElementById('modal-root');
    root.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl">
          <div class="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <p class="text-xs font-semibold text-blue-700 dark:text-blue-400">Verifikasi Dokumen Penyewa (KYC)</p>
              <h3 class="font-display text-lg font-bold">${esc(b.bookingCode)} · ${esc(b.customerName)}</h3>
              <p class="font-mono text-xs text-slate-500">NIK: ${esc(b.ktpNumber || '-')} · WA: ${esc(b.customerWhatsapp)}</p>
            </div>
            <button type="button" data-close-modal class="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">✕</button>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            ${docs
              .map(
                (d) => `<div class="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-slate-950">
                  <p class="text-xs font-semibold mb-2">${esc(d.label)}</p>
                  ${d.path ? `<img src="${esc(d.path)}" alt="${esc(d.label)}" class="w-full h-36 object-cover rounded-lg border border-slate-200 dark:border-slate-800" />` : '<p class="text-xs text-slate-400 italic py-10 text-center">Tidak dilampirkan</p>'}
                </div>`
              )
              .join('')}
          </div>
          ${
            canModerate
              ? `<div>
                  <label class="block text-xs font-medium mb-1">Catatan Verifikasi KYC</label>
                  <input id="kyc-notes-input" value="${esc(b.kycNotes)}" placeholder="Contoh: e-KTP & SIM A valid" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
                </div>
                <div class="flex flex-wrap justify-end gap-2">
                  <button type="button" data-kyc-action="rejected" class="px-4 py-2 text-xs font-semibold text-red-700 border border-red-200 dark:border-red-900 rounded-lg">Tolak Berkas</button>
                  <button type="button" data-kyc-action="verified" class="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg">Verifikasi Valid</button>
                </div>`
              : ''
          }
        </div>
      </div>
    `;
    root.querySelectorAll('[data-kyc-action]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const status = btn.getAttribute('data-kyc-action');
        const notes = document.getElementById('kyc-notes-input').value;
        const res = await fetch('api/bookings.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update_kyc', id: b.id, kycStatus: status, kycNotes: notes }),
        });
        if (res.ok) {
          closeModal();
          await refreshAllData();
          render();
          showToast(`Status KYC ${b.bookingCode} diperbarui menjadi ${status}.`);
        }
      });
    });
  }

  // Full 10-Field Add Vehicle Modal (Year, Transmission, Fuel, Seats, Driver Fee, Owner Share)
  function openAddVehicleModal() {
    const root = document.getElementById('modal-root');
    root.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
          <div class="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 class="font-display text-lg font-bold">Tambah Armada / Unit Pemilik Batam</h3>
            <button type="button" data-close-modal class="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">✕</button>
          </div>
          <form id="add-vehicle-form" class="space-y-3 text-sm">
            <input name="name" placeholder="Nama Model (contoh: Toyota Fortuner GR)" required class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950" />
            <div class="grid grid-cols-2 gap-3">
              <input name="brand" value="Toyota" placeholder="Merek" required class="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950" />
              <select name="category" class="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950">
                <option value="MPV">MPV</option><option value="SUV">SUV</option><option value="EV">EV</option><option value="Sedan">Sedan</option>
              </select>
            </div>
            <div class="grid grid-cols-3 gap-3">
              <input name="plateNumber" placeholder="Plat (BP 1889 ND)" required class="px-3 py-2 font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950" />
              <input name="year" type="number" value="2025" min="2018" max="2026" class="px-3 py-2 font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950" />
              <input name="seats" type="number" value="7" min="2" max="12" class="px-3 py-2 font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <select name="transmission" class="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950">
                <option value="Otomatis">Otomatis</option><option value="Manual">Manual</option>
              </select>
              <select name="fuelType" class="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950">
                <option value="Bensin">Bensin</option><option value="Hybrid">Hybrid</option><option value="Listrik">Listrik</option><option value="Diesel">Diesel</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div><label class="block text-[11px] text-slate-500 mb-0.5">Tarif Harian (Rp)</label><input name="dailyRate" type="number" value="950000" required class="w-full px-3 py-2 font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950" /></div>
              <div><label class="block text-[11px] text-slate-500 mb-0.5">Biaya Sopir / Hari (Rp)</label><input name="driverFeePerDay" type="number" value="200000" required class="w-full px-3 py-2 font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950" /></div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <input name="ownerName" value="${esc(getActiveUser().name)}" placeholder="Nama Pemilik / Mitra" required class="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950" />
              <input name="ownerSharePercent" type="number" min="60" max="90" value="80" class="px-3 py-2 font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950" />
            </div>
            <div id="av-err" class="hidden text-xs text-red-600"></div>
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" data-close-modal class="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700">Batal</button>
              <button type="submit" class="px-4 py-2 font-semibold text-white bg-blue-700 rounded-lg">Simpan Unit</button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.getElementById('add-vehicle-form')?.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fd = new FormData(ev.target);
      const payload = Object.fromEntries(fd.entries());
      payload.ownerUserId = getActiveUser().role === 'owner' ? getActiveUser().id : 2;
      const res = await fetch('api/vehicles.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const eEl = document.getElementById('av-err');
        eEl.textContent = data.error || 'Gagal menyimpan unit.';
        eEl.classList.remove('hidden');
        return;
      }
      closeModal();
      await refreshAllData();
      render();
      showToast(`Unit ${payload.name} berhasil ditambahkan.`);
    });
  }

  function render() {
    syncNavChrome();
    const main = document.getElementById('app-main');
    if (!main) return;

    if (state.view === 'armada') {
      main.innerHTML =
        renderHero() +
        renderFleetCatalog() +
        renderBatamMapSection() +
        renderFleetTrackingSection(false, false) +
        renderServiceMechanism() +
        renderTestimonials() +
        renderFaq();
    } else if (state.view === 'pelanggan') {
      main.innerHTML = renderCustomerView();
    } else if (state.view === 'pemilik') {
      main.innerHTML = renderOwnerView();
    } else {
      main.innerHTML = renderAdminView();
    }

    initLeafletMaps();
    bindViewEvents();
  }

  function bindViewEvents() {
    document.getElementById('hero-explore-btn')?.addEventListener('click', () => {
      document.getElementById('katalog-armada')?.scrollIntoView({ behavior: 'smooth' });
    });
    document.getElementById('hero-map-btn')?.addEventListener('click', () => {
      document.getElementById('peta-batam')?.scrollIntoView({ behavior: 'smooth' });
    });
    document.getElementById('quick-search-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      state.quickSchedule.pickupLocation = document.getElementById('quick-pickup-location').value;
      state.quickSchedule.startDate = document.getElementById('quick-start-date').value;
      state.quickSchedule.endDate = document.getElementById('quick-end-date').value;
      state.quickSchedule.applied = true;
      state.category = document.getElementById('quick-category').value;
      render();
      document.getElementById('katalog-armada')?.scrollIntoView({ behavior: 'smooth' });
    });

    document.getElementById('promo-copy-btn')?.addEventListener('click', async () => {
      const code = PROMO_OFFERS[state.promoIndex % PROMO_OFFERS.length].promoCode;
      try {
        await navigator.clipboard?.writeText(code);
      } catch (_) {}
      state.promoCopied = true;
      render();
      setTimeout(() => {
        state.promoCopied = false;
        render();
      }, 2000);
    });
    document.getElementById('promo-apply-cat-btn')?.addEventListener('click', (e) => {
      state.category = e.currentTarget.getAttribute('data-cat') || 'Semua';
      render();
    });
    document.getElementById('promo-next-btn')?.addEventListener('click', () => {
      state.promoIndex = (state.promoIndex + 1) % PROMO_OFFERS.length;
      render();
    });
    document.getElementById('promo-close-btn')?.addEventListener('click', () => {
      state.promoDismissed = true;
      render();
    });

    document.querySelectorAll('[data-cat-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.category = btn.getAttribute('data-cat-tab');
        render();
      });
    });
    document.getElementById('clear-schedule-btn')?.addEventListener('click', () => {
      state.quickSchedule.applied = false;
      state.category = 'Semua';
      render();
    });
    document.getElementById('catalog-search')?.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      const pos = e.target.selectionStart;
      render();
      const nextInput = document.getElementById('catalog-search');
      if (nextInput) {
        nextInput.focus();
        nextInput.setSelectionRange(pos, pos);
      }
    });
    document.getElementById('catalog-fuel')?.addEventListener('change', (e) => {
      state.fuelFilter = e.target.value;
      render();
    });

    const minSlider = document.getElementById('price-min-input');
    const maxSlider = document.getElementById('price-max-input');
    if (minSlider && maxSlider) {
      minSlider.addEventListener('input', (e) => {
        const bounds = computePriceBounds();
        const curMax = state.maxPrice !== null ? state.maxPrice : bounds.max;
        state.minPrice = Math.min(Number(e.target.value), curMax);
        render();
      });
      maxSlider.addEventListener('input', (e) => {
        const bounds = computePriceBounds();
        const curMin = state.minPrice !== null ? state.minPrice : bounds.min;
        state.maxPrice = Math.max(Number(e.target.value), curMin);
        render();
      });
    }

    document.querySelectorAll('[data-trans-cb]').forEach((cb) => {
      cb.addEventListener('change', () => {
        const val = cb.getAttribute('data-trans-cb');
        if (state.transmissions.includes(val)) {
          state.transmissions = state.transmissions.filter((x) => x !== val);
        } else {
          state.transmissions.push(val);
        }
        render();
      });
    });

    const resetAction = () => {
      state.category = 'Semua';
      state.searchQuery = '';
      state.fuelFilter = 'Semua';
      state.transmissions = [];
      state.minPrice = null;
      state.maxPrice = null;
      render();
    };
    document.getElementById('reset-filters-btn')?.addEventListener('click', resetAction);
    document.getElementById('empty-reset-filters')?.addEventListener('click', resetAction);

    document.querySelectorAll('[data-book-vehicle]').forEach((btn) => {
      btn.addEventListener('click', () => openBookingModal(Number(btn.getAttribute('data-book-vehicle'))));
    });

    // Map controls
    document.getElementById('batam-hub-search')?.addEventListener('input', (e) => {
      state.mapSearchQuery = e.target.value;
      const pos = e.target.selectionStart;
      render();
      const inp = document.getElementById('batam-hub-search');
      if (inp) {
        inp.focus();
        inp.setSelectionRange(pos, pos);
      }
    });
    document.querySelectorAll('[data-hub-area]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const area = btn.getAttribute('data-hub-area');
        const found = BATAM_HUBS.find((h) => h.area === area);
        if (found) state.mapSelectedHubId = found.id;
        render();
      });
    });
    document.querySelectorAll('[data-select-hub]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.mapSelectedHubId = btn.getAttribute('data-select-hub');
        render();
      });
    });
    document.querySelectorAll('[data-map-layer]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.mapLayerMode = btn.getAttribute('data-map-layer');
        render();
      });
    });
    document.getElementById('apply-hub-pickup-btn')?.addEventListener('click', () => {
      const hub = BATAM_HUBS.find((h) => h.id === state.mapSelectedHubId);
      if (hub) {
        state.quickSchedule.pickupLocation = hub.name;
        showToast(`Titik pengambilan diatur ke: ${hub.name}`);
      }
    });

    // Tracking controls
    document.querySelectorAll('[data-track-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.trackingFilter = btn.getAttribute('data-track-filter');
        render();
      });
    });
    document.querySelectorAll('[data-focus-vehicle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.selectedTrackedVehicleId = Number(btn.getAttribute('data-focus-vehicle'));
        render();
      });
    });
    document.querySelectorAll('[data-ping-gps]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const vid = Number(btn.getAttribute('data-ping-gps'));
        const res = await fetch('api/tracking.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vehicleId: vid }),
        });
        if (res.ok) {
          await refreshAllData();
          state.selectedTrackedVehicleId = vid;
          render();
          showToast('Sinyal GPS armada Batam diperbarui.');
        }
      });
    });

    // Testimonials & FAQ CTAs
    document.querySelectorAll('[data-testi-cat]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.testiCategory = btn.getAttribute('data-testi-cat');
        render();
      });
    });
    document.getElementById('testi-book-now-btn')?.addEventListener('click', () => {
      document.getElementById('katalog-armada')?.scrollIntoView({ behavior: 'smooth' });
    });
    document.getElementById('faq-fleet-btn')?.addEventListener('click', () => {
      document.getElementById('katalog-armada')?.scrollIntoView({ behavior: 'smooth' });
    });
    document.getElementById('faq-map-btn')?.addEventListener('click', () => {
      document.getElementById('peta-batam')?.scrollIntoView({ behavior: 'smooth' });
    });
    document.getElementById('faq-search-input')?.addEventListener('input', (e) => {
      state.faqSearch = e.target.value;
      const pos = e.target.selectionStart;
      render();
      const inp = document.getElementById('faq-search-input');
      if (inp) {
        inp.focus();
        inp.setSelectionRange(pos, pos);
      }
    });
    document.querySelectorAll('[data-faq-cat]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.faqCategory = btn.getAttribute('data-faq-cat');
        render();
      });
    });
    document.querySelectorAll('[data-faq-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-faq-toggle');
        state.faqOpenId = state.faqOpenId === id ? null : id;
        render();
      });
    });

    // Customer, Owner & Admin Actions
    document.querySelectorAll('[data-cust-status]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.customerStatusFilter = btn.getAttribute('data-cust-status');
        render();
      });
    });
    document.querySelectorAll('[data-owner-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.ownerTab = btn.getAttribute('data-owner-tab');
        render();
      });
    });
    document.getElementById('owner-claim-demo-btn')?.addEventListener('click', async () => {
      const u = getActiveUser();
      const res = await fetch('api/vehicles.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'claim_demo', ownerUserId: u.id, ownerName: u.name }),
      });
      if (res.ok) {
        await refreshAllData();
        render();
        showToast('Unit mitra demo berhasil dihubungkan.');
      }
    });

    document.querySelectorAll('[data-pay-booking]').forEach((btn) => {
      btn.addEventListener('click', () => openPaymentModal(Number(btn.getAttribute('data-pay-booking'))));
    });
    document.querySelectorAll('[data-view-receipt]').forEach((btn) => {
      btn.addEventListener('click', () => openReceiptModal(Number(btn.getAttribute('data-view-receipt'))));
    });
    document.querySelectorAll('[data-cancel-booking]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.getAttribute('data-cancel-booking'));
        const res = await fetch('api/bookings.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update_status', id, bookingStatus: 'cancelled' }),
        });
        if (res.ok) {
          await refreshAllData();
          render();
          showToast('Pemesanan berhasil dibatalkan.');
        }
      });
    });
    document.querySelectorAll('[data-inspect-kyc]').forEach((btn) => {
      btn.addEventListener('click', () => openKycModal(Number(btn.getAttribute('data-inspect-kyc'))));
    });
    document.getElementById('open-add-vehicle-btn')?.addEventListener('click', openAddVehicleModal);

    document.querySelectorAll('[data-vehicle-status]').forEach((sel) => {
      sel.addEventListener('change', async () => {
        const id = Number(sel.getAttribute('data-vehicle-status'));
        const res = await fetch('api/vehicles.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update_status', id, status: sel.value }),
        });
        if (res.ok) {
          await refreshAllData();
          render();
          showToast('Status unit diperbarui.');
        }
      });
    });
    document.querySelectorAll('[data-delete-vehicle]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.getAttribute('data-delete-vehicle'));
        const res = await fetch('api/vehicles.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', id }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast(data.error || 'Gagal menghapus kendaraan.');
          return;
        }
        await refreshAllData();
        render();
        showToast('Unit berhasil dihapus.');
      });
    });
    document.querySelectorAll('[data-booking-status]').forEach((sel) => {
      sel.addEventListener('change', async () => {
        const id = Number(sel.getAttribute('data-booking-status'));
        const res = await fetch('api/bookings.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update_status', id, bookingStatus: sel.value }),
        });
        if (res.ok) {
          await refreshAllData();
          render();
          showToast('Status booking diperbarui & WhatsApp dicatat.');
        }
      });
    });
    document.getElementById('admin-booking-search')?.addEventListener('input', (e) => {
      state.bookingSearch = e.target.value;
      const pos = e.target.selectionStart;
      render();
      const inp = document.getElementById('admin-booking-search');
      if (inp) {
        inp.focus();
        inp.setSelectionRange(pos, pos);
      }
    });
    document.getElementById('admin-wa-search')?.addEventListener('input', (e) => {
      state.waSearch = e.target.value;
      const pos = e.target.selectionStart;
      render();
      const inp = document.getElementById('admin-wa-search');
      if (inp) {
        inp.focus();
        inp.setSelectionRange(pos, pos);
      }
    });
    document.querySelectorAll('[data-admin-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.adminTab = btn.getAttribute('data-admin-tab');
        render();
      });
    });
    document.querySelectorAll('[data-resend-wa]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const bookingId = Number(btn.getAttribute('data-resend-wa'));
        const res = await fetch('api/whatsapp_notify.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId }),
        });
        if (res.ok) {
          await refreshAllData();
          render();
          showToast('Pengingat WhatsApp berhasil dikirim ulang.');
        }
      });
    });
    document.querySelectorAll('#app-main [data-nav]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.view = btn.getAttribute('data-nav');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        render();
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    updateThemeButton();

    document.getElementById('theme-toggle-btn')?.addEventListener('click', toggleTheme);
    document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
      document.getElementById('mobile-drawer')?.classList.toggle('hidden');
    });

    document.querySelectorAll('header [data-nav], footer [data-nav]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        state.view = el.getAttribute('data-nav');
        document.getElementById('mobile-drawer')?.classList.add('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        render();
      });
    });

    const handleRoleChange = (newRole) => {
      state.role = newRole;
      if (newRole === 'owner') state.view = 'pemilik';
      if (newRole === 'admin') state.view = 'admin';
      if (newRole === 'customer' && (state.view === 'admin' || state.view === 'pemilik')) state.view = 'pelanggan';
      render();
    };
    document.getElementById('role-account-select')?.addEventListener('change', (e) => handleRoleChange(e.target.value));
    document.getElementById('mobile-role-select')?.addEventListener('change', (e) => handleRoleChange(e.target.value));

    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-close-modal]')) closeModal();
    });

    render();
  });
})();
