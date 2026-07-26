export { MAX_IMAGE_SIZE_BYTES as MAX_PHOTO_SIZE_BYTES } from '@/lib/media/imagePolicy';
export { ALLOWED_IMAGE_CONTENT_TYPES as ALLOWED_PHOTO_CONTENT_TYPES } from '@/lib/media/imagePolicy';

export const PHOTO_STORAGE_BUCKET = 'booking-photos';

export function photoStoragePathFor(bookingId: string): string {
  return `${bookingId}/photo`;
}
