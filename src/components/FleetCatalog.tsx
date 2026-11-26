import { useMemo, useState } from 'react';
import { Car, CheckCircle2, Clock, RotateCcw, Search, SlidersHorizontal, Wrench } from 'lucide-react';
import type { Vehicle } from '../types';
import { formatRupiah } from '../utils/clientPricing';
import {
  computePriceBounds,
  extractTransmissionOptions,
  filterVehicles,
  hasActiveAdvancedFilters,
  toggleTransmissionSelection,
} from '../utils/fleetFilters';
import { PromotionalBanner } from './PromotionalBanner';
import { resolveVehicleImageUrl } from '../utils/assetImages';

interface FleetCatalogProps {
  vehicles: Vehicle[];
  loading: boolean;
  error: string | null;
  selectedCategory: string;
  activeSchedule?: {
    startDate?: string;
    endDate?: string;
    pickupLocation?: string;
  };
  onClearSchedule?: () => void;
  onCategoryChange: (cat: string) => void;
  onSelectVehicle: (vehicle: Vehicle) => void;
  onRetry: () => void;
}

const CATEGORIES = ['Semua', 'MPV', 'SUV', 'EV', 'Sedan'];

function VehicleImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div className="w-full aspect-[4/3] bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 p-4">
        <Car className="w-8 h-8 mb-2 text-slate-400 dark:text-slate-500" />
        <span className="text-xs font-medium text-center">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="w-full aspect-[4/3] object-cover bg-slate-100 dark:bg-slate-800"
    />
  );
}

function StatusLabel({ status }: { status: string }) {
  if (status === 'available') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Tersedia</span>
      </span>
    );
  }
  if (status === 'rented') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
        <Clock className="w-3.5 h-3.5" />
        <span>Sedang Disewa</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 dark:text-red-400">
      <Wrench className="w-3.5 h-3.5" />
      <span>Perawatan</span>
    </span>
  );
}

export function FleetCatalog({
  vehicles,
  loading,
  error,
  selectedCategory,
  activeSchedule,
  onClearSchedule,
  onCategoryChange,
  onSelectVehicle,
  onRetry,
}: FleetCatalogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [fuelFilter, setFuelFilter] = useState('Semua');
  const [selectedTransmissions, setSelectedTransmissions] = useState<string[]>([]);
  const [minPriceOverride, setMinPriceOverride] = useState<number | null>(null);
  const [maxPriceOverride, setMaxPriceOverride] = useState<number | null>(null);

  const priceBounds = useMemo(() => computePriceBounds(vehicles), [vehicles]);
  const transmissionOptions = useMemo(
    () => extractTransmissionOptions(vehicles),
    [vehicles]
  );

  const effectiveMinPrice =
    minPriceOverride !== null
      ? Math.max(priceBounds.min, Math.min(minPriceOverride, priceBounds.max))
      : priceBounds.min;
  const effectiveMaxPrice =
    maxPriceOverride !== null
      ? Math.min(priceBounds.max, Math.max(maxPriceOverride, effectiveMinPrice))
      : priceBounds.max;

  const filterCriteria = useMemo(
    () => ({
      category: selectedCategory,
      searchQuery,
      fuelType: fuelFilter,
      transmissions: selectedTransmissions,
      minPrice: effectiveMinPrice,
      maxPrice: effectiveMaxPrice,
    }),
    [
      selectedCategory,
      searchQuery,
      fuelFilter,
      selectedTransmissions,
      effectiveMinPrice,
      effectiveMaxPrice,
    ]
  );

  const filtered = useMemo(
    () => filterVehicles(vehicles, filterCriteria),
    [vehicles, filterCriteria]
  );

  const hasRefinements = useMemo(
    () => hasActiveAdvancedFilters(filterCriteria, priceBounds),
    [filterCriteria, priceBounds]
  );

  const handleResetFilters = () => {
    onCategoryChange('Semua');
    setSearchQuery('');
    setFuelFilter('Semua');
    setSelectedTransmissions([]);
    setMinPriceOverride(null);
    setMaxPriceOverride(null);
  };

  const priceSpan = Math.max(1, priceBounds.max - priceBounds.min);
  const minPercent = ((effectiveMinPrice - priceBounds.min) / priceSpan) * 100;
  const maxPercent = ((effectiveMaxPrice - priceBounds.min) / priceSpan) * 100;

  return (
    <section id="katalog-armada" className="scroll-mt-16 py-14 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PromotionalBanner
          onApplyOfferCategory={(category) => {
            onCategoryChange(category);
          }}
        />

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-6">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-white text-balance">
              Pilihan Armada Siap Jalan di Batam
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
              Seluruh unit terdaftar dengan pemeriksaan berkala, pajak aktif Kepulauan Riau, serta tarif harian transparan untuk lepas kunci maupun dengan sopir.
            </p>
            {activeSchedule?.startDate && activeSchedule?.endDate && (
              <div className="mt-3 inline-flex flex-wrap items-center gap-3 text-xs text-blue-800 dark:text-blue-200 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-1.5">
                <span className="font-mono tabular-nums">
                  Jadwal pilihan: {activeSchedule.startDate} s/d {activeSchedule.endDate}
                </span>
                {activeSchedule.pickupLocation && (
                  <span>· {activeSchedule.pickupLocation}</span>
                )}
                {onClearSchedule && (
                  <button
                    type="button"
                    onClick={onClearSchedule}
                    className="font-semibold underline hover:text-blue-950 dark:hover:text-white"
                  >
                    Reset
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Segmented Interactive Filter Tabs */}
            <div role="tablist" aria-label="Filter kategori armada" className="inline-flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg overflow-x-auto">
              {CATEGORIES.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => onCategoryChange(cat)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-52">
                <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  aria-label="Cari nama mobil atau merek"
                  placeholder="Cari unit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-700 dark:focus:ring-blue-500"
                />
              </div>

              <select
                aria-label="Filter jenis bahan bakar"
                value={fuelFilter}
                onChange={(e) => setFuelFilter(e.target.value)}
                className="px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-700 dark:focus:ring-blue-500"
              >
                <option value="Semua">Semua BBM</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Listrik">Listrik (EV)</option>
                <option value="Diesel">Diesel</option>
                <option value="Bensin">Bensin</option>
              </select>
            </div>
          </div>
        </div>

        {/* Advanced Filtering Toolbar: Price Range Slider + Transmission Checkboxes */}
        <div
          aria-label="Filter lanjutan armada"
          className="mb-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-stretch lg:items-start">
            {/* Dual-Thumb Price Range Slider */}
            <div className="lg:col-span-6 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                  <span>Rentang Tarif Harian</span>
                </span>
                <span
                  data-testid="price-range-readout"
                  className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100 tabular-nums"
                >
                  {formatRupiah(effectiveMinPrice)} — {formatRupiah(effectiveMaxPrice)} / hari
                </span>
              </div>

              <div className="relative h-6 flex items-center">
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full relative">
                  <div
                    className="absolute h-1.5 bg-blue-700 dark:bg-blue-500 rounded-full"
                    style={{
                      left: `${minPercent}%`,
                      right: `${100 - maxPercent}%`,
                    }}
                  />
                </div>

                <input
                  type="range"
                  aria-label="Harga sewa minimum per hari"
                  min={priceBounds.min}
                  max={priceBounds.max}
                  step={priceBounds.step}
                  value={effectiveMinPrice}
                  onChange={(e) => {
                    const nextMin = Number(e.target.value);
                    const clamped = Math.min(nextMin, effectiveMaxPrice);
                    setMinPriceOverride(clamped);
                  }}
                  className="dual-range-input absolute inset-0 w-full h-6 m-0 z-10"
                />

                <input
                  type="range"
                  aria-label="Harga sewa maksimum per hari"
                  min={priceBounds.min}
                  max={priceBounds.max}
                  step={priceBounds.step}
                  value={effectiveMaxPrice}
                  onChange={(e) => {
                    const nextMax = Number(e.target.value);
                    const clamped = Math.max(nextMax, effectiveMinPrice);
                    setMaxPriceOverride(clamped);
                  }}
                  className="dual-range-input absolute inset-0 w-full h-6 m-0 z-20"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                <span>Min {formatRupiah(priceBounds.min)}</span>
                <span>Maks {formatRupiah(priceBounds.max)}</span>
              </div>
            </div>

            {/* Transmission Type Checkboxes */}
            <fieldset className="lg:col-span-4 space-y-2">
              <legend className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Tipe Transmisi
              </legend>
              <div className="flex flex-wrap items-center gap-2.5">
                {transmissionOptions.map((option) => {
                  const checked = selectedTransmissions.includes(option.value);
                  return (
                    <label
                      key={option.value}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
                        checked
                          ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-700 dark:border-blue-500 text-blue-800 dark:text-blue-200'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setSelectedTransmissions((prev) =>
                            toggleTransmissionSelection(prev, option.value)
                          )
                        }
                        className="w-4 h-4 rounded accent-blue-700 dark:accent-blue-500"
                      />
                      <span>{option.value}</span>
                      <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                        ({option.count})
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {/* Count & Reset Action */}
            <div className="lg:col-span-2 flex items-center lg:flex-col lg:items-end justify-between gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
              <p
                data-testid="fleet-result-count"
                className="font-mono text-xs text-slate-600 dark:text-slate-400 tabular-nums"
              >
                {filtered.length} / {vehicles.length} unit
              </p>

              <button
                type="button"
                disabled={!hasRefinements}
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-45 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filter</span>
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-slate-200 dark:bg-slate-800" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                  <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-full mt-4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900 rounded-xl p-8 text-center">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-slate-900 dark:bg-blue-600 rounded-lg hover:bg-slate-800 dark:hover:bg-blue-500"
            >
              Muat Ulang Armada
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center">
            <p className="font-display text-lg font-semibold text-slate-900 dark:text-white">
              Tidak ada unit yang sesuai filter
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Coba ubah kategori, rentang harga, pilihan transmisi, atau kata kunci pencarian untuk melihat unit lain yang tersedia.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/50"
            >
              Tampilkan Semua Unit
            </button>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((vehicle) => {
              let parsedFeatures: string[] = [];
              try {
                parsedFeatures = JSON.parse(vehicle.features);
              } catch {
                parsedFeatures = [];
              }
              const isMaintenance = vehicle.status === 'maintenance';

              return (
                <article
                  key={vehicle.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between transition-colors hover:border-slate-300 dark:hover:border-slate-700"
                >
                  <div>
                    <VehicleImage
                      src={resolveVehicleImageUrl(vehicle.imageUrl, vehicle.category)}
                      alt={vehicle.name}
                    />
                    <div className="p-5">
                      {/* Lead directly with primary title + status */}
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white leading-snug">
                          {vehicle.name}
                        </h3>
                        <StatusLabel status={vehicle.status} />
                      </div>

                      {/* Clean unboxed inline metadata with typographic separators */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <span>{vehicle.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{vehicle.transmission}</span>
                        <span aria-hidden="true">·</span>
                        <span>{vehicle.fuelType}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{vehicle.seats} Kursi</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{vehicle.plateNumber}</span>
                      </div>

                      {parsedFeatures.length > 0 && (
                        <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                          {parsedFeatures.join(' · ')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/60">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Tarif per hari</p>
                      <p className="font-mono text-lg font-semibold text-slate-900 dark:text-white tabular-nums">
                        {formatRupiah(vehicle.dailyRate)}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isMaintenance}
                      onClick={() => onSelectVehicle(vehicle)}
                      className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                        isMaintenance
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white'
                      }`}
                    >
                      {isMaintenance ? 'Perawatan' : 'Pesan Unit'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
