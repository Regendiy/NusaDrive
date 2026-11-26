import { useMemo, useState } from 'react';
import {
  Car,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  MapPin,
  MessageSquare,
  Plus,
  Receipt,
  Send,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import type {
  Booking,
  UserProfile,
  UserRole,
  Vehicle,
  WhatsappNotificationLog,
} from '../types';
import { formatRupiah } from '../utils/clientPricing';
import type { ThemeMode } from '../utils/theme';
import { FleetTrackingMap } from './FleetTrackingMap';
import { KycDocumentsModal } from './KycDocumentsModal';
import { RevenueLineChart } from './RevenueLineChart';

interface AdminDashboardProps {
  user: UserProfile | null;
  vehicles: Vehicle[];
  bookings: Booking[];
  notifications: WhatsappNotificationLog[];
  loading: boolean;
  theme: ThemeMode;
  onSignIn: () => Promise<void>;
  onSwitchRole: (role: UserRole) => Promise<void>;
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
    ownerName?: string;
    ownerSharePercent?: number;
  }) => Promise<{ ok: boolean; error?: string }>;
  onUpdateVehicleStatus: (id: number, status: string) => Promise<void>;
  onDeleteVehicle: (id: number) => Promise<{ ok: boolean; error?: string }>;
  onUpdateBookingStatus: (id: number, bookingStatus: string) => Promise<void>;
  onUpdateKyc: (
    bookingId: number,
    kycStatus: 'verified' | 'rejected' | 'pending',
    kycNotes: string
  ) => Promise<{ ok: boolean; error?: string }>;
  onSimulateVehiclePing: (vehicleId: number, requestedStatus?: string) => Promise<void>;
  onResendWhatsapp: (bookingId: number) => Promise<void>;
  onViewReceipt: (booking: Booking) => void;
}

type AdminTab = 'fleet' | 'bookings' | 'tracking' | 'whatsapp';

const IMAGE_PRESETS: Record<string, string> = {
  MPV: '/src/assets/images/car_mpv_zenix_1794672684036.jpg',
  SUV: '/src/assets/images/car_suv_fortuner_1794672684762.jpg',
  EV: '/src/assets/images/car_ev_ioniq_1794672685380.jpg',
  Sedan: '/src/assets/images/car_sedan_camry_1794672685228.jpg',
};

export function AdminDashboard({
  user,
  vehicles,
  bookings,
  notifications,
  loading,
  theme,
  onSignIn,
  onSwitchRole,
  onCreateVehicle,
  onUpdateVehicleStatus,
  onDeleteVehicle,
  onUpdateBookingStatus,
  onUpdateKyc,
  onSimulateVehiclePing,
  onResendWhatsapp,
  onViewReceipt,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('fleet');
  const [showAddModal, setShowAddModal] = useState(false);
  const [inspectKycBooking, setInspectKycBooking] = useState<Booking | null>(null);
  const [bookingSearch, setBookingSearch] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [sendingWaId, setSendingWaId] = useState<number | null>(null);

  // Add Vehicle Form State
  const [vName, setVName] = useState('');
  const [vBrand, setVBrand] = useState('Toyota');
  const [vCategory, setVCategory] = useState('MPV');
  const [vPlate, setVPlate] = useState('');
  const [vYear, setVYear] = useState('2025');
  const [vTrans, setVTrans] = useState('Otomatis');
  const [vFuel, setVFuel] = useState('Hybrid');
  const [vSeats, setVSeats] = useState('7');
  const [vRate, setVRate] = useState('1200000');
  const [vDriverFee, setVDriverFee] = useState('200000');
  const [submittingVehicle, setSubmittingVehicle] = useState(false);

  const metrics = useMemo(() => {
    const revenue = bookings
      .filter((b) => b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + b.totalAmount, 0);
    const activeBookings = bookings.filter((b) =>
      ['pending', 'confirmed', 'active'].includes(b.bookingStatus)
    ).length;
    const availableVehicles = vehicles.filter((v) => v.status === 'available').length;
    return {
      revenue,
      activeBookings,
      availableVehicles,
      totalVehicles: vehicles.length,
      waCount: notifications.length,
    };
  }, [bookings, vehicles, notifications]);

  const filteredBookings = useMemo(() => {
    const q = bookingSearch.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter(
      (b) =>
        b.bookingCode.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.vehicle.name.toLowerCase().includes(q)
    );
  }, [bookings, bookingSearch]);

  if (!user) {
    return (
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 sm:p-10 text-center">
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
            Dashboard Admin Operasional
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-lg mx-auto">
            Masuk dengan Google untuk mengelola armada kendaraan di basis data relasional, memverifikasi pemesanan pelanggan, serta memantau pengiriman WhatsApp real-time.
          </p>
          <button
            type="button"
            onClick={onSignIn}
            className="mt-6 inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors"
          >
            Masuk dengan Google
          </button>
        </div>
      </section>
    );
  }

  if (user.role !== 'admin') {
    return (
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
          <ShieldCheck className="w-8 h-8 text-blue-700 dark:text-blue-400 mx-auto mb-3" />
          <h1 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
            Aktifkan Akses Admin
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
            Akun Anda saat ini berada dalam mode Pelanggan. Aktifkan mode Admin untuk mengelola armada kendaraan, memproses status sewa, dan melihat log notifikasi WhatsApp seluruh pelanggan.
          </p>
          <button
            type="button"
            onClick={() => onSwitchRole('admin')}
            className="mt-5 px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors"
          >
            Beralih ke Mode Admin
          </button>
        </div>
      </section>
    );
  }

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setSubmittingVehicle(true);
    const res = await onCreateVehicle({
      name: vName,
      brand: vBrand,
      category: vCategory,
      plateNumber: vPlate,
      year: Number(vYear) || 2025,
      transmission: vTrans,
      fuelType: vFuel,
      seats: Number(vSeats) || 5,
      dailyRate: Number(vRate) || 1000000,
      driverFeePerDay: Number(vDriverFee) || 200000,
      imageUrl: IMAGE_PRESETS[vCategory] || IMAGE_PRESETS.MPV,
    });
    setSubmittingVehicle(false);

    if (!res.ok) {
      setActionError(res.error || 'Gagal menambah unit.');
      return;
    }

    setVName('');
    setVPlate('');
    setShowAddModal(false);
  };

  const sidebarItems: Array<{ id: AdminTab; label: string; icon: typeof Car }> = [
    { id: 'fleet', label: 'Armada & Ringkasan', icon: Car },
    { id: 'bookings', label: 'Pemesanan & KYC', icon: ClipboardList },
    { id: 'tracking', label: 'Pelacakan GPS Armada', icon: MapPin },
    { id: 'whatsapp', label: 'Log WhatsApp Real-Time', icon: MessageSquare },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* 240px Enterprise Sidebar */}
        <aside className="w-full lg:w-60 shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-1">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-2">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Konsol Admin</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
          </div>
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-left ${
                  active
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}

          <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => onSwitchRole('customer')}
              className="w-full text-left px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Lihat sebagai Pelanggan
            </button>
          </div>
        </aside>

        {/* Main Viewport */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          {/* Contextual Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Admin / {sidebarItems.find((i) => i.id === activeTab)?.label}
              </p>
              <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {sidebarItems.find((i) => i.id === activeTab)?.label}
              </h1>
            </div>
            {activeTab === 'fleet' && (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Armada</span>
              </button>
            )}
          </div>

          {actionError && (
            <div role="alert" className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 flex items-center justify-between">
              <span>{actionError}</span>
              <button type="button" onClick={() => setActionError(null)} className="text-red-700 dark:text-red-300 font-semibold">
                Tutup
              </button>
            </div>
          )}

          {/* KPI Strip */}
          <dl className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <dt className="text-xs text-slate-500 dark:text-slate-400">Pendapatan Lunas</dt>
              <dd className="mt-1.5 font-mono text-xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {formatRupiah(metrics.revenue)}
              </dd>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <dt className="text-xs text-slate-500 dark:text-slate-400">Pemesanan Aktif</dt>
              <dd className="mt-1.5 font-mono text-xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {metrics.activeBookings}
              </dd>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <dt className="text-xs text-slate-500 dark:text-slate-400">Armada Siap Jalan</dt>
              <dd className="mt-1.5 font-mono text-xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                {metrics.availableVehicles} / {metrics.totalVehicles}
              </dd>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <dt className="text-xs text-slate-500 dark:text-slate-400">Notifikasi WA Terkirim</dt>
              <dd className="mt-1.5 font-mono text-xl font-bold text-blue-700 dark:text-blue-400 tabular-nums">
                {metrics.waCount}
              </dd>
            </div>
          </dl>

          {/* Tab 1: Revenue Chart + Fleet CRUD Table */}
          {activeTab === 'fleet' && (
            <div className="space-y-6">
              <RevenueLineChart bookings={bookings} loading={loading} theme={theme} />

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <th className="py-3 px-4">Kendaraan</th>
                      <th className="py-3 px-4">Pemilik Mitra</th>
                      <th className="py-3 px-4">Plat Nomor</th>
                      <th className="py-3 px-4">Spesifikasi</th>
                      <th className="py-3 px-4 text-right">Tarif / Hari</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                    {vehicles.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{v.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{v.brand} · {v.category}</p>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">
                          <p className="font-medium text-slate-800 dark:text-slate-200">
                            {v.ownerName || 'NusaDrive Batam'}
                          </p>
                          <p className="font-mono text-[11px] text-slate-400">
                            Bagi hasil {v.ownerSharePercent || 80}%
                          </p>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {v.plateNumber}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">
                          {v.transmission} · {v.fuelType} · {v.seats} Kursi
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {formatRupiah(v.dailyRate)}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            aria-label={`Ubah status ${v.name}`}
                            value={v.status}
                            onChange={(e) => onUpdateVehicleStatus(v.id, e.target.value)}
                            className="text-xs px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                          >
                            <option value="available">Tersedia</option>
                            <option value="rented">Disewa</option>
                            <option value="maintenance">Perawatan</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            aria-label={`Hapus ${v.name}`}
                            onClick={async () => {
                              const res = await onDeleteVehicle(v.id);
                              if (!res.ok && res.error) setActionError(res.error);
                            }}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            </div>
          )}

          {/* Tab 2: Bookings Management */}
          {activeTab === 'bookings' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <input
                  type="search"
                  aria-label="Cari kode booking atau nama pelanggan"
                  placeholder="Cari kode booking, nama penyewa, atau mobil..."
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  className="w-full sm:w-80 px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 dark:focus:ring-blue-500"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                  {filteredBookings.length} transaksi
                </span>
              </div>

              {loading ? (
                <div className="p-6 text-sm text-slate-500 dark:text-slate-400">Memuat data pemesanan...</div>
              ) : filteredBookings.length === 0 ? (
                <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
                  Belum ada data pemesanan yang sesuai.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <th className="py-3 px-4">Kode &amp; Pelanggan</th>
                        <th className="py-3 px-4">Unit &amp; Jadwal</th>
                        <th className="py-3 px-4">KYC (KTP/KK)</th>
                        <th className="py-3 px-4 text-right">Total</th>
                        <th className="py-3 px-4">Pembayaran</th>
                        <th className="py-3 px-4">Status Sewa</th>
                        <th className="py-3 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                      {filteredBookings.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4">
                            <p className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400">{b.bookingCode}</p>
                            <p className="font-medium text-slate-900 dark:text-slate-100">{b.customerName}</p>
                            <p className="font-mono text-xs text-slate-500 dark:text-slate-400">+{b.customerWhatsapp}</p>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-medium text-slate-900 dark:text-slate-100">{b.vehicle.name}</p>
                            <p className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                              {b.startDate} → {b.endDate} ({b.totalDays}h)
                            </p>
                          </td>
                          <td className="py-3 px-4 text-xs">
                            <button
                              type="button"
                              onClick={() => setInspectKycBooking(b)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium whitespace-nowrap"
                            >
                              <FileCheck2 className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                              <span
                                className={
                                  b.kycStatus === 'verified'
                                    ? 'text-emerald-700 dark:text-emerald-400'
                                    : b.kycStatus === 'rejected'
                                    ? 'text-red-700 dark:text-red-400'
                                    : 'text-amber-700 dark:text-amber-400'
                                }
                              >
                                {b.kycStatus === 'verified'
                                  ? 'Terverifikasi'
                                  : b.kycStatus === 'rejected'
                                  ? 'Ditolak'
                                  : 'Periksa KYC'}
                              </span>
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                            {formatRupiah(b.totalAmount)}
                          </td>
                          <td className="py-3 px-4 text-xs">
                            {b.paymentStatus === 'paid' ? (
                              <span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Lunas ({b.paymentMethod})</span>
                              </span>
                            ) : (
                              <span className="font-medium text-amber-700 dark:text-amber-400">Belum Dibayar</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <select
                              aria-label={`Status sewa ${b.bookingCode}`}
                              value={b.bookingStatus}
                              onChange={(e) => onUpdateBookingStatus(b.id, e.target.value)}
                              className="text-xs px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Terkonfirmasi</option>
                              <option value="active">Unit Diambil (Aktif)</option>
                              <option value="completed">Selesai</option>
                              <option value="cancelled">Dibatalkan</option>
                            </select>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => onViewReceipt(b)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md whitespace-nowrap"
                              >
                                <Receipt className="w-3 h-3" />
                                <span>Struk</span>
                              </button>
                              <button
                                type="button"
                                disabled={sendingWaId === b.id}
                                onClick={async () => {
                                  setSendingWaId(b.id);
                                  await onResendWhatsapp(b.id);
                                  setSendingWaId(null);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-md whitespace-nowrap"
                              >
                                <Send className="w-3 h-3" />
                                <span>{sendingWaId === b.id ? 'Mengirim...' : 'Kirim WA'}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Live GPS Fleet Tracking */}
          {activeTab === 'tracking' && (
            <FleetTrackingMap
              vehicles={vehicles}
              theme={theme}
              canSimulatePing={true}
              onSimulateVehiclePing={onSimulateVehiclePing}
            />
          )}

          {/* Tab 4: Real-time WhatsApp Notification Monitor */}
          {activeTab === 'whatsapp' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                    Riwayat Pengiriman WhatsApp Real-Time
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Diperbarui otomatis melalui Server-Sent Events (SSE) setiap ada transaksi baru atau perubahan status.
                  </p>
                </div>
              </div>

              {notifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  Belum ada log notifikasi WhatsApp yang tercatat.
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-mono font-semibold text-blue-700 dark:text-blue-400">{n.bookingCode}</span>
                          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                          <span className="font-medium text-slate-900 dark:text-slate-100">{n.recipientName}</span>
                          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                          <span className="font-mono text-slate-600 dark:text-slate-300">+{n.recipientPhone}</span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed max-w-3xl">
                          {n.messageBody}
                        </p>
                      </div>
                      <div className="text-left sm:text-right shrink-0">
                        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          {n.deliveryStatus === 'delivered' ? 'Terkirim' : n.deliveryStatus}
                        </p>
                        <p className="font-mono text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {n.providerRef}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-vehicle-title"
          className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-lg overflow-hidden my-auto">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 id="add-vehicle-title" className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                Tambah Armada Baru
              </h2>
              <button
                type="button"
                aria-label="Tutup modal tambah armada"
                onClick={() => setShowAddModal(false)}
                className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddVehicle} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="v-name" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nama Model
                  </label>
                  <input
                    id="v-name"
                    type="text"
                    required
                    placeholder="Toyota Fortuner GR"
                    value={vName}
                    onChange={(e) => setVName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="v-brand" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Merek
                  </label>
                  <input
                    id="v-brand"
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
                  <label htmlFor="v-category" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Kategori
                  </label>
                  <select
                    id="v-category"
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
                  <label htmlFor="v-plate" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Plat Nomor
                  </label>
                  <input
                    id="v-plate"
                    type="text"
                    required
                    placeholder="BP 1234 XY"
                    value={vPlate}
                    onChange={(e) => setVPlate(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="v-year" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Tahun
                  </label>
                  <input
                    id="v-year"
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
                  <label htmlFor="v-trans" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Transmisi
                  </label>
                  <select
                    id="v-trans"
                    value={vTrans}
                    onChange={(e) => setVTrans(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  >
                    <option value="Otomatis">Otomatis</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="v-fuel" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Bahan Bakar
                  </label>
                  <select
                    id="v-fuel"
                    value={vFuel}
                    onChange={(e) => setVFuel(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  >
                    <option value="Hybrid">Hybrid</option>
                    <option value="Bensin">Bensin</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Listrik">Listrik</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="v-seats" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Kapasitas Kursi
                  </label>
                  <input
                    id="v-seats"
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
                  <label htmlFor="v-rate" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Tarif Harian (Rp)
                  </label>
                  <input
                    id="v-rate"
                    type="number"
                    min="100000"
                    step="50000"
                    required
                    value={vRate}
                    onChange={(e) => setVRate(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="v-driver-fee" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Biaya Sopir / Hari (Rp)
                  </label>
                  <input
                    id="v-driver-fee"
                    type="number"
                    min="0"
                    step="25000"
                    value={vDriverFee}
                    onChange={(e) => setVDriverFee(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingVehicle}
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg"
                >
                  {submittingVehicle ? 'Menyimpan...' : 'Simpan Unit'}
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
    </div>
  );
}
