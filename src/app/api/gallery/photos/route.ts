import { NextResponse, type NextRequest } from 'next/server';
import { hasFamilyOrAdminAccess, requireAdmin } from '@/lib/auth/accessControl';
import { createGalleryPhoto, listGalleryPhotos } from '@/lib/gallery/repository';
import {
  GALLERY_PHOTO_BUCKET,
  MAX_GALLERY_PHOTO_SIZE_BYTES,
  extensionForContentType,
  galleryPhotoPathFor,
} from '@/lib/gallery/photo';
import { ALLOWED_IMAGE_CONTENT_TYPES } from '@/lib/media/imagePolicy';
import { getServiceSupabaseClient } from '@/lib/supabase/serviceClient';

/** GET /api/gallery/photos – liste over alle billeder (uden selve billeddataen). Familie/venner og administratorer. */
export async function GET() {
  const isAllowed = await hasFamilyOrAdminAccess();
  if (!isAllowed) {
    return NextResponse.json({ error: 'Ikke godkendt.' }, { status: 401 });
  }

  try {
    const photos = await listGalleryPhotos();
    return NextResponse.json({ photos });
  } catch (error) {
    console.error('Fejl ved hentning af galleribilleder', error);
    return NextResponse.json({ error: 'Der opstod en fejl.' }, { status: 500 });
  }
}

/**
 * POST /api/gallery/photos – uploader ét nyt billede. Kun administratorer.
 * Forventer multipart/form-data med felterne "photo" (fil) og valgfrit
 * "categoryId". Ét billede pr. kald (klienten uploader flere valgte filer
 * som separate kald), så hver anmodning holdes godt under Vercels grænse
 * på 4,5 MB pr. anmodning.
 */
export async function POST(request: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: 'Ikke godkendt.' }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get('photo');
  const categoryIdRaw = formData?.get('categoryId');
  const categoryId = typeof categoryIdRaw === 'string' && categoryIdRaw.length > 0 ? categoryIdRaw : null;

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Intet billede modtaget.' }, { status: 400 });
  }

  if (!ALLOWED_IMAGE_CONTENT_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: 'Filtypen understøttes ikke. Brug JPEG, PNG, WEBP, HEIC eller GIF.' },
      { status: 400 },
    );
  }

  if (file.size > MAX_GALLERY_PHOTO_SIZE_BYTES) {
    return NextResponse.json({ error: 'Billedet er for stort. Maks 4 MB.' }, { status: 400 });
  }

  const photoId = crypto.randomUUID();
  const path = galleryPhotoPathFor(photoId, extensionForContentType(file.type));

  const supabase = getServiceSupabaseClient();
  const { error: uploadError } = await supabase.storage
    .from(GALLERY_PHOTO_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: true });

  if (uploadError) {
    console.error('Fejl ved upload af galleribillede', uploadError);
    return NextResponse.json({ error: 'Kunne ikke uploade billedet.' }, { status: 500 });
  }

  try {
    const photo = await createGalleryPhoto({
      id: photoId,
      categoryId,
      photoPath: path,
      photoContentType: file.type,
    });
    return NextResponse.json({ photo }, { status: 201 });
  } catch (error) {
    console.error('Fejl ved oprettelse af galleribillede', error);
    return NextResponse.json({ error: 'Der opstod en fejl.' }, { status: 500 });
  }
}
