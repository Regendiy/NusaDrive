import type { Booking } from '../types';
import { formatRupiah } from './clientPricing';

export interface ReceiptSummary {
  receiptNumber: string;
  bookingCode: string;
  isPaid: boolean;
  statusLabel: string;
  paidAtFormatted: string;
  createdAtFormatted: string;
  subtotalAmount: number;
  baseAmount: number;
  driverAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethodLabel: string;
  paymentReferenceLabel: string;
}

export function formatReceiptNumber(booking: Pick<Booking, 'bookingCode' | 'paymentReference'>): string {
  if (booking.paymentReference && booking.paymentReference.trim()) {
    return `STRUK-${booking.paymentReference.trim().toUpperCase()}`;
  }
  return `STRUK-${booking.bookingCode.trim().toUpperCase()}`;
}

export function formatReceiptTimestamp(value: string | Date | null | undefined): string {
  if (!value) return 'Menunggu konfirmasi waktu';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Menunggu konfirmasi waktu';

  const datePart = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(date);

  const timePart = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta',
  }).format(date);

  return `${datePart}, ${timePart.replace('.', ':')} WIB`;
}

export function computeReceiptSummary(booking: Booking): ReceiptSummary {
  const isPaid = booking.paymentStatus === 'paid';
  const subtotalAmount = booking.baseAmount + booking.driverAmount;

  return {
    receiptNumber: formatReceiptNumber(booking),
    bookingCode: booking.bookingCode,
    isPaid,
    statusLabel: isPaid ? 'LUNAS TERVERIFIKASI' : 'BELUM DIBAYAR',
    paidAtFormatted: formatReceiptTimestamp(booking.paidAt),
    createdAtFormatted: formatReceiptTimestamp(booking.createdAt),
    subtotalAmount,
    baseAmount: booking.baseAmount,
    driverAmount: booking.driverAmount,
    taxAmount: booking.taxAmount,
    totalAmount: booking.totalAmount,
    paymentMethodLabel: booking.paymentMethod || 'Menunggu Pembayaran',
    paymentReferenceLabel: booking.paymentReference || '-',
  };
}

export function buildReceiptPlainText(booking: Booking): string {
  const summary = computeReceiptSummary(booking);
  const lines = [
    '====================================================',
    '            NUSADRIVE FLEET & MOBILITY              ',
    '        Kota Batam, Kepulauan Riau · Indonesia      ',
    '              STRUK PEMBAYARAN RESMI                ',
    '====================================================',
    `No. Struk        : ${summary.receiptNumber}`,
    `Kode Booking     : ${summary.bookingCode}`,
    `Status Bayar     : ${summary.statusLabel}`,
    `Waktu Pelunasan  : ${summary.paidAtFormatted}`,
    '----------------------------------------------------',
    'DATA PELANGGAN & UNIT',
    `Penyewa          : ${booking.customerName}`,
    `Email            : ${booking.customerEmail}`,
    `WhatsApp         : +${booking.customerWhatsapp}`,
    `Kendaraan        : ${booking.vehicle.name} (${booking.vehicle.plateNumber})`,
    `Layanan          : ${booking.withDriver ? 'Dengan Sopir' : 'Lepas Kunci'}`,
    `Periode Sewa     : ${booking.startDate} s/d ${booking.endDate} (${booking.totalDays} hari)`,
    `Lokasi Jemput    : ${booking.pickupLocation}`,
    '----------------------------------------------------',
    'RINCIAN BIAYA',
    `Sewa Armada      : ${formatRupiah(summary.baseAmount)}`,
    `Biaya Sopir      : ${formatRupiah(summary.driverAmount)}`,
    `PPN (11%)        : ${formatRupiah(summary.taxAmount)}`,
    `TOTAL DIBAYAR    : ${formatRupiah(summary.totalAmount)}`,
    `Metode Bayar     : ${summary.paymentMethodLabel}`,
    `Ref. Transaksi   : ${summary.paymentReferenceLabel}`,
    '====================================================',
    'Simpan struk ini sebagai bukti transaksi resmi.',
    'Terima kasih telah memilih NusaDrive Batam.',
  ];
  return lines.join('\n');
}
