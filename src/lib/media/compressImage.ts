/**
 * Formindsker et billede i browseren, før det uploades. iPhone-fotos (især
 * HEIC eller nyere højopløsningsbilleder) er ofte 5-15 MB - godt over både
 * vores egen 4 MB-grænse og Vercels harde grænse på 4,5 MB pr. anmodning.
 * Uden denne formindskning ville sådan et billede blive afvist uden en
 * tydelig fejlbesked (Vercel svarer med en 413, ikke vores egen JSON-fejl).
 *
 * GIF'er formindskes bevidst ikke, da det ville ødelægge animationen.
 * Ved enhver fejl returneres den oprindelige fil uændret - upload skal
 * aldrig fejle på grund af selve formindskningen.
 */

const SKIP_CONTENT_TYPES = new Set(['image/gif']);

export interface CompressImageOptions {
  maxDimension?: number;
  quality?: number;
}

export async function compressImageForUpload(
  file: File,
  { maxDimension = 2000, quality = 0.82 }: CompressImageOptions = {},
): Promise<File> {
  if (typeof document === 'undefined' || SKIP_CONTENT_TYPES.has(file.type)) {
    return file;
  }

  try {
    const source = await loadImageSource(file);
    const { width: sourceWidth, height: sourceHeight } = source;
    const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
    const width = Math.round(sourceWidth * scale);
    const height = Math.round(sourceHeight * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    ctx.drawImage(source.image, 0, 0, width, height);
    if (source.image instanceof ImageBitmap) source.image.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality),
    );
    if (!blob || blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^./]+$/, '') + '.jpg';
    return new File([blob], newName, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

async function loadImageSource(
  file: File,
): Promise<{ image: CanvasImageSource; width: number; height: number }> {
  if ('createImageBitmap' in window) {
    const bitmap = await createImageBitmap(file);
    return { image: bitmap, width: bitmap.width, height: bitmap.height };
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Kunne ikke indlæse billedet.'));
      el.src = objectUrl;
    });
    return { image, width: image.naturalWidth, height: image.naturalHeight };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
