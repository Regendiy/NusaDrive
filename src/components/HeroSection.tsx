import { useEffect, useState } from 'react';
import { ArrowRight, Calendar, MapPin, Search } from 'lucide-react';
import {
  addDaysIsoDate,
  BATAM_PICKUP_LOCATIONS,
  getTodayIsoDate,
} from '../utils/clientPricing';

interface HeroSectionProps {
  selectedPickupLocation?: string;
  onQuickSearch: (filters: {
    startDate: string;
    endDate: string;
    category: string;
    pickupLocation: string;
  }) => void;
  onExploreFleet: () => void;
  onExploreMap: () => void;
}

export function HeroSection({
  selectedPickupLocation,
  onQuickSearch,
  onExploreFleet,
  onExploreMap,
}: HeroSectionProps) {
  const today = getTodayIsoDate();
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(addDaysIsoDate(today, 2));
  const [category, setCategory] = useState('Semua');
  const [pickupLocation, setPickupLocation] = useState<string>(BATAM_PICKUP_LOCATIONS[0]);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (selectedPickupLocation) {
      setPickupLocation(selectedPickupLocation);
    }
  }, [selectedPickupLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onQuickSearch({ startDate, endDate, category, pickupLocation });
  };

  const pickupOptions = BATAM_PICKUP_LOCATIONS.includes(
    pickupLocation as (typeof BATAM_PICKUP_LOCATIONS)[number]
  )
    ? [...BATAM_PICKUP_LOCATIONS]
    : [pickupLocation, ...BATAM_PICKUP_LOCATIONS];

  return (
    <section
      id="top"
      className="bg-gradient-to-b from-slate-50 via-white to-white dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 lg:pt-14 lg:pb-16">
        {/* 2-Column Editorial Hero Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          <div className="lg:col-span-5 flex flex-col justify-between py-1">
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400 tracking-normal mb-3">
                Batam Centre · Hang Nadim · Nagoya · Harbour Bay · Nongsa
              </p>
              <h1
                className="font-display font-bold tracking-tight text-slate-950 dark:text-white text-balance"
                style={{ fontSize: 'clamp(2.25rem, 3.6vw, 3.45rem)', lineHeight: 1.07 }}
              >
                Sewa mobil di Batam dengan konfirmasi instan.
              </h1>
              <p className="mt-5 text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                Pilih unit MPV, SUV, Sedan, atau mobil listrik terawat untuk perjalanan bisnis dan wisata di Batam. Hitung tarif transparan, bayar otomatis lewat QRIS atau Virtual Account, cetak struk digital, dan terima status langsung di WhatsApp.
              </p>
            </div>

            <div className="mt-8 space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onExploreFleet}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Pilih Armada Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onExploreMap}
                  className="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <MapPin className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                  <span>Lihat Peta Batam</span>
                </button>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-6 text-sm">
                <div>
                  <p className="font-mono text-lg font-bold text-slate-950 dark:text-white tabular-nums">15 Menit</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Antar ke pelabuhan &amp; bandara</p>
                </div>
                <div>
                  <p className="font-mono text-lg font-bold text-slate-950 dark:text-white tabular-nums">Struk &amp; WA</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Bukti pembayaran terverifikasi</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="h-full min-h-[280px] lg:min-h-[410px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 relative">
              {!imgError ? (
                <img
                  src="/src/assets/images/hero_rental_fleet_1794672684541.jpg"
                  alt="Armada mobil eksekutif NusaDrive di Kota Batam"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-full h-full lg:h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-slate-950 text-white text-center">
                  <p className="font-display text-xl font-semibold">Armada Eksekutif NusaDrive Batam</p>
                  <p className="text-sm text-slate-300 mt-1">MPV · SUV · Sedan · Kendaraan Listrik</p>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 bg-gradient-to-t from-slate-950/95 via-slate-950/65 to-transparent text-white flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-300">Operasional Resmi Pulau Batam · 2024–2025</p>
                  <p className="font-display text-base sm:text-lg font-semibold mt-0.5">
                    Asuransi All-Risk &amp; Layanan Darurat 24 Jam
                  </p>
                </div>
                <p className="font-mono text-sm sm:text-base font-semibold tabular-nums text-white">
                  Mulai Rp 950.000 / hari
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Quick Availability & Booking Strip */}
        <form
          onSubmit={handleSubmit}
          aria-label="Pencarian cepat ketersediaan armada Batam"
          className="mt-8 p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end transition-colors"
        >
          <div>
            <label htmlFor="quick-pickup-location" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Lokasi Pengambilan (Batam)
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                id="quick-pickup-location"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-700 dark:focus:ring-blue-500"
              >
                {pickupOptions.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="quick-start-date" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Tanggal Mulai
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="quick-start-date"
                type="date"
                min={today}
                value={startDate}
                onChange={(e) => {
                  const val = e.target.value;
                  setStartDate(val);
                  if (val > endDate) {
                    setEndDate(addDaysIsoDate(val, 1));
                  }
                }}
                className="w-full pl-9 pr-3 py-2.5 text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-700 dark:focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="quick-end-date" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Tanggal Selesai
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="quick-end-date"
                type="date"
                min={startDate}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-700 dark:focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label htmlFor="quick-category" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                Kategori Unit
              </label>
              <select
                id="quick-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-700 dark:focus:ring-blue-500"
              >
                <option value="Semua">Semua</option>
                <option value="MPV">MPV</option>
                <option value="SUV">SUV</option>
                <option value="EV">EV</option>
                <option value="Sedan">Sedan</option>
              </select>
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-slate-950 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[42px]"
            >
              <Search className="w-4 h-4" />
              <span>Cari</span>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
