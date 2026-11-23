import { BLUEPRINT_CONSTRAINTS } from '../types';

/**
 * Compresses a user-selected image file in the browser so it fits safely
 * inside Firestore's per-field volumetric limits (<= 140,000 chars).
 */
export async function compressImageFile(file: File): Promise<string> {
  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(dataUrl);

  const maxDim = 680;
  let width = img.width;
  let height = img.height;

  if (width > maxDim || height > maxDim) {
    if (width >= height) {
      height = Math.round((height * maxDim) / width);
      width = maxDim;
    } else {
      width = Math.round((width * maxDim) / height);
      height = maxDim;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('تعذر معالجة الصورة في المتصفح');
  }

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  let quality = 0.72;
  let output = canvas.toDataURL('image/jpeg', quality);

  while (
    output.length > BLUEPRINT_CONSTRAINTS.listing.maxImageDataLength - 10000 &&
    quality > 0.35
  ) {
    quality -= 0.1;
    output = canvas.toDataURL('image/jpeg', quality);
  }

  if (output.length > BLUEPRINT_CONSTRAINTS.listing.maxImageDataLength) {
    // Final smaller dimension pass for very detailed photos
    const scale = 0.7;
    canvas.width = Math.max(240, Math.round(width * scale));
    canvas.height = Math.max(240, Math.round(height * scale));
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    output = canvas.toDataURL('image/jpeg', 0.55);
  }

  if (output.length > BLUEPRINT_CONSTRAINTS.listing.maxImageDataLength) {
    throw new Error('حجم الصورة كبير جداً، يرجى اختيار صورة أصغر.');
  }

  return output;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('تعذر قراءة ملف الصورة'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('ملف الصورة غير صالح'));
    img.src = src;
  });
}
