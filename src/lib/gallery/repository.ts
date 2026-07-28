import { getServiceSupabaseClient } from '@/lib/supabase/serviceClient';
import type { GalleryCategory, GalleryPhoto } from '@/lib/types';

interface GalleryCategoryRow {
  id: string;
  name: string;
  sort_order: number;
}

function categoryToDomain(row: GalleryCategoryRow): GalleryCategory {
  return { id: row.id, name: row.name, sortOrder: row.sort_order };
}

const CATEGORY_SELECT_COLUMNS = 'id, name, sort_order';

export async function listGalleryCategories(): Promise<GalleryCategory[]> {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from('gallery_categories')
    .select(CATEGORY_SELECT_COLUMNS)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data as GalleryCategoryRow[]).map(categoryToDomain);
}

export async function createGalleryCategory(name: string): Promise<GalleryCategory> {
  const supabase = getServiceSupabaseClient();

  const { data: existing, error: countError } = await supabase
    .from('gallery_categories')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1);
  if (countError) throw countError;
  const nextSortOrder = existing && existing.length > 0 ? existing[0]!.sort_order + 1 : 0;

  const { data, error } = await supabase
    .from('gallery_categories')
    .insert({ name, sort_order: nextSortOrder })
    .select(CATEGORY_SELECT_COLUMNS)
    .single();
  if (error) throw error;
  return categoryToDomain(data as GalleryCategoryRow);
}

export async function updateGalleryCategory(
  id: string,
  changes: Partial<{ name: string; sortOrder: number }>,
): Promise<GalleryCategory | null> {
  const supabase = getServiceSupabaseClient();
  const patch: Record<string, unknown> = {};
  if (changes.name !== undefined) patch.name = changes.name;
  if (changes.sortOrder !== undefined) patch.sort_order = changes.sortOrder;

  const { data, error } = await supabase
    .from('gallery_categories')
    .update(patch)
    .eq('id', id)
    .select(CATEGORY_SELECT_COLUMNS)
    .maybeSingle();
  if (error) throw error;
  return data ? categoryToDomain(data as GalleryCategoryRow) : null;
}

/** Sletter en kategori. Billeder i kategorien mister blot kategorien (bliver ukategoriserede). */
export async function deleteGalleryCategory(id: string): Promise<boolean> {
  const supabase = getServiceSupabaseClient();
  const { error, count } = await supabase
    .from('gallery_categories')
    .delete({ count: 'exact' })
    .eq('id', id);
  if (error) throw error;
  return (count ?? 0) > 0;
}

interface GalleryPhotoRow {
  id: string;
  category_id: string | null;
  photo_path: string;
  photo_content_type: string;
  sort_order: number;
  created_at: string;
}

function photoToDomain(row: GalleryPhotoRow): GalleryPhoto {
  return {
    id: row.id,
    categoryId: row.category_id,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

const PHOTO_SELECT_COLUMNS = 'id, category_id, photo_path, photo_content_type, sort_order, created_at';

export async function listGalleryPhotos(): Promise<GalleryPhoto[]> {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from('gallery_photos')
    .select(PHOTO_SELECT_COLUMNS)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data as GalleryPhotoRow[]).map(photoToDomain);
}

interface GalleryPhotoFile {
  photoPath: string;
  photoContentType: string;
}

export async function getGalleryPhotoFile(id: string): Promise<GalleryPhotoFile | null> {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from('gallery_photos')
    .select('photo_path, photo_content_type')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? { photoPath: data.photo_path, photoContentType: data.photo_content_type } : null;
}

export async function createGalleryPhoto(input: {
  id: string;
  categoryId: string | null;
  photoPath: string;
  photoContentType: string;
}): Promise<GalleryPhoto> {
  const supabase = getServiceSupabaseClient();

  // .eq() med null matcher ikke NULL-rækker i PostgREST - .is() skal bruges i stedet.
  let sortOrderQuery = supabase
    .from('gallery_photos')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1);
  sortOrderQuery =
    input.categoryId === null
      ? sortOrderQuery.is('category_id', null)
      : sortOrderQuery.eq('category_id', input.categoryId);
  const { data: existing, error: countError } = await sortOrderQuery;
  if (countError) throw countError;
  const nextSortOrder = existing && existing.length > 0 ? existing[0]!.sort_order + 1 : 0;

  const { data, error } = await supabase
    .from('gallery_photos')
    .insert({
      id: input.id,
      category_id: input.categoryId,
      photo_path: input.photoPath,
      photo_content_type: input.photoContentType,
      sort_order: nextSortOrder,
    })
    .select(PHOTO_SELECT_COLUMNS)
    .single();
  if (error) throw error;
  return photoToDomain(data as GalleryPhotoRow);
}

export async function updateGalleryPhoto(
  id: string,
  changes: Partial<{ categoryId: string | null; sortOrder: number }>,
): Promise<GalleryPhoto | null> {
  const supabase = getServiceSupabaseClient();
  const patch: Record<string, unknown> = {};
  if (changes.categoryId !== undefined) patch.category_id = changes.categoryId;
  if (changes.sortOrder !== undefined) patch.sort_order = changes.sortOrder;

  const { data, error } = await supabase
    .from('gallery_photos')
    .update(patch)
    .eq('id', id)
    .select(PHOTO_SELECT_COLUMNS)
    .maybeSingle();
  if (error) throw error;
  return data ? photoToDomain(data as GalleryPhotoRow) : null;
}

/** Sletter fotoets database-række. Selve filen i storage skal slettes separat (se API-ruten). */
export async function deleteGalleryPhoto(id: string): Promise<boolean> {
  const supabase = getServiceSupabaseClient();
  const { error, count } = await supabase
    .from('gallery_photos')
    .delete({ count: 'exact' })
    .eq('id', id);
  if (error) throw error;
  return (count ?? 0) > 0;
}
