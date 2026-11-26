const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

export async function compressImageFileToDataUrl(
  file: File,
  maxWidth = 960,
  quality = 0.78
): Promise<string> {
  if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
    throw new Error('Format file harus berupa JPG, PNG, atau WebP.');
  }

  if (file.size > 8 * 1024 * 1024) {
    throw new Error('Ukuran file foto maksimal 8 MB sebelum kompresi.');
  }

  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Gagal membaca file foto.'));
    reader.readAsDataURL(file);
  });

  // Resize & compress onto HTML5 Canvas as JPEG to stay well within payload limits
  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = img.width > maxWidth ? maxWidth / img.width : 1;
      const targetW = Math.max(1, Math.round(img.width * scale));
      const targetH = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(rawDataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, targetW, targetH);
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed.length < rawDataUrl.length ? compressed : rawDataUrl);
    };
    img.onerror = () => resolve(rawDataUrl);
    img.src = rawDataUrl;
  });
}
