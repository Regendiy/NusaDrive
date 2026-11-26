import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AdvancedMarker,
  APILoadingStatus,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
  useMap,
} from '@vis.gl/react-google-maps';
import {
  Compass,
  Gauge,
  MapPin,
  Minus,
  Navigation,
  Plus,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import type { Vehicle } from '../types';
import type { ThemeMode } from '../utils/theme';

interface FleetTrackingMapProps {
  vehicles: Vehicle[];
  theme: ThemeMode;
  title?: string;
  subtitle?: string;
  canSimulatePing?: boolean;
  onSimulateVehiclePing?: (vehicleId: number, requestedStatus?: string) => Promise<void>;
}

const BATAM_CENTER = { lat: 1.118, lng: 104.055 };
const DEFAULT_ZOOM = 12;

interface TrackingMarkerProps {
  vehicle: Vehicle;
  isSelected: boolean;
  canSimulatePing?: boolean;
  simulatingId: number | null;
  onSelect: (id: number) => void;
  onClose: () => void;
  onPing: (id: number, status?: string) => Promise<void>;
}

function VehicleGpsMarker({
  vehicle,
  isSelected,
  canSimulatePing,
  simulatingId,
  onSelect,
  onClose,
  onPing,
}: TrackingMarkerProps) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const lat = Number(vehicle.currentLat) || 1.1286;
  const lng = Number(vehicle.currentLng) || 104.0539;
  const isMoving = vehicle.trackingStatus === 'en_route';

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat, lng }}
        title={`${vehicle.name} (${vehicle.plateNumber})`}
        onClick={() => onSelect(vehicle.id)}
      >
        <Pin
          background={isSelected ? '#1d4ed8' : isMoving ? '#15803d' : '#0f172a'}
          borderColor={isSelected ? '#1e3a8a' : isMoving ? '#14532d' : '#334155'}
          glyphColor="#ffffff"
          scale={isSelected ? 1.25 : 1.05}
        />
      </AdvancedMarker>

      {isSelected && marker && (
        <InfoWindow anchor={marker} maxWidth={260} onCloseClick={onClose}>
          <div className="p-1 text-slate-900 space-y-2">
            <div>
              <p className="font-display text-sm font-bold leading-snug">{vehicle.name}</p>
              <p className="font-mono text-[11px] text-slate-600 mt-0.5">
                {vehicle.plateNumber} · {vehicle.ownerName || 'Mitra Batam'}
              </p>
            </div>
            <div className="text-xs text-slate-700 space-y-0.5">
              <p>
                <strong>Lokasi:</strong> {vehicle.trackingLocationLabel || 'Pool Batam Centre'}
              </p>
              <p className="font-mono tabular-nums">
                <strong>Status:</strong>{' '}
                {isMoving
                  ? `Bergerak (${vehicle.currentSpeedKmh || 0} km/j)`
                  : 'Parkir / Standby'}
              </p>
            </div>
            {canSimulatePing && (
              <button
                type="button"
                disabled={simulatingId === vehicle.id}
                onClick={() => onPing(vehicle.id)}
                className="w-full px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors"
              >
                {simulatingId === vehicle.id
                  ? 'Memperbarui GPS...'
                  : 'Simulasi Pergerakan GPS'}
              </button>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export function FleetTrackingMap({
  vehicles,
  theme,
  title = 'Pelacakan GPS Armada Real-Time Batam',
  subtitle = 'Pantau posisi terkini unit di jalan raya, kecepatan, serta lokasi parkir resmi di seluruh koridor Kota Batam.',
  canSimulatePing = false,
  onSimulateVehiclePing,
}: FleetTrackingMapProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const map = useMap('fleet-tracking-map');
  const apiStatus = useApiLoadingStatus();

  const [statusFilter, setStatusFilter] = useState<'all' | 'en_route' | 'parked'>('all');
  const [selectedId, setSelectedId] = useState<number | null>(
    vehicles[0]?.id ?? null
  );
  const [simulatingId, setSimulatingId] = useState<number | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  useEffect(() => {
    if (apiStatus === APILoadingStatus.AUTH_FAILURE) {
      window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
    }
  }, [apiStatus]);

  const filteredVehicles = useMemo(() => {
    if (statusFilter === 'all') return vehicles;
    if (statusFilter === 'en_route') {
      return vehicles.filter((v) => v.trackingStatus === 'en_route');
    }
    return vehicles.filter((v) => v.trackingStatus !== 'en_route');
  }, [vehicles, statusFilter]);

  useEffect(() => {
    if (filteredVehicles.length > 0 && !filteredVehicles.some((v) => v.id === selectedId)) {
      setSelectedId(filteredVehicles[0].id);
    }
  }, [filteredVehicles, selectedId]);

  const focusVehicle = useCallback(
    (v: Vehicle) => {
      setSelectedId(v.id);
      const lat = Number(v.currentLat) || BATAM_CENTER.lat;
      const lng = Number(v.currentLng) || BATAM_CENTER.lng;
      if (map) {
        map.panTo({ lat, lng });
        map.setZoom(14);
        setZoom(14);
      }
    },
    [map]
  );

  const handlePing = async (vehicleId: number, requestedStatus?: string) => {
    if (!onSimulateVehiclePing) return;
    setSimulatingId(vehicleId);
    try {
      await onSimulateVehiclePing(vehicleId, requestedStatus);
    } finally {
      setSimulatingId(null);
    }
  };

  return (
    <div
      data-testid="fleet-tracking-section"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-5"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5" />
            <span>Telemetri GPS Armada</span>
          </p>
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
            {title}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{subtitle}</p>
        </div>

        <div
          role="group"
          aria-label="Filter status pelacakan GPS"
          className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg self-start"
        >
          {[
            { id: 'all' as const, label: `Semua (${vehicles.length})` },
            {
              id: 'en_route' as const,
              label: `Sedang Jalan (${vehicles.filter((v) => v.trackingStatus === 'en_route').length})`,
            },
            {
              id: 'parked' as const,
              label: `Standby (${vehicles.filter((v) => v.trackingStatus !== 'en_route').length})`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Live Telemetry Unit List */}
        <div className="lg:col-span-4 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/60 flex flex-col">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Daftar Unit Terlacak</span>
            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
              {filteredVehicles.length} unit
            </span>
          </div>

          {filteredVehicles.length === 0 ? (
            <div className="p-6 text-xs text-slate-500 dark:text-slate-400 text-center">
              Tidak ada unit pada status pelacakan ini.
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-[420px] overflow-y-auto">
              {filteredVehicles.map((v) => {
                const isSelected = selectedId === v.id;
                const isMoving = v.trackingStatus === 'en_route';
                const latNum = Number(v.currentLat) || 1.1286;
                const lngNum = Number(v.currentLng) || 104.0539;

                return (
                  <div
                    key={v.id}
                    className={`p-3.5 transition-colors ${
                      isSelected
                        ? 'bg-blue-50/75 dark:bg-blue-950/40'
                        : 'hover:bg-white dark:hover:bg-slate-900'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => focusVehicle(v)}
                      className="w-full text-left space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {v.name}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-medium shrink-0 ${
                            isMoving
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isMoving ? 'bg-emerald-600' : 'bg-slate-400'
                            }`}
                          />
                          <span>{isMoving ? 'Bergerak' : 'Standby'}</span>
                        </span>
                      </div>
                      <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {v.plateNumber} · {v.trackingLocationLabel || 'Pool Batam Centre'}
                      </p>
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                        <span className="inline-flex items-center gap-1">
                          <Gauge className="w-3 h-3" />
                          <span>{v.currentSpeedKmh || 0} km/j</span>
                        </span>
                        <span>
                          {latNum.toFixed(4)}, {lngNum.toFixed(4)}
                        </span>
                      </div>
                    </button>

                    {canSimulatePing && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          disabled={simulatingId === v.id}
                          onClick={() => handlePing(v.id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline disabled:opacity-50"
                        >
                          <RefreshCw
                            className={`w-3 h-3 ${simulatingId === v.id ? 'animate-spin' : ''}`}
                          />
                          <span>
                            {simulatingId === v.id ? 'Mengirim ping...' : 'Update Rute Batam'}
                          </span>
                        </button>
                        {isMoving && (
                          <button
                            type="button"
                            disabled={simulatingId === v.id}
                            onClick={() => handlePing(v.id, 'parked')}
                            className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                          >
                            Set Parkir
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Interactive Google Map Canvas */}
        <div className="lg:col-span-8 relative">
          {!apiKey ? (
            <div className="h-[440px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
              <MapPin className="w-8 h-8 text-slate-400 dark:text-slate-500 mb-2" />
              <p className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                Kunci Google Maps Platform belum tersedia
              </p>
            </div>
          ) : (
            <div
              data-testid="fleet-tracking-map"
              className="w-full h-[440px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 relative"
            >
              <GoogleMap
                id="fleet-tracking-map"
                mapId="DEMO_MAP_ID"
                colorScheme={theme === 'dark' ? 'DARK' : 'LIGHT'}
                defaultCenter={BATAM_CENTER}
                defaultZoom={DEFAULT_ZOOM}
                gestureHandling="greedy"
                zoomControl={false}
                mapTypeControl={false}
                streetViewControl={false}
                fullscreenControl={true}
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                onCameraChanged={(ev) => setZoom(ev.detail.zoom)}
                className="w-full h-full"
              >
                {filteredVehicles.map((v) => (
                  <VehicleGpsMarker
                    key={v.id}
                    vehicle={v}
                    isSelected={selectedId === v.id}
                    canSimulatePing={canSimulatePing}
                    simulatingId={simulatingId}
                    onSelect={(id) => setSelectedId(id)}
                    onClose={() => setSelectedId(null)}
                    onPing={handlePing}
                  />
                ))}
              </GoogleMap>

              <div className="absolute bottom-6 right-3 z-10 flex flex-col gap-1.5">
                <button
                  type="button"
                  aria-label="Perbesar peta pelacakan"
                  onClick={() => {
                    const next = Math.min(18, Math.round(map?.getZoom() ?? zoom) + 1);
                    map?.setZoom(next);
                    setZoom(next);
                  }}
                  className="w-10 h-10 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm flex items-center justify-center text-slate-800 dark:text-slate-100"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="Perkecil peta pelacakan"
                  onClick={() => {
                    const next = Math.max(10, Math.round(map?.getZoom() ?? zoom) - 1);
                    map?.setZoom(next);
                    setZoom(next);
                  }}
                  className="w-10 h-10 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm flex items-center justify-center text-slate-800 dark:text-slate-100"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="Pusatkan peta pelacakan Batam"
                  onClick={() => {
                    map?.panTo(BATAM_CENTER);
                    map?.setZoom(DEFAULT_ZOOM);
                    setZoom(DEFAULT_ZOOM);
                  }}
                  className="w-10 h-10 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm flex items-center justify-center text-blue-700 dark:text-blue-400"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
              <span>Pin hijau: unit sedang berjalan · Pin hitam/biru: unit standby/terpilih</span>
            </span>
            <span className="font-mono text-[11px] tabular-nums">
              Zoom {Math.round(zoom)}x · Pulau Batam
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
