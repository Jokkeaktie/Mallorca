export const PHOTO_STORAGE_BUCKET = 'booking-photos';

/** 8 MB er rigeligt til et telefonfoto af et nøglegemmested og holder os godt inden for Supabases gratis lagerplads. */
export const MAX_PHOTO_SIZE_BYTES = 8 * 1024 * 1024;

/** Bevidst uden image/svg+xml, som kan indeholde script og derfor ikke bør vises direkte i browseren. */
export const ALLOWED_PHOTO_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/gif',
]);

export function photoStoragePathFor(bookingId: string): string {
  return `${bookingId}/photo`;
}
