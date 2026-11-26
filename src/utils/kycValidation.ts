export interface KycBookingInput {
  ktpNumber: string;
  ktpPhotoData: string;
  kkPhotoData: string;
  simPhotoData?: string;
  selfiePhotoData?: string;
  withDriver: boolean;
  termsAccepted: boolean;
}

export interface KycValidationResult {
  valid: boolean;
  error?: string;
  normalizedNik?: string;
}

export const MAX_IMAGE_DATA_URL_LENGTH = 1_500_000;
const SAFE_IMAGE_DATA_URL_REGEX =
  /^data:image\/(?:jpeg|jpg|png|webp);base64,[A-Za-z0-9+/]+=*$/i;

export function normalizeNikNumber(rawNik: string): {
  valid: boolean;
  normalized: string;
  error?: string;
} {
  const digits = String(rawNik || '').replace(/\D+/g, '');
  if (digits.length !== 16) {
    return {
      valid: false,
      normalized: digits,
      error: 'Nomor Induk Kependudukan (NIK e-KTP) harus terdiri dari tepat 16 digit angka.',
    };
  }
  return { valid: true, normalized: digits };
}

export function isValidImageDataUrl(dataUrl: string): boolean {
  if (!dataUrl || typeof dataUrl !== 'string') return false;
  if (dataUrl.length > MAX_IMAGE_DATA_URL_LENGTH) return false;
  return SAFE_IMAGE_DATA_URL_REGEX.test(dataUrl.trim());
}

export function validateKycSubmission(input: KycBookingInput): KycValidationResult {
  const nikCheck = normalizeNikNumber(input.ktpNumber);
  if (!nikCheck.valid) {
    return { valid: false, error: nikCheck.error };
  }

  if (!isValidImageDataUrl(input.ktpPhotoData)) {
    return {
      valid: false,
      error: 'Foto e-KTP asli wajib diunggah dalam format JPG, PNG, atau WebP (maks. 1,5 MB).',
    };
  }

  if (!isValidImageDataUrl(input.kkPhotoData)) {
    return {
      valid: false,
      error: 'Foto Kartu Keluarga (KK) wajib diunggah dalam format JPG, PNG, atau WebP (maks. 1,5 MB).',
    };
  }

  if (!input.withDriver && !isValidImageDataUrl(input.simPhotoData || '')) {
    return {
      valid: false,
      error: 'Untuk layanan Lepas Kunci, foto SIM A aktif wajib diunggah.',
    };
  }

  if (input.simPhotoData && !isValidImageDataUrl(input.simPhotoData)) {
    return {
      valid: false,
      error: 'Format foto SIM A tidak valid. Gunakan gambar JPG, PNG, atau WebP.',
    };
  }

  if (input.selfiePhotoData && !isValidImageDataUrl(input.selfiePhotoData)) {
    return {
      valid: false,
      error: 'Format foto swafoto tidak valid. Gunakan gambar JPG, PNG, atau WebP.',
    };
  }

  if (!input.termsAccepted) {
    return {
      valid: false,
      error: 'Anda wajib menyetujui syarat & ketentuan penyewaan kendaraan di Batam.',
    };
  }

  return {
    valid: true,
    normalizedNik: nikCheck.normalized,
  };
}

export const BATAM_RENTAL_REQUIREMENTS = [
  'e-KTP Asli (16 digit NIK sesuai identitas penyewa).',
  'Kartu Keluarga (KK) asli / foto jelas untuk verifikasi alamat domisili.',
  'SIM A aktif (wajib untuk paket Lepas Kunci; opsional jika memilih Dengan Sopir).',
  'Unit hanya beroperasi di wilayah Pulau Batam & Pulau Rempang/Galang (Barelang).',
  'Penyewa bertanggung jawab atas BBM, parkir, dan pelanggaran lalu lintas (ETLE) selama masa sewa.',
] as const;
