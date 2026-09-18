/**
 * Shrink a picked image before it goes anywhere.
 *
 * A phone screenshot is 1170×2532 and two to four megabytes of PNG, and it is being uploaded over
 * mobile data to prove a step count — the coach needs to read a number off it, not count pixels.
 * Re-encoding to a JPEG no wider than `maxPx` turns that into a couple of hundred kilobytes, which
 * is the difference between an upload that happens and one that is abandoned halfway.
 *
 * Everything here degrades rather than fails: a browser without `createImageBitmap`, a file the
 * decoder will not open, a canvas that refuses to export — each returns the original file, and the
 * upload carries on at full size. A screenshot that is already smaller than the cap is returned
 * untouched rather than re-encoded, so a small PNG is not made worse by a trip through JPEG.
 */

export interface DownscaleOptions {
  /** Longest side of the result, in pixels. */
  maxPx: number;
  /** JPEG quality, 0..1. */
  quality: number;
}

export const SCREENSHOT_DOWNSCALE: DownscaleOptions = { maxPx: 1080, quality: 0.8 };

export async function downscaleImage(
  file: File | Blob,
  { maxPx, quality }: DownscaleOptions = SCREENSHOT_DOWNSCALE,
): Promise<Blob> {
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }
  try {
    const longest = Math.max(bitmap.width, bitmap.height);
    if (longest <= maxPx) return file;
    const scale = maxPx / longest;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality),
    );
    // Keep whichever is actually smaller: a screenshot of flat UI can compress worse as JPEG.
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  } finally {
    bitmap.close();
  }
}

/**
 * Is this a clip rather than a picture?
 *
 * Decided on the media type the picker reports, because that is what the browser knows before any
 * decode is attempted. A file that reports nothing useful is treated as an image, which is the
 * safe way round: `downscaleImage` refuses politely on anything it cannot open.
 */
export function isVideoFile(file: File | Blob): boolean {
  return file.type.toLowerCase().startsWith('video/');
}

/**
 * The biggest clip the club will take, in bytes.
 *
 * **A browser cannot re-encode video.** `downscaleImage` exists because a canvas can redraw a
 * photograph at a tenth of the size; there is no equivalent for a clip that does not mean shipping
 * a transcoder, so the only honest control is a limit — stated on the card before the pick, and
 * enforced after it.
 *
 * 25 MB is roughly twenty seconds of 1080p from a modern phone, which is longer than any proof of
 * «двадцать приседаний» needs to be, and it keeps a month of a busy club inside a storage plan
 * rather than through it.
 */
export const MAX_VIDEO_BYTES = 25 * 1024 * 1024;

/** The file extension to store a blob under, from its media type. */
export function extensionFor(blob: Blob, fallback = 'jpg'): string {
  const type = blob.type.toLowerCase();
  if (type === 'image/jpeg') return 'jpg';
  if (type === 'image/png') return 'png';
  if (type === 'image/webp') return 'webp';
  if (type === 'image/heic' || type === 'image/heif') return 'heic';
  // The clip is stored as picked, so its extension is what tells `ProofMedia` to draw a player.
  if (type === 'video/mp4') return 'mp4';
  if (type === 'video/quicktime') return 'mov';
  if (type === 'video/webm') return 'webm';
  return fallback;
}

/** A blob as a `data:` URL, for demo mode where there is no bucket to put it in. */
export function toDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('read_failed'));
    reader.readAsDataURL(blob);
  });
}
