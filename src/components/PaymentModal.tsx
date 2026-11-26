import { useState } from 'react';
import { CheckCircle2, CreditCard, QrCode, Smartphone, X } from 'lucide-react';
import type { Booking } from '../types';
import { formatRupiah } from '../utils/clientPricing';

interface PaymentModalProps {
  booking: Booking | null;
  getAuthToken: () => Promise<string | null>;
  onClose: () => void;
  onPaymentSuccess: (updatedBooking: Booking) => void;
}

const PAYMENT_CHANNELS = [
  {
    id: 'QRIS Otomatis',
    title: 'QRIS Instan',
    subtitle: 'Verifikasi otomatis semua e-wallet & mobile banking',
    icon: QrCode,
  },
  {
    id: 'BCA Virtual Account',
    title: 'BCA Virtual Account',
    subtitle: 'Nomor VA: 8801 0812 9940 2211 · Konfirmasi 2 detik',
    icon: CreditCard,
  },
  {
    id: 'Mandiri Virtual Account',
    title: 'Mandiri Virtual Account',
    subtitle: 'Nomor VA: 8950 2201 8840 1120 · Bebas biaya admin',
    icon: CreditCard,
  },
  {
    id: 'GoPay / OVO Otomatis',
    title: 'GoPay / OVO',
    subtitle: 'Pembayaran langsung terhubung aplikasi dompet digital',
    icon: Smartphone,
  },
];

export function PaymentModal({
  booking,
  getAuthToken,
  onClose,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState(PAYMENT_CHANNELS[0].id);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!booking) return null;

  const handleConfirmPayment = async () => {
    setError(null);
    const token = await getAuthToken();
    if (!token) {
      setError('Sesi otentikasi kedaluwarsa. Silakan masuk ulang.');
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId: booking.id,
          paymentMethod: selectedMethod,
        }),
      });

      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error || 'Pembayaran gagal diverifikasi.');
        setProcessing(false);
        return;
      }

      onPaymentSuccess(payload.booking);
    } catch {
      setError('Gagal terhubung ke gateway pembayaran otomatis.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
      className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-lg overflow-hidden my-auto">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 id="payment-modal-title" className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
              Pembayaran Otomatis
            </h2>
            <p className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
              {booking.bookingCode} · {booking.vehicle.name}
            </p>
          </div>
          <button
            type="button"
            aria-label="Tutup pembayaran"
            onClick={onClose}
            className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="p-4 rounded-xl bg-slate-900 dark:bg-slate-950 dark:border dark:border-slate-800 text-white flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-300">Total Tagihan</p>
              <p className="font-mono text-2xl font-bold tabular-nums mt-0.5">
                {formatRupiah(booking.totalAmount)}
              </p>
            </div>
            <div className="text-right text-xs text-slate-300 font-mono tabular-nums">
              <p>{booking.startDate}</p>
              <p>s/d {booking.endDate}</p>
            </div>
          </div>

          <fieldset className="space-y-2.5">
            <legend className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Pilih Kanal Pembayaran Otomatis
            </legend>
            {PAYMENT_CHANNELS.map((channel) => {
              const Icon = channel.icon;
              const active = selectedMethod === channel.id;
              return (
                <label
                  key={channel.id}
                  className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors ${
                    active
                      ? 'border-blue-700 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={channel.id}
                    checked={active}
                    onChange={() => setSelectedMethod(channel.id)}
                    className="mt-1 accent-blue-700 dark:accent-blue-500"
                  />
                  <Icon className="w-5 h-5 text-slate-700 dark:text-slate-300 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{channel.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{channel.subtitle}</p>
                  </div>
                </label>
              );
            })}
          </fieldset>

          {error && (
            <p role="alert" className="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 rounded-lg p-3">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Bayar Nanti
            </button>
            <button
              type="button"
              disabled={processing}
              onClick={handleConfirmPayment}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 rounded-lg transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{processing ? 'Memverifikasi Gateway...' : 'Konfirmasi Pembayaran Sekarang'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
