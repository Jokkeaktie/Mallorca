// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { compressImageForUpload } from '@/lib/media/compressImage';

describe('compressImageForUpload', () => {
  it('lader GIF-filer være urørt, så en eventuel animation bevares', async () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'sjov.gif', { type: 'image/gif' });
    const result = await compressImageForUpload(file);
    expect(result).toBe(file);
  });
});
