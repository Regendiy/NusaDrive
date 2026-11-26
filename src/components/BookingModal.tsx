import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  FileCheck2,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type { UserProfile, Vehicle } from '../types';
import {
  addDaysIsoDate,
  BATAM_PICKUP_LOCATIONS,
  calculateBookingPrice,
  DateRangeBooking,
  formatRupiah,
  getTodayIsoDate,
  hasDateOverlap,
  normalizeWhatsappNumber,
} from '../utils/clientPricing';
import { compressImageFileToDataUrl } from '../utils/imageUpload';
import {
  BATAM_RENTAL_REQUIREMENTS,
  validateKycSubmission,
} from '../utils/kycValidation';

interface BookingModalProps {
  vehicle: Vehicle | null;
  initialStartDate?: string;
  initialEndDate?: string;
  initialPickupLocation?: string;
  user: UserProfile | null;
  getAuthToken: () => Promise<string | null>;
  onSignIn: () => Promise<void>;
  onClose: () => void;
  onBookingCreated: (bookingId: number) => void;
}

export function BookingModal({
  vehicle,
  initialStartDate,
  initialEndDate,
  initialPickupLocation,
  user,
  getAuthToken,
  onSignIn,
  onClose,
  onBookingCreated,
}: BookingModalProps) {
  const today = getTodayIsoDate();
  const [startDate, setStartDate] = useState(initialStartDate || today);
  const [endDate, setEndDate] = useState(initialEndDate || addDaysIsoDate(today, 2));
  const [withDriver, setWithDriver] = useState(false);
  const [pickupLocation, setPickupLocation] = useState<string>(
    initialPickupLocation || BATAM_PICKUP_LOCATIONS[0]
  );
  const pickupOptions = BATAM_PICKUP_LOCATIONS.includes(
    pickupLocation as (typeof BATAM_PICKUP_LOCATIONS)[number]
  )
    ? [...BATAM_PICKUP_LOCATIONS]
    : [pickupLocation, ...BATAM_PICKUP_LOCATIONS];
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [whatsapp, setWhatsapp] = useState(user?.phone || '');
  const [notes, setNotes] = useState('');
  const [ktpNumber, setKtpNumber] = useState('');
  const [ktpPhotoData, setKtpPhotoData] = useState('');
  const [kkPhotoData, setKkPhotoData] = useState('');
  const [simPhotoData, setSimPhotoData] = useState('');
  const [selfiePhotoData, setSelfiePhotoData] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [bookedDates, setBookedDates] = useState<DateRangeBooking[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user?.name && !customerName) {
      setCustomerName(user.name);
    }
  }, [user, customerName]);

  useEffect(() => {
    if (!vehicle) return;
    let active = true;
    fetch(`/api/vehicles/${vehicle.id}/booked-dates`)
      .then((res) => res.json())
      .then((data) => {
        if (active && Array.isArray(data.bookedDates)) {
          setBookedDates(data.bookedDates);
        }
      })
      .catch(() => {
        if (active) setBookedDates([]);
      });
    return () => {
      active = false;
    };
  }, [vehicle]);

  const pricing = useMemo(() => {
    if (!vehicle) return null;
    return calculateBookingPrice({
      dailyRate: vehicle.dailyRate,
      driverFeePerDay: vehicle.driverFeePerDay,
      startDate,
      endDate,
      withDriver,
    });
  }, [vehicle, startDate, endDate, withDriver]);

  const dateConflict = useMemo(() => {
    if (!startDate || !endDate) return false;
    return hasDateOverlap(bookedDates, startDate, endDate);
  }, [bookedDates, startDate, endDate]);

  if (!vehicle || !pricing) return null;

  const handlePhotoUpload = async (
    field: 'ktp' | 'kk' | 'sim' | 'selfie',
    file: File | undefined
  ) => {
    if (!file) return;
    setErrorMsg(null);
    setUploadingField(field);
    try {
      const dataUrl = await compressImageFileToDataUrl(file);
      if (field === 'ktp') setKtpPhotoData(dataUrl);
      else if (field === 'kk') setKkPhotoData(dataUrl);
      else if (field === 'sim') setSimPhotoData(dataUrl);
      else setSelfiePhotoData(dataUrl);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal mengunggah gambar dokumen.');
    } finally {
      setUploadingField(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!pricing.valid) {
      setErrorMsg(pricing.error || 'Rentang tanggal tidak valid.');
      return;
    }

    if (dateConflict) {
      setErrorMsg('Rentang tanggal bertabrakan dengan jadwal pemesanan lain.');
      return;
    }

    const waCheck = normalizeWhatsappNumber(whatsapp);
    if (!waCheck.valid) {
      setErrorMsg(waCheck.error || 'Nomor WhatsApp tidak valid.');
      return;
    }

    const kycCheck = validateKycSubmission({
      ktpNumber,
      ktpPhotoData,
      kkPhotoData,
      simPhotoData,
      selfiePhotoData,
      withDriver,
      termsAccepted,
    });
    if (!kycCheck.valid) {
      setErrorMsg(kycCheck.error || 'Lengkapi berkas persyaratan sewa.');
      return;
    }

    if (!user) {
      await onSignIn();
      return;
    }

    const token = await getAuthToken();
    if (!token) {
      setErrorMsg('Sesi login tidak ditemukan. Silakan masuk kembali.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          vehicleId: vehicle.id,
          startDate,
          endDate,
          withDriver,
          pickupLocation,
          customerWhatsapp: waCheck.formatted,
          customerName: customerName.trim() || user.name,
          notes: notes.trim(),
          ktpNumber: kycCheck.normalizedNik,
          ktpPhotoData,
          kkPhotoData,
          simPhotoData,
          selfiePhotoData,
          termsAccepted,
        }),
      });

      const payload = await res.json();
      if (!res.ok) {
        setErrorMsg(payload.error || 'Gagal menyimpan pemesanan.');
        setSubmitting(false);
        return;
      }

      onBookingCreated(payload.booking.id);
    } catch {
      setErrorMsg('Terjadi gangguan jaringan saat membuat pemesanan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
      className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-2xl overflow-hidden my-auto">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div>
            <h2 id="booking-modal-title" className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
              Pemesanan {vehicle.name}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {vehicle.category} · {vehicle.transmission} · {vehicle.plateNumber}
            </p>
          </div>
          <button
            type="button"
            aria-label="Tutup formulir pemesanan"
            onClick={onClose}
            className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {bookedDates.length > 0 && (
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
              <p className="font-medium text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Jadwal unit yang sudah terisi:</span>
              </p>
              <p className="font-mono tabular-nums">
                {bookedDates.map((d) => `${d.startDate} s/d ${d.endDate}`).join(' · ')}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="booking-start" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Tanggal Mulai Sewa
              </label>
              <input
                id="booking-start"
                type="date"
                min={today}
                required
                value={startDate}
                onChange={(e) => {
                  const val = e.target.value;
                  setStartDate(val);
                  if (val > endDate) {
                    setEndDate(addDaysIsoDate(val, 1));
                  }
                }}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 dark:focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="booking-end" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Tanggal Pengembalian
              </label>
              <input
                id="booking-end"
                type="date"
                min={startDate}
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 dark:focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="booking-name" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Nama Lengkap Penyewa
              </label>
              <input
                id="booking-name"
                type="text"
                required
                placeholder="Contoh: Budi Santoso"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 dark:focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="booking-wa" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Nomor WhatsApp Aktif
              </label>
              <input
                id="booking-wa"
                type="tel"
                required
                placeholder="081234567890"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 dark:focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div>
              <label htmlFor="booking-location" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Titik Pengambilan Unit
              </label>
              <select
                id="booking-location"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-700 dark:focus:ring-blue-500"
              >
                {pickupOptions.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Layanan Pengemudi
              </span>
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => setWithDriver(false)}
                  className={`py-1.5 px-2 text-xs font-medium rounded-md transition-colors ${
                    !withDriver
                      ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Lepas Kunci
                </button>
                <button
                  type="button"
                  onClick={() => setWithDriver(true)}
                  className={`py-1.5 px-2 text-xs font-medium rounded-md transition-colors ${
                    withDriver
                      ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Dengan Sopir
                </button>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="booking-notes" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Catatan Tambahan (Opsional)
            </label>
            <input
              id="booking-notes"
              type="text"
              placeholder="Permintaan kursi anak, jam pengambilan, atau nomor penerbangan"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 dark:focus:ring-blue-500"
            />
          </div>

          {/* Syarat Pemesanan & Upload Dokumen KYC */}
          <div
            data-testid="booking-kyc-section"
            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                  <span>Syarat Sewa &amp; Unggah Dokumen (KYC)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Foto e-KTP &amp; Kartu Keluarga wajib diunggah untuk keamanan serah-terima unit di Batam.
                </p>
              </div>
            </div>

            <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300 list-disc pl-4">
              {BATAM_RENTAL_REQUIREMENTS.map((req) => (
                <li key={req}>{req}</li>
              ))}
            </ul>

            <div>
              <label htmlFor="booking-nik" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                NIK Sesuai e-KTP (16 Digit) <span className="text-red-600">*</span>
              </label>
              <input
                id="booking-nik"
                type="text"
                inputMode="numeric"
                maxLength={20}
                required
                placeholder="Contoh: 2171051208940001"
                value={ktpNumber}
                onChange={(e) => setKtpNumber(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 dark:focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  key: 'ktp' as const,
                  inputId: 'upload-ktp',
                  label: 'Foto e-KTP Asli',
                  required: true,
                  value: ktpPhotoData,
                  clear: () => setKtpPhotoData(''),
                },
                {
                  key: 'kk' as const,
                  inputId: 'upload-kk',
                  label: 'Foto Kartu Keluarga (KK)',
                  required: true,
                  value: kkPhotoData,
                  clear: () => setKkPhotoData(''),
                },
                {
                  key: 'sim' as const,
                  inputId: 'upload-sim',
                  label: withDriver ? 'Foto SIM A (Opsional)' : 'Foto SIM A Aktif',
                  required: !withDriver,
                  value: simPhotoData,
                  clear: () => setSimPhotoData(''),
                },
                {
                  key: 'selfie' as const,
                  inputId: 'upload-selfie',
                  label: 'Swafoto + e-KTP (Opsional)',
                  required: false,
                  value: selfiePhotoData,
                  clear: () => setSelfiePhotoData(''),
                },
              ].map((doc) => (
                <div
                  key={doc.key}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor={doc.inputId}
                      className="text-xs font-semibold text-slate-800 dark:text-slate-200"
                    >
                      {doc.label}{' '}
                      {doc.required && <span className="text-red-600">*</span>}
                    </label>
                    {doc.value && (
                      <button
                        type="button"
                        aria-label={`Hapus ${doc.label}`}
                        onClick={doc.clear}
                        className="text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {doc.value ? (
                    <div className="relative h-20 rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <img
                        src={doc.value}
                        alt={doc.label}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <label
                      htmlFor={doc.inputId}
                      className="h-20 border border-dashed border-slate-300 dark:border-slate-700 rounded-md flex flex-col items-center justify-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:border-blue-600 dark:hover:border-blue-500 cursor-pointer transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      <span>
                        {uploadingField === doc.key
                          ? 'Mengompresi...'
                          : 'Pilih Foto (JPG/PNG)'}
                      </span>
                    </label>
                  )}

                  <input
                    id={doc.inputId}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      handlePhotoUpload(doc.key, e.target.files?.[0]);
                      e.target.value = '';
                    }}
                    className="sr-only"
                  />
                </div>
              ))}
            </div>

            <label
              htmlFor="booking-terms"
              className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none pt-1"
            >
              <input
                id="booking-terms"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-700 focus:ring-blue-700"
              />
              <span>
                Saya menyatakan dokumen e-KTP, Kartu Keluarga, dan SIM A yang diunggah adalah asli serta menyetujui syarat operasional wilayah Pulau Batam.
              </span>
            </label>
          </div>

          {/* Real-Time Price Breakdown */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Sewa kendaraan ({pricing.totalDays} hari × {formatRupiah(vehicle.dailyRate)})</span>
              <span className="font-mono tabular-nums text-slate-900 dark:text-slate-100">{formatRupiah(pricing.baseAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Jasa sopir ({withDriver ? `${pricing.totalDays} hari` : 'Lepas kunci'})</span>
              <span className="font-mono tabular-nums text-slate-900 dark:text-slate-100">{formatRupiah(pricing.driverAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>PPN 11%</span>
              <span className="font-mono tabular-nums text-slate-900 dark:text-slate-100">{formatRupiah(pricing.taxAmount)}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline">
              <span className="font-semibold text-slate-900 dark:text-slate-100">Total Pembayaran</span>
              <span className="font-mono text-lg font-bold text-blue-700 dark:text-blue-400 tabular-nums">
                {formatRupiah(pricing.totalAmount)}
              </span>
            </div>
          </div>

          {(errorMsg || dateConflict) && (
            <div role="alert" className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg || 'Tanggal yang Anda pilih bertabrakan dengan pemesanan aktif lainnya.'}</span>
            </div>
          )}

          {!user && (
            <div className="p-3.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200 flex items-center justify-between gap-3">
              <span>Masuk dengan akun Google Anda untuk menyimpan pemesanan dan menerima notifikasi WhatsApp otomatis.</span>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || dateConflict || !pricing.valid}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 dark:disabled:text-slate-400 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {submitting
                  ? 'Memproses...'
                  : user
                  ? 'Konfirmasi & Lanjut Bayar'
                  : 'Masuk dengan Google & Pesan'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
