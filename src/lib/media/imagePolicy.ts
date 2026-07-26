/** Delte regler for billed-uploads (nøglebilleder, fejlrapport-billeder m.fl.). */

/** 8 MB er rigeligt til et telefonfoto og holder os godt inden for Supabases gratis lagerplads. */
export const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;

/** Bevidst uden image/svg+xml, som kan indeholde script og derfor ikke bør vises direkte i browseren. */
export const ALLOWED_IMAGE_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/gif',
]);
