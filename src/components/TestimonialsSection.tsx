import { useMemo, useState } from 'react';
import { ArrowRight, Star } from 'lucide-react';
import {
  BATAM_TESTIMONIALS,
  filterTestimonials,
  summarizeTestimonials,
  TESTIMONIAL_CATEGORIES,
  TestimonialCategory,
} from '../utils/testimonials';

interface TestimonialsSectionProps {
  onBookNow: () => void;
}

export function TestimonialsSection({ onBookNow }: TestimonialsSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<TestimonialCategory>('Semua');

  const visibleTestimonials = useMemo(
    () => filterTestimonials(BATAM_TESTIMONIALS, selectedCategory),
    [selectedCategory]
  );

  const summary = useMemo(() => summarizeTestimonials(BATAM_TESTIMONIALS), []);

  const [featured, ...secondary] = visibleTestimonials;

  return (
    <section
      id="ulasan-pelanggan"
      aria-labelledby="testimonials-heading"
      className="py-16 scroll-mt-16 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header + Verified Summary + Interactive Filter */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-2">
              Ulasan Penyewa Terverifikasi · Pulau Batam
            </p>
            <h2
              id="testimonials-heading"
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white text-balance"
            >
              Dipercaya Tamu Bisnis &amp; Keluarga di Setiap Titik Jemput Batam
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Evaluasi langsung dari penyewa korporat kawasan industri, pelintas terminal ferry internasional, hingga perjalanan keluarga di Kepulauan Riau.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center lg:flex-col lg:items-end gap-4 shrink-0">
            <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-1 text-amber-500" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star key={idx} className="w-4 h-4 fill-amber-500 text-amber-500" />
                ))}
              </div>
              <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                {summary.averageRating.toFixed(1)} / 5.0
              </span>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
              <span className="text-slate-600 dark:text-slate-400 tabular-nums">
                {summary.totalCount} ulasan pilihan
              </span>
            </div>

            <div
              role="tablist"
              aria-label="Filter kategori ulasan pelanggan"
              className="inline-flex flex-wrap items-center gap-1 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
            >
              {TESTIMONIAL_CATEGORIES.map((category) => {
                const active = selectedCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Balanced 2-Column Proof Grid */}
        {visibleTestimonials.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
            {visibleTestimonials.map((item, idx) => (
              <article
                key={item.id}
                data-testid={idx === 0 ? 'testimonial-featured' : 'testimonial-card'}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between gap-5"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      {item.category} · {item.vehicleUsed} · {item.pickupHub}
                    </span>
                    <span className="font-mono tabular-nums text-amber-600 dark:text-amber-400 font-semibold">
                      {item.rating.toFixed(1)} ★
                    </span>
                  </div>

                  <blockquote className="text-sm sm:text-[15px] text-slate-800 dark:text-slate-100 leading-relaxed">
                    &ldquo;{item.quote}&rdquo;
                  </blockquote>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <p className="text-xs font-mono font-medium text-blue-700 dark:text-blue-400">
                    {item.outcomeMetric}
                  </p>
                  <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
                    <div>
                      <span className="font-display font-semibold text-slate-900 dark:text-white">
                        {item.customerName}
                      </span>
                      <span aria-hidden="true" className="mx-1.5 text-slate-300 dark:text-slate-700">·</span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {item.role}, {item.organization}
                      </span>
                    </div>
                    <span className="font-mono text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                      {item.tripDate}
                    </span>
                  </div>
                </div>
              </article>
            ))}

            {secondary.length === 0 && featured && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
                    Jadwalkan Unit Pilihan Anda
                  </p>
                  <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white mt-1.5">
                    Siap Berangkat dari {featured.pickupHub}?
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    Pesan unit seperti {featured.vehicleUsed} langsung dari katalog armada dengan tarif transparan PPN 11%, pembayaran QRIS/VA instan, dan notifikasi WhatsApp otomatis.
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={onBookNow}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <span>Pilih Armada Sekarang</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom Proof CTA Strip */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Seluruh perjalanan dilindungi asuransi All-Risk, pajak aktif Kepulauan Riau, dan dukungan darurat 24 jam di Pulau Batam.
          </p>
          <button
            type="button"
            onClick={onBookNow}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <span>Pesan Unit Sekarang</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
