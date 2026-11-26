import { useMemo, useState } from 'react';
import {
  Car,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  MapPin,
  Plus,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import type { Booking, UserProfile, UserRole, Vehicle } from '../types';
import { formatRupiah } from '../utils/clientPricing';
import { computeOwnerShareBreakdown } from '../utils/ownerTelemetry';
import type { ThemeMode } from '../utils/theme';
import { FleetTrackingMap } from './FleetTrackingMap';
import { KycDocumentsModal } from './KycDocumentsModal';

interface OwnerDashboardProps {
  user: UserProfile | null;
  vehicles: Vehicle[];
  ownerBookings: Booking[];
  loading: boolean;
  theme: ThemeMode;
  onSignIn: () => Promise<void>;
  onSwitchRole: (role: UserRole) => Promise<void>;
  onClaimDemoVehicles: () => Promise<void>;
  onCreateVehicle: (payload: {
    name: string;
    brand: string;
    category: string;
    plateNumber: string;
    year: number;
    transmission: string;
    fuelType: string;
    seats: number;
    dailyRate: number;
    driverFeePerDay: number;
    imageUrl: string;
    ownerSharePercent?: number;
  }) => Promise<{ ok: boolean; error?: string }>;
  onUpdateVehicleStatus: (id: number, status: string) => Promise<void>;
  onSimulateVehiclePing: (vehicleId: number, requestedStatus?: string) => Promise<void>;
  onUpdateKyc: (
    bookingId: number,
    kycStatus: 'verified' | 'rejected' | 'pending',
    kycNotes: string
  ) => Promise<{ ok: boolean; error?: string }>;
}

type OwnerTab = 'units' | 'bookings' | 'tracking';

const IMAGE_PRESETS: Record<string, string> = {
  MPV: '/src/assets/images/car_mpv_zenix_1794672684036.jpg',
  SUV: '/src/assets/images/car_suv_fortuner_1794672684762.jpg',
  EV: '/src/assets/images/car_ev_ioniq_1794672685380.jpg',
  Sedan: '/src/assets/images/car_sedan_camry_1794672685228.jpg',
};

export function OwnerDashboard({
  user,
  vehicles,
  ownerBookings,
  loading,
  theme,
  onSignIn,
  onSwitchRole,
  onClaimDemoVehicles,
  onCreateVehicle,
  onUpdateVehicleStatus,
  onSimulateVehiclePing,
  onUpdateKyc,
}: OwnerDashboardProps) {
  const [activeTab, setActiveTab] = useState<OwnerTab>('units');
  const [showAddModal, setShowAddModal] = useState(false);
  const [inspectKycBooking, setInspectKycBooking] = useState<Booking | null>(null);
  const [claiming, setClaiming] = useState(false);

  // Add unit form state
  const [vName, setVName] = useState('');
  const [vBrand, setVBrand] = useState('Toyota');
  const [vCategory, setVCategory] = useState('MPV');
  const [vPlate, setVPlate] = useState('');
  const [vYear, setVYear] = useState('2025');
  const [vTrans, setVTrans] = useState('Otomatis');
  const [vFuel, setVFuel] = useState('Bensin');
  const [vSeats, setVSeats] = useState('7');
  const [vRate, setVRate] = useState('850000');
  const [vShare, setVShare] = useState('80');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const myVehicles = useMemo(() => {
    if (!user) return [];
    if (user.role === 'admin') return vehicles;
    return vehicles.filter((v) => v.ownerUid === user.uid);
  }, [vehicles, user]);

  const shareSummary = useMemo(
    () => computeOwnerShareBreakdown(ownerBookings),
    [ownerBookings]
  );

  const movingCount = myVehicles.filter((v) => v.trackingStatus === 'en_route').length;

  if (!user) {
    return (
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 sm:p-10 text-center">
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
            Portal Pemilik Mobil (Mitra Batam)
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-lg mx-auto">
            Masuk dengan akun Google untuk mendaftarkan unit mobil pribadi Anda di Batam, memantau bagi hasil 80%, memeriksa berkas KTP/KK penyewa, dan melacak posisi GPS unit secara real-time.
          </p>
          <button
            type="button"
            onClick={onSignIn}
            className="mt-6 inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors"
          >
            Masuk sebagai Pemilik Mobil
          </button>
        </div>
      </section>
    );
  }

  if (user.role !== 'owner' && user.role !== 'admin') {
    return (
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
          <ShieldCheck className="w-8 h-8 text-blue-700 dark:text-blue-400 mx-auto mb-3" />
          <h1 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
            Aktifkan Portal Pemilik Mobil (Mitra)
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
            Akun Anda saat ini berada pada peran Pelanggan. Beralih ke peran Pemilik Mobil untuk mengelola armada titipan Anda, melihat bagi hasil bersih, memverifikasi KTP/KK penyewa, dan memantau GPS armada.
          </p>
          <button
            type="button"
            onClick={() => onSwitchRole('owner')}
            className="mt-5 px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors"
          >
            Aktifkan Mode Pemilik Mobil
          </button>
        </div>
      </section>
    );
  }

  const handleSubmitVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    const res = await onCreateVehicle({
      name: vName,
      brand: vBrand,
      category: vCategory,
      plateNumber: vPlate,
      year: Number(vYear) || 2025,
      transmission: vTrans,
      fuelType: vFuel,
      seats: Number(vSeats) || 5,
      dailyRate: Number(vRate) || 850000,
      driverFeePerDay: 200000,
      imageUrl: IMAGE_PRESETS[vCategory] || IMAGE_PRESETS.MPV,
      ownerSharePercent: Number(vShare) || 80,
    });
    setSubmitting(false);
    if (!res.ok) {
      setFormError(res.error || 'Gagal mendaftarkan unit.');
      return;
    }
    setVName('');
    setVPlate('');
    setShowAddModal(false);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Portal Pemilik Mobil · {user.email}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            Manajemen Unit &amp; Bagi Hasil Mitra Batam
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {user.role === 'owner' && (
            <button
              type="button"
              onClick={() => onSwitchRole('customer')}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              Mode Pelanggan
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Daftarkan Mobil</span>
          </button>
        </div>
      </div>

      {/* Onboarding CTA if Owner has 0 owned vehicles yet */}
      {myVehicles.length === 0 && (
        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="font-display text-sm font-bold text-blue-950 dark:text-blue-100 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-700 dark:text-blue-400" />
              <span>Anda belum memiliki unit terdaftar pada akun ini</span>
            </p>
            <p className="text-xs text-blue-900/80 dark:text-blue-200/80">
              Daftarkan mobil pribadi Anda atau hubungkan 2 unit mitra Batam yang tersedia untuk langsung mencoba pelacakan GPS &amp; bagi hasil.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={claiming}
              onClick={async () => {
                setClaiming(true);
                await onClaimDemoVehicles();
                setClaiming(false);
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap"
            >
              {claiming ? 'Menghubungkan...' : 'Hubungkan Unit Mitra Demo'}
            </button>
          </div>
        </div>
      )}

      {/* KPI Strip */}
      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <dt className="text-xs text-slate-500 dark:text-slate-400">Pendapatan Bersih Pemilik</dt>
          <dd className="mt-1.5 font-mono text-xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
            {formatRupiah(shareSummary.ownerNetPayout)}
          </dd>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <dt className="text-xs text-slate-500 dark:text-slate-400">Gross Sewa Lunas</dt>
          <dd className="mt-1.5 font-mono text-xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {formatRupiah(shareSummary.grossPaidRevenue)}
          </dd>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <dt className="text-xs text-slate-500 dark:text-slate-400">Total Unit Dimiliki</dt>
          <dd className="mt-1.5 font-mono text-xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {myVehicles.length} Unit
          </dd>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <dt className="text-xs text-slate-500 dark:text-slate-400">Sedang Jalan (GPS Live)</dt>
          <dd className="mt-1.5 font-mono text-xl font-bold text-blue-700 dark:text-blue-400 tabular-nums">
            {movingCount} / {myVehicles.length}
          </dd>
        </div>
      </dl>

      {/* Sub-navigation tabs */}
      <div
        role="tablist"
        aria-label="Navigasi Portal Pemilik Mobil"
        className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg"
      >
        {[
          { id: 'units' as const, label: 'Armada Saya', icon: Car },
          { id: 'bookings' as const, label: 'Jadwal & Verifikasi KYC', icon: ClipboardList },
          { id: 'tracking' as const, label: 'Pelacakan GPS Unit', icon: MapPin },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                active
                  ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Owner Vehicles */}
      {activeTab === 'units' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          {myVehicles.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
              Belum ada mobil di portofolio Anda. Klik &quot;Daftarkan Mobil&quot; di kanan atas.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <th className="py-3 px-4">Unit &amp; Plat</th>
                    <th className="py-3 px-4">Bagi Hasil</th>
                    <th className="py-3 px-4">Lokasi GPS Terkini</th>
                    <th className="py-3 px-4 text-right">Tarif / Hari</th>
                    <th className="py-3 px-4">Ketersediaan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                  {myVehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{v.name}</p>
                        <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                          {v.plateNumber} · {v.transmission}
                        </p>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        {v.ownerSharePercent || 80}% Pemilik
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {v.trackingLocationLabel || 'Pool Batam Centre'}
                        </p>
                        <p className="font-mono text-[11px] text-slate-400">
                          {v.trackingStatus === 'en_route'
                            ? `Bergerak (${v.currentSpeedKmh || 0} km/j)`
                            : 'Standby'}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100">
                        {formatRupiah(v.dailyRate)}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          aria-label={`Ubah status unit ${v.name}`}
                          value={v.status}
                          onChange={(e) => onUpdateVehicleStatus(v.id, e.target.value)}
                          className="text-xs px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                        >
                          <option value="available">Tersedia</option>
                          <option value="rented">Disewa</option>
                          <option value="maintenance">Perawatan</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Owner Bookings + KYC review */}
      {activeTab === 'bookings' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-6 text-sm text-slate-500 dark:text-slate-400">
              Memuat jadwal sewa unit...
            </div>
          ) : ownerBookings.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
              Belum ada pemesanan untuk unit milik Anda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <th className="py-3 px-4">Kode &amp; Penyewa</th>
                    <th className="py-3 px-4">Unit &amp; Tanggal</th>
                    <th className="py-3 px-4 text-right">Net Pemilik</th>
                    <th className="py-3 px-4">Status KYC</th>
                    <th className="py-3 px-4 text-right">Dokumen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                  {ownerBookings.map((b) => {
                    const share = b.vehicle.ownerSharePercent || 80;
                    const ownerNet = Math.round((b.baseAmount * share) / 100);
                    return (
                      <tr key={b.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4">
                          <p className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400">
                            {b.bookingCode}
                          </p>
                          <p className="font-medium text-slate-900 dark:text-slate-100">
                            {b.customerName}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-slate-900 dark:text-slate-100">
                            {b.vehicle.name}
                          </p>
                          <p className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                            {b.startDate} → {b.endDate}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
                          {formatRupiah(ownerNet)}
                        </td>
                        <td className="py-3 px-4 text-xs font-medium">
                          {b.kycStatus === 'verified' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Terverifikasi</span>
                            </span>
                          ) : b.kycStatus === 'rejected' ? (
                            <span className="text-red-700 dark:text-red-400">Ditolak</span>
                          ) : (
                            <span className="text-amber-700 dark:text-amber-400">Menunggu</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setInspectKycBooking(b)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md whitespace-nowrap"
                          >
                            <FileCheck2 className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                            <span>Cek KTP/KK</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: GPS Tracking */}
      {activeTab === 'tracking' && (
        <FleetTrackingMap
          vehicles={myVehicles}
          theme={theme}
          title="Pelacakan GPS Unit Milik Anda"
          subtitle="Pantau posisi mobil titipan Anda secara langsung di peta Pulau Batam beserta status kecepatan dan lokasi parkir."
          canSimulatePing={true}
          onSimulateVehiclePing={onSimulateVehiclePing}
        />
      )}

      {/* Add Owner Vehicle Modal */}
      {showAddModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="owner-add-vehicle-title"
          className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-lg overflow-hidden my-auto">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2
                id="owner-add-vehicle-title"
                className="font-display text-lg font-bold text-slate-900 dark:text-slate-100"
              >
                Daftarkan Mobil Mitra Pemilik
              </h2>
              <button
                type="button"
                aria-label="Tutup modal pendaftaran unit"
                onClick={() => setShowAddModal(false)}
                className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitVehicle} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
                  {formError}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ow-v-name" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nama Model Mobil
                  </label>
                  <input
                    id="ow-v-name"
                    type="text"
                    required
                    placeholder="Honda HR-V RS Turbo"
                    value={vName}
                    onChange={(e) => setVName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="ow-v-brand" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Merek
                  </label>
                  <input
                    id="ow-v-brand"
                    type="text"
                    required
                    value={vBrand}
                    onChange={(e) => setVBrand(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="ow-v-cat" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Kategori
                  </label>
                  <select
                    id="ow-v-cat"
                    value={vCategory}
                    onChange={(e) => setVCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  >
                    <option value="MPV">MPV</option>
                    <option value="SUV">SUV</option>
                    <option value="EV">EV</option>
                    <option value="Sedan">Sedan</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="ow-v-plate" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Plat Nomor Batam
                  </label>
                  <input
                    id="ow-v-plate"
                    type="text"
                    required
                    placeholder="BP 1889 ND"
                    value={vPlate}
                    onChange={(e) => setVPlate(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="ow-v-year" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Tahun
                  </label>
                  <input
                    id="ow-v-year"
                    type="number"
                    min="2018"
                    max="2027"
                    value={vYear}
                    onChange={(e) => setVYear(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="ow-v-trans" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Transmisi
                  </label>
                  <select
                    id="ow-v-trans"
                    value={vTrans}
                    onChange={(e) => setVTrans(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  >
                    <option value="Otomatis">Otomatis</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="ow-v-fuel" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Bahan Bakar
                  </label>
                  <select
                    id="ow-v-fuel"
                    value={vFuel}
                    onChange={(e) => setVFuel(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  >
                    <option value="Bensin">Bensin</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Listrik">Listrik</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="ow-v-seats" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Kursi
                  </label>
                  <input
                    id="ow-v-seats"
                    type="number"
                    min="2"
                    max="14"
                    value={vSeats}
                    onChange={(e) => setVSeats(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ow-v-rate" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Tarif Harian (Rp)
                  </label>
                  <input
                    id="ow-v-rate"
                    type="number"
                    min="250000"
                    step="50000"
                    required
                    value={vRate}
                    onChange={(e) => setVRate(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="ow-v-share" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Porsi Pemilik (%)
                  </label>
                  <input
                    id="ow-v-share"
                    type="number"
                    min="60"
                    max="90"
                    value={vShare}
                    onChange={(e) => setVShare(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg"
                >
                  {submitting ? 'Mendaftarkan...' : 'Daftarkan Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {inspectKycBooking && (
        <KycDocumentsModal
          booking={inspectKycBooking}
          canModerate={true}
          onClose={() => setInspectKycBooking(null)}
          onUpdateKyc={onUpdateKyc}
        />
      )}
    </section>
  );
}
