export const BUG_REPORT_PHOTO_BUCKET = 'bug-report-photos';

export function bugReportPhotoPathFor(reportId: string, index: number, extension: string): string {
  return `${reportId}/${index}.${extension}`;
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
