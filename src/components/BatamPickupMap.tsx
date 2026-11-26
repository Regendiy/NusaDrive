import { useCallback, useEffect, useState } from 'react';
import {
  AdvancedMarker,
  APILoadingStatus,
  InfoWindow,
  Map as GoogleMap,
  MapCameraChangedEvent,
  Pin,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  Compass,
  MapPin,
  Minus,
  Navigation,
  Plus,
  RotateCcw,
  Search,
} from 'lucide-react';
import type { ThemeMode } from '../utils/theme';

interface BatamPlacePin {
  id: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
}

interface BatamPickupMapProps {
  theme: ThemeMode;
  selectedLocation?: string;
  onSelectPickupLocation: (locationName: string) => void;
}

interface PlaceLatLngLike {
  lat: (() => number) | number;
  lng: (() => number) | number;
}

interface PlaceResultLike {
  id: string;
  displayName?: string | null;
  formattedAddress?: string | null;
  location?: PlaceLatLngLike | null;
}

const BATAM_CENTER = { lat: 1.104, lng: 104.045 };
const BATAM_DEFAULT_ZOOM = 12;
const BATAM_BOUNDS = {
  south: 0.96,
  west: 103.88,
  north: 1.22,
  east: 104.2,
};

const QUICK_SEARCH_PRESETS = [
  { label: 'Bandara & Pelabuhan', query: 'Bandara Hang Nadim Pelabuhan Batam Centre Harbour Bay' },
  { label: 'Batam Centre', query: 'Batam Centre Ferry Terminal Mega Mall Batam' },
  { label: 'Nagoya & Jodoh', query: 'Nagoya Hill Mall Batam' },
  { label: 'Nongsa & Sekupang', query: 'Nongsa Pura Sekupang Ferry Terminal Batam' },
];

const SESSION_CACHE_KEY = 'nusadrive_batam_places_v1';

function isQuotaError(err: unknown): boolean {
  const msg =
    err instanceof Error
      ? `${err.message} ${String((err as { code?: unknown }).code ?? '')} ${String((err as { status?: unknown }).status ?? '')}`
      : String(err);
  return (
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('OVER_QUERY_LIMIT') ||
    msg.includes('OverQuotaMapError') ||
    msg.includes('QuotaExceededError')
  );
}

interface PlaceMarkerProps {
  place: BatamPlacePin;
  isSelected: boolean;
  onSelectMarker: (place: BatamPlacePin) => void;
  onCloseMarker: () => void;
  onApplyPickup: (place: BatamPlacePin) => void;
}

function BatamPlaceMarker({
  place,
  isSelected,
  onSelectMarker,
  onCloseMarker,
  onApplyPickup,
}: PlaceMarkerProps) {
  const [markerRef, marker] = useAdvancedMarkerRef();

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={place.location}
        title={place.name}
        onClick={() => onSelectMarker(place)}
      >
        <Pin
          background={isSelected ? '#1d4ed8' : '#0f172a'}
          borderColor={isSelected ? '#1e3a8a' : '#334155'}
          glyphColor="#ffffff"
          scale={isSelected ? 1.2 : 1.0}
        />
      </AdvancedMarker>

      {isSelected && marker && (
        <InfoWindow
          anchor={marker}
          maxWidth={250}
          onCloseClick={onCloseMarker}
        >
          <div className="p-1 text-slate-900 space-y-2">
            <div>
              <p className="font-display text-sm font-bold leading-snug">{place.name}</p>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{place.address}</p>
            </div>
            <button
              type="button"
              onClick={() => onApplyPickup(place)}
              className="w-full px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors"
            >
              Pilih sebagai Titik Jemput
            </button>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

function BatamMapInner({
  theme,
  selectedLocation,
  onSelectPickupLocation,
}: BatamPickupMapProps) {
  const map = useMap('batam-pickup-map');
  const placesLib = useMapsLibrary('places');
  const apiStatus = useApiLoadingStatus();

  const [zoom, setZoom] = useState(BATAM_DEFAULT_ZOOM);
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'satellite'>('roadmap');

  const [searchQuery, setSearchQuery] = useState('');
  const [places, setPlaces] = useState<BatamPlacePin[]>([]);
  const [activePlaceId, setActivePlaceId] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    if (apiStatus === APILoadingStatus.AUTH_FAILURE) {
      window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
    }
  }, [apiStatus]);

  const runPlaceSearch = useCallback(
    async (queryText: string, useSessionCache = false) => {
      if (!placesLib) return;
      const trimmed = queryText.trim();
      if (!trimmed) return;

      if (useSessionCache) {
        try {
          const cached = sessionStorage.getItem(SESSION_CACHE_KEY);
          if (cached) {
            const parsed = JSON.parse(cached) as BatamPlacePin[];
            if (Array.isArray(parsed) && parsed.length > 0) {
              setPlaces(parsed);
              return;
            }
          }
        } catch {
          // Ignore invalid cache
        }
      }

      setSearching(true);
      setSearchError(null);

      try {
        const request = {
          textQuery: `${trimmed} Batam`,
          fields: ['id', 'displayName', 'formattedAddress', 'location'],
          locationBias: BATAM_BOUNDS,
          language: 'id',
          region: 'id',
          maxResultCount: 6,
        };

        const response = await (placesLib as unknown as {
          Place: { searchByText: (req: typeof request) => Promise<{ places?: PlaceResultLike[] }> };
        }).Place.searchByText(request);
        const rawPlaces = response?.places ?? [];

        const mapped: BatamPlacePin[] = rawPlaces
          .filter((p: PlaceResultLike) => Boolean(p.location && p.displayName))
          .map((p: PlaceResultLike) => {
            const loc = p.location!;
            return {
              id: p.id,
              name: p.displayName || 'Lokasi Batam',
              address: p.formattedAddress || 'Kota Batam, Kepulauan Riau',
              location: {
                lat: typeof loc.lat === 'function' ? loc.lat() : Number(loc.lat),
                lng: typeof loc.lng === 'function' ? loc.lng() : Number(loc.lng),
              },
            };
          });

        setPlaces(mapped);
        if (mapped.length > 0) {
          if (useSessionCache) {
            try {
              sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(mapped));
            } catch {
              // Storage optional
            }
          } else {
            // Pan to first result on explicit user search
            const first = mapped[0];
            setActivePlaceId(first.id);
            setZoom(14);
            if (map) {
              map.panTo(first.location);
              map.setZoom(14);
            }
          }
        } else {
          setSearchError('Tidak ditemukan lokasi di Batam untuk kata kunci tersebut.');
        }
      } catch (err) {
        if (isQuotaError(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
          setSearchError('Kuota pencarian lokasi sementara tercapai.');
        } else {
          setSearchError('Gagal memuat titik lokasi Batam. Peta tetap dapat digeser dan di-zoom.');
        }
      } finally {
        setSearching(false);
      }
    },
    [placesLib, map]
  );

  // Run one lightweight initial Batam Places search when library is ready
  useEffect(() => {
    if (placesLib) {
      runPlaceSearch('Bandara Hang Nadim Pelabuhan Batam Centre', true);
    }
  }, [placesLib, runPlaceSearch]);

  const handleCameraChanged = useCallback((ev: MapCameraChangedEvent) => {
    setZoom(ev.detail.zoom);
  }, []);

  const handleZoomIn = () => {
    const current = map?.getZoom() ?? zoom;
    const nextZoom = Math.min(19, Math.round(current) + 1);
    setZoom(nextZoom);
    map?.setZoom(nextZoom);
  };

  const handleZoomOut = () => {
    const current = map?.getZoom() ?? zoom;
    const nextZoom = Math.max(10, Math.round(current) - 1);
    setZoom(nextZoom);
    map?.setZoom(nextZoom);
  };

  const handleResetCenter = () => {
    setZoom(BATAM_DEFAULT_ZOOM);
    if (map) {
      map.panTo(BATAM_CENTER);
      map.setZoom(BATAM_DEFAULT_ZOOM);
    }
  };

  const handleFocusPlace = (place: BatamPlacePin) => {
    setActivePlaceId(place.id);
    setZoom(15);
    if (map) {
      map.panTo(place.location);
      map.setZoom(15);
    }
  };

  const handleApplyPickup = (place: BatamPlacePin) => {
    onSelectPickupLocation(`${place.name} — Batam`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Left Interactive Place Finder & Batam Hub Selector */}
      <div className="lg:col-span-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4 transition-colors">
        <div className="space-y-4">
          <div>
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Cari Lokasi Pengambilan di Batam
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              Geser peta untuk menjelajahi area Batam, gunakan tombol zoom, atau cari pelabuhan, bandara, hotel, dan kawasan industri.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              runPlaceSearch(searchQuery, false);
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                aria-label="Cari lokasi jemput di Batam"
                placeholder="Contoh: Harbour Bay, Nagoya..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-700 dark:focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={searching || !placesLib}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              {searching ? 'Mencari...' : 'Cari'}
            </button>
          </form>

          {/* Interactive Zone Presets */}
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Area cepat Batam">
            {QUICK_SEARCH_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setSearchQuery(preset.label);
                  runPlaceSearch(preset.query, false);
                }}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors whitespace-nowrap"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Results List from Places API */}
          {searchError && (
            <p className="text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              {searchError}
            </p>
          )}

          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg max-h-[230px] overflow-y-auto">
            {searching && places.length === 0 && (
              <div className="p-4 text-xs text-slate-500 dark:text-slate-400">Memuat titik lokasi Batam...</div>
            )}

            {!searching && places.length === 0 && !searchError && (
              <div className="p-4 text-xs text-slate-500 dark:text-slate-400">
                Ketik nama tempat di Batam atau pilih area cepat di atas untuk melihat titik jemput pada peta.
              </div>
            )}

            {places.map((place) => {
              const selected = activePlaceId === place.id;
              return (
                <div
                  key={place.id}
                  className={`p-3 transition-colors ${
                    selected
                      ? 'bg-blue-50/70 dark:bg-blue-950/50'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleFocusPlace(place)}
                    className="w-full text-left flex items-start gap-2.5"
                  >
                    <MapPin
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        selected ? 'text-blue-700 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{place.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                        {place.address}
                      </p>
                    </div>
                  </button>
                  <div className="mt-2 pl-6 flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 tabular-nums">
                      {place.location.lat.toFixed(4)}, {place.location.lng.toFixed(4)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleApplyPickup(place)}
                      className="text-xs font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 whitespace-nowrap"
                    >
                      Pilih Lokasi
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {selectedLocation && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Titik Jemput Aktif:</span>
            <span className="font-semibold text-blue-700 dark:text-blue-400 truncate max-w-[190px]">
              {selectedLocation}
            </span>
          </div>
        )}
      </div>

      {/* Right Interactive Pannable / Zoomable Map Surface */}
      <div className="lg:col-span-8 relative">
        <div
          data-testid="batam-google-map"
          className="w-full h-[420px] sm:h-[480px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 relative"
        >
          <GoogleMap
            id="batam-pickup-map"
            mapId="DEMO_MAP_ID"
            colorScheme={theme === 'dark' ? 'DARK' : 'LIGHT'}
            defaultCenter={BATAM_CENTER}
            defaultZoom={BATAM_DEFAULT_ZOOM}
            mapTypeId={mapTypeId}
            onCameraChanged={handleCameraChanged}
            gestureHandling="greedy"
            disableDefaultUI={false}
            zoomControl={false}
            mapTypeControl={false}
            streetViewControl={false}
            fullscreenControl={true}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            className="w-full h-full"
          >
            {places.map((place) => (
              <BatamPlaceMarker
                key={place.id}
                place={place}
                isSelected={activePlaceId === place.id}
                onSelectMarker={(p) => handleFocusPlace(p)}
                onCloseMarker={() => setActivePlaceId(null)}
                onApplyPickup={handleApplyPickup}
              />
            ))}
          </GoogleMap>

          {/* Top-Left Map Type & Zoom Status Bar */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-slate-200 dark:border-slate-700 rounded-lg p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setMapTypeId('roadmap')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                mapTypeId === 'roadmap'
                  ? 'bg-slate-900 dark:bg-blue-600 text-white'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Peta Jalan
            </button>
            <button
              type="button"
              onClick={() => setMapTypeId('satellite')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                mapTypeId === 'satellite'
                  ? 'bg-slate-900 dark:bg-blue-600 text-white'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Satelit
            </button>
            <span className="px-2 font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums border-l border-slate-200 dark:border-slate-700">
              Zoom {Math.round(zoom)}x
            </span>
          </div>

          {/* Bottom-Right Custom Zoom In / Zoom Out / Reset Batam Controls */}
          <div
            role="group"
            aria-label="Kontrol zoom dan navigasi peta Batam"
            className="absolute bottom-6 right-3 z-10 flex flex-col gap-1.5"
          >
            <button
              type="button"
              aria-label="Perbesar peta"
              onClick={handleZoomIn}
              className="w-10 h-10 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm flex items-center justify-center text-slate-800 dark:text-slate-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="Perkecil peta"
              onClick={handleZoomOut}
              className="w-10 h-10 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm flex items-center justify-center text-slate-800 dark:text-slate-100 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="Pusatkan peta ke Batam"
              title="Pusatkan peta ke Batam"
              onClick={handleResetCenter}
              className="w-10 h-10 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm flex items-center justify-center text-blue-700 dark:text-blue-400 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Clean helper caption beneath map frame so Google Maps attribution stays unobstructed */}
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400 shrink-0" />
            <span>Klik dan geser peta untuk menjelajah · Gunakan tombol + / - atau scroll untuk zoom in &amp; zoom out</span>
          </div>
          <span className="font-mono text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
            1.1040° N, 104.0450° E · Kota Batam
          </span>
        </div>
      </div>
    </div>
  );
}

export function BatamPickupMap({
  theme,
  selectedLocation,
  onSelectPickupLocation,
}: BatamPickupMapProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

  return (
    <section id="peta-batam" className="py-14 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5" />
              <span>Jangkauan Layanan Pulau Batam</span>
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white text-balance mt-1">
              Peta Interaktif Titik Pengambilan Batam
            </h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xl">
            Tersedia layanan antar-jemput armada ke Bandara Hang Nadim, terminal ferry internasional, kawasan bisnis Nagoya, hingga area industri Batamindo dan Kabil.
          </p>
        </div>

        {!apiKey ? (
          <div className="h-[360px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
            <MapPin className="w-8 h-8 text-slate-400 dark:text-slate-500 mb-2" />
            <p className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Peta Batam Memerlukan Kunci Google Maps Platform
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-md">
              Pastikan variabel lingkungan Google Maps API telah aktif pada server, lalu muat ulang halaman ini.
            </p>
          </div>
        ) : (
          <BatamMapInner
            theme={theme}
            selectedLocation={selectedLocation}
            onSelectPickupLocation={onSelectPickupLocation}
          />
        )}
      </div>
    </section>
  );
}
