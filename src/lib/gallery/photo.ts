/**
 * Galleribilleder holdes til 4 MB (mindre end de 8 MB der bruges til fx
 * nøglebilledet), for at være sikre på at blive under Vercels grænse på
 * 4,5 MB pr. anmodning - selv med lidt overhead fra multipart/form-data.
 */
export const MAX_GALLERY_PHOTO_SIZE_BYTES = 4 * 1024 * 1024;

export const GALLERY_PHOTO_BUCKET = 'gallery-photos';

export function galleryPhotoPathFor(photoId: string, extension: string): string {
  return `${photoId}.${extension}`;
}

const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/gif': 'gif',
};

export function extensionForContentType(contentType: string): string {
  return EXTENSION_BY_CONTENT_TYPE[contentType] ?? 'jpg';
}
