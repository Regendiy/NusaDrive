import { CheckCircle2, Clock, Download, Printer, Receipt, X } from 'lucide-react';
import type { Booking } from '../types';
import { formatRupiah } from '../utils/clientPricing';
import { buildReceiptPlainText, computeReceiptSummary } from '../utils/receiptLogic';

interface ReceiptModalProps {
  booking: Booking | null;
  onClose: () => void;
}

export function ReceiptModal({ booking, onClose }: ReceiptModalProps) {
  if (!booking) return null;

  const summary = computeReceiptSummary(booking);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadTxt = () => {
    const text = buildReceiptPlainText(booking);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${summary.receiptNumber}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-modal-title"
      className="fixed inset-0 z-50 bg-slate-950/70 dark:bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="w-full max-w-lg my-auto space-y-3">
        {/* Printable Receipt Card */}
        <div
          data-receipt-printable="true"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xl print:bg-white print:text-slate-900 print:border-slate-200"
        >
          {/* Header Band */}
          <div className="bg-slate-950 dark:bg-slate-950 text-white px-6 py-5 flex items-start justify-between gap-4 border-b border-transparent dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-slate-300 text-xs">
                <Receipt className="w-4 h-4 text-blue-400" />
                <span>Struk Pembayaran Resmi</span>
              </div>
              <h2 id="receipt-modal-title" className="font-display text-xl font-bold tracking-tight mt-1">
                NusaDrive Batam
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Jl. Engku Putri, Batam Centre · Kepulauan Riau
              </p>
            </div>

            <button
              type="button"
              aria-label="Tutup struk pembayaran"
              onClick={onClose}
              className="print:hidden w-9 h-9 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Payment Verification Strip */}
          <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 print:bg-slate-50">
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 print:text-slate-500">Nomor Struk</p>
              <p className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums print:text-slate-900">
                {summary.receiptNumber}
              </p>
            </div>
            <div className="text-right">
              {summary.isPaid ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 print:text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{summary.statusLabel}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 print:text-amber-700">
                  <Clock className="w-4 h-4" />
                  <span>{summary.statusLabel}</span>
                </span>
              )}
              <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums mt-0.5 print:text-slate-500">
                {summary.isPaid ? summary.paidAtFormatted : summary.createdAtFormatted}
              </p>
            </div>
          </div>

          {/* Body Details */}
          <div className="p-6 space-y-5 text-sm">
            {/* Customer & Vehicle Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-5 border-b border-dashed border-slate-300 dark:border-slate-700 print:border-slate-300">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 print:text-slate-500">Data Penyewa</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100 print:text-slate-900">{booking.customerName}</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 break-all print:text-slate-600">{booking.customerEmail}</p>
                <p className="font-mono text-xs text-slate-600 dark:text-slate-300 tabular-nums print:text-slate-600">
                  +{booking.customerWhatsapp}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 print:text-slate-500">Armada &amp; Kode Booking</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100 print:text-slate-900">{booking.vehicle.name}</p>
                <p className="font-mono text-xs text-slate-700 dark:text-slate-300 tabular-nums print:text-slate-700">
                  {booking.vehicle.plateNumber} · {booking.vehicle.category}
                </p>
                <p className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400 tabular-nums print:text-blue-700">
                  {booking.bookingCode}
                </p>
              </div>
            </div>

            {/* Rental Schedule */}
            <div className="space-y-2 pb-5 border-b border-dashed border-slate-300 dark:border-slate-700 text-xs print:border-slate-300">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500 dark:text-slate-400 print:text-slate-500">Periode Sewa</span>
                <span className="font-mono font-medium text-slate-900 dark:text-slate-100 tabular-nums text-right print:text-slate-900">
                  {booking.startDate} s/d {booking.endDate} ({booking.totalDays} hari)
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500 dark:text-slate-400 print:text-slate-500">Layanan Pengemudi</span>
                <span className="font-medium text-slate-900 dark:text-slate-100 text-right print:text-slate-900">
                  {booking.withDriver ? 'Dengan Sopir Profesional' : 'Lepas Kunci'}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500 dark:text-slate-400 print:text-slate-500">Lokasi Pengambilan</span>
                <span className="font-medium text-slate-900 dark:text-slate-100 text-right max-w-[65%] print:text-slate-900">
                  {booking.pickupLocation}
                </span>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-300 print:text-slate-600">
                <span>Sewa Armada ({booking.totalDays} hari)</span>
                <span className="font-mono tabular-nums text-slate-900 dark:text-slate-100 print:text-slate-900">
                  {formatRupiah(summary.baseAmount)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300 print:text-slate-600">
                <span>Biaya Sopir</span>
                <span className="font-mono tabular-nums text-slate-900 dark:text-slate-100 print:text-slate-900">
                  {formatRupiah(summary.driverAmount)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300 print:text-slate-600">
                <span>PPN 11%</span>
                <span className="font-mono tabular-nums text-slate-900 dark:text-slate-100 print:text-slate-900">
                  {formatRupiah(summary.taxAmount)}
                </span>
              </div>
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline print:border-slate-200">
                <span className="font-semibold text-slate-900 dark:text-slate-100 print:text-slate-900">Total Pembayaran</span>
                <span className="font-mono text-xl font-bold text-slate-950 dark:text-white tabular-nums print:text-slate-950">
                  {formatRupiah(summary.totalAmount)}
                </span>
              </div>
            </div>

            {/* Payment Channel Footer */}
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs print:bg-slate-50 print:border-slate-200">
              <div>
                <p className="text-slate-500 dark:text-slate-400 print:text-slate-500">Metode Pembayaran</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5 print:text-slate-900">
                  {summary.paymentMethodLabel}
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-500 dark:text-slate-400 print:text-slate-500">Referensi Gateway</p>
                <p className="font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums mt-0.5 print:text-slate-900">
                  {summary.paymentReferenceLabel}
                </p>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center leading-relaxed pt-1 print:text-slate-500">
              Dokumen ini merupakan bukti transaksi digital sah NusaDrive Batam. Tunjukkan kode booking saat serah terima unit.
            </p>
          </div>
        </div>

        {/* Action Bar (hidden when printing) */}
        <div className="print:hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-2 shadow-lg">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Struk</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadTxt}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Struk (.txt)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
