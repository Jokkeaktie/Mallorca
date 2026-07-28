import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth/accessControl';
import {
  deleteGalleryPhoto,
  getGalleryPhotoFile,
  updateGalleryPhoto,
} from '@/lib/gallery/repository';
import { GALLERY_PHOTO_BUCKET } from '@/lib/gallery/photo';
import { galleryPhotoPatchSchema } from '@/lib/validation/gallery';
import { getServiceSupabaseClient } from '@/lib/supabase/serviceClient';

interface RouteParams {
  params: { id: string };
}

/** PATCH /api/gallery/photos/:id – flyt til anden kategori og/eller omarrangér. Kun administratorer. */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: 'Ikke godkendt.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = galleryPhotoPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ugyldigt input.' }, { status: 400 });
  }

  try {
    const photo = await updateGalleryPhoto(params.id, parsed.data);
    if (!photo) {
      return NextResponse.json({ error: 'Ikke fundet.' }, { status: 404 });
    }
    return NextResponse.json({ photo });
  } catch (error) {
    console.error('Fejl ved opdatering af galleribillede', error);
    return NextResponse.json({ error: 'Der opstod en fejl.' }, { status: 500 });
  }
}

/** DELETE /api/gallery/photos/:id – slet billede permanent (database + storage). Kun administratorer. */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: 'Ikke godkendt.' }, { status: 401 });
  }

  try {
    const file = await getGalleryPhotoFile(params.id);
    const deleted = await deleteGalleryPhoto(params.id);
    if (!deleted) {
      return NextResponse.json({ error: 'Ikke fundet.' }, { status: 404 });
    }

    if (file) {
      const supabase = getServiceSupabaseClient();
      const { error: removeError } = await supabase.storage
        .from(GALLERY_PHOTO_BUCKET)
        .remove([file.photoPath]);
      if (removeError) {
        console.error('Fejl ved sletning af galleribillede fra storage', removeError);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Fejl ved sletning af galleribillede', error);
    return NextResponse.json({ error: 'Der opstod en fejl.' }, { status: 500 });
  }
}
