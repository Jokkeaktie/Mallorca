import { getServiceSupabaseClient } from '@/lib/supabase/serviceClient';

export { MAX_IMAGE_SIZE_BYTES as MAX_KEY_PHOTO_SIZE_BYTES } from '@/lib/media/imagePolicy';
export { ALLOWED_IMAGE_CONTENT_TYPES as ALLOWED_KEY_PHOTO_CONTENT_TYPES } from '@/lib/media/imagePolicy';

export const KEY_PHOTO_STORAGE_BUCKET = 'booking-photos';
export const KEY_PHOTO_STORAGE_PATH = 'key-location/photo';

export interface KeyPhotoInfo {
  photoPath: string | null;
  photoContentType: string | null;
}

export async function getKeyPhotoInfo(): Promise<KeyPhotoInfo> {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from('app_settings')
    .select('key_photo_path, key_photo_content_type')
    .eq('id', 1)
    .maybeSingle();
  if (error) throw error;
  return {
    photoPath: data?.key_photo_path ?? null,
    photoContentType: data?.key_photo_content_type ?? null,
  };
}

export async function setKeyPhoto(photoPath: string, photoContentType: string): Promise<void> {
  const supabase = getServiceSupabaseClient();
  const { error } = await supabase
    .from('app_settings')
    .upsert({ id: 1, key_photo_path: photoPath, key_photo_content_type: photoContentType });
  if (error) throw error;
}

export async function clearKeyPhoto(): Promise<void> {
  const supabase = getServiceSupabaseClient();
  const { error } = await supabase
    .from('app_settings')
    .upsert({ id: 1, key_photo_path: null, key_photo_content_type: null });
  if (error) throw error;
}
