import { useState } from 'react';
import { CheckCircle2, FileText, ShieldAlert, ShieldCheck, X, XCircle } from 'lucide-react';
import type { Booking } from '../types';
import { isValidImageDataUrl } from '../utils/kycValidation';

interface KycDocumentsModalProps {
  booking: Booking | null;
  canModerate: boolean;
  onClose: () => void;
  onUpdateKyc: (
    bookingId: number,
    kycStatus: 'verified' | 'rejected' | 'pending',
    kycNotes: string
  ) => Promise<{ ok: boolean; error?: string }>;
}

export function KycDocumentsModal({
  booking,
  canModerate,
  onClose,
  onUpdateKyc,
}: KycDocumentsModalProps) {
  const [notes, setNotes] = useState(booking?.kycNotes || '');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!booking) return null;

  const docs = [
    {
      label: 'Foto e-KTP Penyewa',
      required: true,
      src: booking.ktpPhotoData,
    },
    {
      label: 'Foto Kartu Keluarga (KK)',
      required: true,
      src: booking.kkPhotoData,
    },
    {
      label: booking.withDriver ? 'Foto SIM A (Opsional)' : 'Foto SIM A Aktif (Wajib Lepas Kunci)',
      required: !booking.withDriver,
      src: booking.simPhotoData,
    },
    {
      label: 'Swafoto dengan e-KTP',
      required: false,
      src: booking.selfiePhotoData,
    },
  ];

  const handleAction = async (nextStatus: 'verified' | 'rejected') => {
    setErrorMsg(null);
    setSubmitting(true);
    const res = await onUpdateKyc(booking.id, nextStatus, notes.trim());
    setSubmitting(false);
    if (!res.ok) {
      setErrorMsg(res.error || 'Gagal memperbarui status verifikasi dokumen.');
      return;
    }
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="kyc-modal-title"
      className="fixed inset-0 z-50 bg-slate-950/65 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-3xl overflow-hidden my-auto">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div>
            <h2
              id="kyc-modal-title"
              className="font-display text-lg font-bold text-slate-900 dark:text-slate-100"
            >
              Dokumen Persyaratan &amp; KYC · {booking.bookingCode}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {booking.customerName} · {booking.vehicle.name} ·{' '}
              {booking.withDriver ? 'Dengan Sopir' : 'Lepas Kunci'}
            </p>
          </div>
          <button
            type="button"
            aria-label="Tutup pratinjau dokumen"
            onClick={onClose}
            className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">NIK e-KTP</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 mt-1 block tabular-nums">
                {booking.ktpNumber || 'Belum diisi'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Persetujuan Syarat Batam</span>
              <span className="font-medium text-emerald-700 dark:text-emerald-400 mt-1 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{booking.termsAccepted ? 'Disetujui Penyewa' : 'Belum Disetujui'}</span>
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Status Verifikasi</span>
              <span
                className={`font-semibold mt-1 inline-flex items-center gap-1 ${
                  booking.kycStatus === 'verified'
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : booking.kycStatus === 'rejected'
                    ? 'text-red-700 dark:text-red-400'
                    : 'text-amber-700 dark:text-amber-400'
                }`}
              >
                {booking.kycStatus === 'verified' ? (
                  <ShieldCheck className="w-3.5 h-3.5" />
                ) : booking.kycStatus === 'rejected' ? (
                  <XCircle className="w-3.5 h-3.5" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5" />
                )}
                <span>
                  {booking.kycStatus === 'verified'
                    ? 'Terverifikasi'
                    : booking.kycStatus === 'rejected'
                    ? 'Ditolak'
                    : 'Menunggu Verifikasi'}
                </span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {docs.map((doc) => {
              const hasValidImage = isValidImageDataUrl(doc.src || '');
              return (
                <div
                  key={doc.label}
                  className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950"
                >
                  <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {doc.label}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {hasValidImage ? 'Terunggah' : doc.required ? 'Belum ada' : 'Opsional'}
                    </span>
                  </div>
                  <div className="h-44 bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-2">
                    {hasValidImage ? (
                      <img
                        src={doc.src}
                        alt={doc.label}
                        className="max-h-full max-w-full object-contain rounded"
                      />
                    ) : (
                      <div className="text-center text-xs text-slate-400 dark:text-slate-500 flex flex-col items-center gap-1.5">
                        <FileText className="w-6 h-6" />
                        <span>Tidak dilampirkan</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {canModerate && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div>
                <label
                  htmlFor="kyc-review-notes"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Catatan Pemeriksa Dokumen (Opsional)
                </label>
                <input
                  id="kyc-review-notes"
                  type="text"
                  placeholder="Contoh: KTP & KK jelas, SIM A berlaku hingga 2028."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 dark:focus:ring-blue-500"
                />
              </div>

              {errorMsg && (
                <p className="text-xs text-red-700 dark:text-red-400">{errorMsg}</p>
              )}

              <div className="flex flex-wrap items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleAction('rejected')}
                  className="px-4 py-2 text-xs font-semibold text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors"
                >
                  Tolak Berkas
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleAction('verified')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-lg transition-colors"
                >
                  {submitting ? 'Menyimpan...' : 'Verifikasi & Setujui Berkas'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
