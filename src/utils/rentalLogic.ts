import crypto from 'node:crypto';
import {
  calculateBookingPrice,
  calculateRentalDays,
  DateRangeBooking,
  formatRupiah,
  hasDateOverlap,
  normalizeWhatsappNumber,
  PricingInput,
  PricingResult,
} from './clientPricing.ts';

export {
  calculateBookingPrice,
  calculateRentalDays,
  formatRupiah,
  hasDateOverlap,
  normalizeWhatsappNumber,
};
export type { DateRangeBooking, PricingInput, PricingResult };

export type WhatsappEventType =
  | 'booking_created'
  | 'payment_confirmed'
  | 'pickup_ready'
  | 'rental_completed'
  | 'booking_cancelled';

export function generateBookingCode(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `NDV-${y}${m}${d}-${rand}`;
}

export function signWebhookPayload(orderId: string, amount: number, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(`${orderId}:${amount}`)
    .digest('hex');
}

export function verifyWebhookSignature(
  orderId: string,
  amount: number,
  secret: string,
  signature: string
): boolean {
  const expected = signWebhookPayload(orderId, amount, secret);
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function buildWhatsappMessage(
  eventType: WhatsappEventType,
  params: {
    customerName: string;
    bookingCode: string;
    vehicleName: string;
    startDate: string;
    endDate: string;
    totalAmount: number;
    pickupLocation: string;
    paymentMethod?: string;
  }
): string {
  const totalFormatted = formatRupiah(params.totalAmount);

  switch (eventType) {
    case 'booking_created':
      return (
        `Halo ${params.customerName}, pemesanan Anda di NusaDrive telah tercatat.\n` +
        `Kode Booking: ${params.bookingCode}\n` +
        `Unit: ${params.vehicleName}\n` +
        `Jadwal: ${params.startDate} s/d ${params.endDate}\n` +
        `Lokasi Ambil: ${params.pickupLocation}\n` +
        `Total Tagihan: ${totalFormatted}\n` +
        `Silakan selesaikan pembayaran otomatis melalui Portal Pelanggan untuk mengonfirmasi unit.`
      );
    case 'payment_confirmed':
      return (
        `Pembayaran Diterima! Terima kasih ${params.customerName}.\n` +
        `Kode Booking: ${params.bookingCode}\n` +
        `Metode: ${params.paymentMethod || 'Pembayaran Otomatis'}\n` +
        `Total Lunas: ${totalFormatted}\n` +
        `Unit ${params.vehicleName} telah dikunci untuk jadwal ${params.startDate} di ${params.pickupLocation}.`
      );
    case 'pickup_ready':
      return (
        `Unit Siap Diambil! Halo ${params.customerName}, ${params.vehicleName} untuk booking ${params.bookingCode} sudah siap di ${params.pickupLocation}. Harap membawa e-KTP & SIM A asli saat serah terima.`
      );
    case 'rental_completed':
      return (
        `Terima kasih ${params.customerName} telah menggunakan layanan NusaDrive. Penyewaan ${params.vehicleName} (${params.bookingCode}) telah selesai. Sampai jumpa di perjalanan berikutnya.`
      );
    case 'booking_cancelled':
      return (
        `Pemesanan ${params.bookingCode} (${params.vehicleName}) atas nama ${params.customerName} telah dibatalkan. Hubungi tim NusaDrive jika Anda memerlukan penjadwalan ulang.`
      );
  }
}

export function parseValidGatewayUrl(rawUrl?: string | null): string | null {
  if (typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed || /^https?:\/\/\d+(\/|$|:|\?)/.test(trimmed)) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return null;
    }
    if (
      !parsed.hostname ||
      parsed.hostname.startsWith('0.') ||
      (parsed.hostname !== 'localhost' && !parsed.hostname.includes('.'))
    ) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

