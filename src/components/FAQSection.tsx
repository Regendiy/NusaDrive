import { useMemo, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import {
  BATAM_FAQ_ITEMS,
  FAQ_CATEGORIES,
  FaqCategory,
  filterFaqItems,
} from '../utils/faq';

interface FAQSectionProps {
  onExploreFleet: () => void;
  onExploreMap: () => void;
}

export function FAQSection({ onExploreFleet, onExploreMap }: FAQSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<FaqCategory>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(BATAM_FAQ_ITEMS[0]?.id ?? null);

  const filteredItems = useMemo(
    () => filterFaqItems(BATAM_FAQ_ITEMS, selectedCategory, searchQuery),
    [selectedCategory, searchQuery]
  );

  const handleSelectCategory = (category: FaqCategory) => {
    setSelectedCategory(category);
    const nextItems = filterFaqItems(BATAM_FAQ_ITEMS, category, searchQuery);
    if (nextItems.length > 0 && !nextItems.some((item) => item.id === openId)) {
      setOpenId(nextItems[0].id);
    }
  };

  return (
    <section
      id="faq-batam"
      aria-labelledby="faq-heading"
      className="py-16 scroll-mt-16 bg-white dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Sticky Summary & Filters */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-2">
                Pusat Informasi · Operasional Batam
              </p>
              <h2
                id="faq-heading"
                className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white text-balance"
              >
                Syarat, Ketentuan &amp; Pertanyaan Umum
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                Panduan ringkas mengenai dokumen penyewaan, jangkauan area Pulau Batam, perhitungan pajak PPN 11%, serta kebijakan keterlambatan ferry maupun penerbangan.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                aria-label="Cari pertanyaan sewa mobil Batam"
                placeholder="Cari topik: KTP, Barelang, QRIS, Hang Nadim..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 dark:focus:ring-blue-500"
              />
            </div>

            {/* Interactive Topic Filter Tabs */}
            <div
              role="tablist"
              aria-label="Filter topik pertanyaan umum"
              className="flex flex-wrap gap-1.5"
            >
              {FAQ_CATEGORIES.map((category) => {
                const active = selectedCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => handleSelectCategory(category)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-slate-900 dark:bg-blue-600 text-white border-slate-900 dark:border-blue-600'
                        : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>

            {/* Helpful Navigation Actions */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onExploreFleet}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap"
              >
                Lihat Daftar Armada
              </button>
              <button
                type="button"
                onClick={onExploreMap}
                className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
              >
                Cek Titik Jemput Batam
              </button>
            </div>
          </div>

          {/* Right Accordion List */}
          <div className="lg:col-span-7">
            {filteredItems.length === 0 ? (
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Pertanyaan tidak ditemukan untuk kata kunci tersebut.
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Coba reset filter kategori atau gunakan kata kunci yang lebih umum seperti &ldquo;dokumen&rdquo;, &ldquo;PPN&rdquo;, atau &ldquo;ferry&rdquo;.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('Semua');
                    setSearchQuery('');
                    setOpenId(BATAM_FAQ_ITEMS[0]?.id ?? null);
                  }}
                  className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-blue-700 dark:bg-blue-600 hover:bg-blue-800 dark:hover:bg-blue-500 rounded-lg transition-colors"
                >
                  Reset Filter FAQ
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden">
                {filteredItems.map((item) => {
                  const isOpen = openId === item.id;
                  const panelId = `${item.id}-panel`;
                  const buttonId = `${item.id}-button`;

                  return (
                    <div key={item.id}>
                      <h3>
                        <button
                          id={buttonId}
                          type="button"
                          aria-expanded={isOpen}
                          aria-controls={panelId}
                          onClick={() => setOpenId(isOpen ? null : item.id)}
                          className="w-full px-5 sm:px-6 py-4 sm:py-5 text-left flex items-start justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-700 dark:focus-visible:ring-blue-500"
                        >
                          <div className="space-y-1">
                            <span className="block text-xs font-medium text-blue-700 dark:text-blue-400">
                              {item.category}
                            </span>
                            <span className="block font-display text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                              {item.question}
                            </span>
                          </div>
                          <ChevronDown
                            className={`w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0 mt-1 transition-transform duration-200 ${
                              isOpen ? 'rotate-180 text-blue-700 dark:text-blue-400' : ''
                            }`}
                          />
                        </button>
                      </h3>

                      {isOpen && (
                        <div
                          id={panelId}
                          role="region"
                          aria-labelledby={buttonId}
                          className="px-5 sm:px-6 pb-5 pt-0.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed"
                        >
                          {item.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
