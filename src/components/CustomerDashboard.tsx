import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  CreditCard,
  FileCheck2,
  MessageSquare,
  Plus,
  Receipt,
  XCircle,
} from 'lucide-react';
import type { Booking, UserProfile, Vehicle, WhatsappNotificationLog } from '../types';
import { formatRupiah } from '../utils/clientPricing';
import type { ThemeMode } from '../utils/theme';
import { FleetTrackingMap } from './FleetTrackingMap';

interface CustomerDashboardProps {
  user: UserProfile | null;
  bookings: Booking[];
  vehicles: Vehicle[];
  notifications: WhatsappNotificationLog[];
  loading: boolean;
  error: string | null;
  theme: ThemeMode;
  onSignIn: () => Promise<void>;
  onNewBooking: () => void;
  onPayBooking: (booking: Booking) => void;
  onViewReceipt: (booking: Booking) => void;
  onCancelBooking: (bookingId: number) => Promise<void>;
}

function BookingStatusBadge({ status, paymentStatus }: { status: string; paymentStatus: string }) {
  if (status === 'cancelled') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 dark:text-red-400">
        <XCircle className="w-3.5 h-3.5" />
        <span>Dibatalkan</span>
      </span>
    );
  }
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Selesai</span>
      </span>
    );
  }
  if (paymentStatus === 'paid') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>{status === 'active' ? 'Sedang Disewa (Lunas)' : 'Terkonfirmasi (Lunas)'}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
      <Clock className="w-3.5 h-3.5" />
      <span>Menunggu Pembayaran</span>
    </span>
  );
}

export function CustomerDashboard({
  user,
  bookings,
  vehicles,
  notifications,
  loading,
  error,
  theme,
  onSignIn,
  onNewBooking,
  onPayBooking,
  onViewReceipt,
  onCancelBooking,
}: CustomerDashboardProps) {
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const filteredBookings = useMemo(() => {
    if (statusFilter === 'Semua') return bookings;
    return bookings.filter((b) => b.bookingStatus === statusFilter);
  }, [bookings, statusFilter]);

  const trackedCustomerVehicles = useMemo(() => {
    const activeIds = new Set(
      bookings
        .filter((b) => ['pending', 'confirmed', 'active'].includes(b.bookingStatus))
        .map((b) => b.vehicleId)
    );
    return activeIds.size > 0
      ? vehicles.filter((v) => activeIds.has(v.id))
      : vehicles.slice(0, 3);
  }, [bookings, vehicles]);

  const stats = useMemo(() => {
    const total = bookings.length;
    const paidCount = bookings.filter((b) => b.paymentStatus === 'paid').length;
    const unpaidTotal = bookings
      .filter((b) => b.paymentStatus === 'unpaid' && b.bookingStatus !== 'cancelled')
      .reduce((acc, b) => acc + b.totalAmount, 0);
    return { total, paidCount, unpaidTotal };
  }, [bookings]);

  if (!user) {
    return (
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 sm:p-10 text-center">
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
            Portal Pelanggan NusaDrive
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-lg mx-auto">
            Masuk dengan akun Google Anda untuk melihat riwayat pemesanan mobil, melakukan pembayaran otomatis (QRIS / Virtual Account), dan memantau notifikasi WhatsApp secara real-time.
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

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Portal Pelanggan / {user.email}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            Pemesanan &amp; Pembayaran Saya
          </h1>
        </div>
        <button
          type="button"
          onClick={onNewBooking}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Pesan Mobil Baru</span>
        </button>
      </div>

      {/* KPI Strip */}
      <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Pemesanan</dt>
          <dd className="mt-2 font-mono text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {stats.total}
          </dd>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">Transaksi Lunas</dt>
          <dd className="mt-2 font-mono text-2xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
            {stats.paidCount}
          </dd>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">Tagihan Menunggu Bayar</dt>
          <dd className="mt-2 font-mono text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {formatRupiah(stats.unpaidTotal)}
          </dd>
        </div>
      </dl>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Bookings List */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              Daftar Pemesanan
            </h2>
            <div className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              {[
                { key: 'Semua', label: 'Semua' },
                { key: 'pending', label: 'Pending' },
                { key: 'confirmed', label: 'Terkonfirmasi' },
                { key: 'completed', label: 'Selesai' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    statusFilter === tab.key
                      ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {loading && (
            <div className="p-6 space-y-3 animate-pulse">
              <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded" />
              <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded" />
            </div>
          )}

          {!loading && error && (
            <div className="p-6 text-sm text-red-700 dark:text-red-400">{error}</div>
          )}

          {!loading && !error && filteredBookings.length === 0 && (
            <div className="p-10 text-center">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Belum ada pemesanan di kategori ini.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Pilih unit dari katalog armada untuk membuat pemesanan pertama Anda.
              </p>
              <button
                type="button"
                onClick={onNewBooking}
                className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-blue-700 dark:bg-blue-600 rounded-lg hover:bg-blue-800 dark:hover:bg-blue-500"
              >
                Lihat Armada
              </button>
            </div>
          )}

          {!loading && !error && filteredBookings.length > 0 && (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredBookings.map((booking) => (
                <div key={booking.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400 tabular-nums">
                        {booking.bookingCode}
                      </span>
                      <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                      <BookingStatusBadge
                        status={booking.bookingStatus}
                        paymentStatus={booking.paymentStatus}
                      />
                    </div>
                    <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                      {booking.vehicle.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                      {booking.startDate} s/d {booking.endDate} ({booking.totalDays} hari) · {booking.withDriver ? 'Dengan Sopir' : 'Lepas Kunci'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Ambil: {booking.pickupLocation}
                      {booking.paymentMethod ? ` · Metode: ${booking.paymentMethod}` : ''}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <FileCheck2 className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                      <span>
                        Dokumen KYC:{' '}
                        <strong
                          className={
                            booking.kycStatus === 'verified'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : booking.kycStatus === 'rejected'
                              ? 'text-red-700 dark:text-red-400'
                              : 'text-amber-700 dark:text-amber-400'
                          }
                        >
                          {booking.kycStatus === 'verified'
                            ? 'Terverifikasi'
                            : booking.kycStatus === 'rejected'
                            ? 'Perlu Perbaikan'
                            : 'Menunggu Verifikasi'}
                        </strong>
                      </span>
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Total Tagihan</p>
                      <p className="font-mono text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                        {formatRupiah(booking.totalAmount)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {booking.paymentStatus === 'paid' && (
                        <button
                          type="button"
                          onClick={() => onViewReceipt(booking)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors whitespace-nowrap"
                        >
                          <Receipt className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                          <span>Lihat Struk</span>
                        </button>
                      )}

                      {booking.paymentStatus === 'unpaid' && booking.bookingStatus !== 'cancelled' && (
                        <button
                          type="button"
                          onClick={() => onPayBooking(booking)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Bayar Otomatis</span>
                        </button>
                      )}

                      {booking.bookingStatus === 'pending' && (
                        <button
                          type="button"
                          disabled={cancellingId === booking.id}
                          onClick={async () => {
                            setCancellingId(booking.id);
                            await onCancelBooking(booking.id);
                            setCancellingId(null);
                          }}
                          className="px-3 py-2 text-xs font-medium text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors whitespace-nowrap"
                        >
                          {cancellingId === booking.id ? 'Membatalkan...' : 'Batalkan'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Real-Time WhatsApp Feed */}
        <aside className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>Notifikasi WhatsApp</span>
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              {notifications.length} pesan
            </span>
          </div>

          {notifications.length === 0 ? (
            <div className="p-6 text-xs text-slate-500 dark:text-slate-400">
              Pesan konfirmasi booking, bukti lunas otomatis, dan pengingat ambil unit akan muncul secara real-time di sini.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[520px] overflow-y-auto">
              {notifications.map((n) => (
                <div key={n.id} className="p-4 space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                      {n.bookingCode}
                    </span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                      Terkirim · +{n.recipientPhone}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                    {n.messageBody}
                  </p>
                  <p className="font-mono text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">
                    Ref: {n.providerRef}
                  </p>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>

      {trackedCustomerVehicles.length > 0 && (
        <FleetTrackingMap
          vehicles={trackedCustomerVehicles}
          theme={theme}
          title="Lacak Posisi Mobil Sewaan Anda"
          subtitle="Pantau posisi terkini unit pengantaran atau armada aktif Anda di Pulau Batam."
          canSimulatePing={false}
        />
      )}
    </section>
  );
}
