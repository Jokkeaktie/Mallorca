import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth/accessControl';
import { deleteGalleryCategory, updateGalleryCategory } from '@/lib/gallery/repository';
import { galleryCategoryPatchSchema } from '@/lib/validation/gallery';

interface RouteParams {
  params: { id: string };
}

/** PATCH /api/gallery/categories/:id – omdøb og/eller flyt kategori. Kun administratorer. */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: 'Ikke godkendt.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = galleryCategoryPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ugyldigt input.' }, { status: 400 });
  }

  try {
    const category = await updateGalleryCategory(params.id, parsed.data);
    if (!category) {
      return NextResponse.json({ error: 'Ikke fundet.' }, { status: 404 });
    }
    return NextResponse.json({ category });
  } catch (error) {
    console.error('Fejl ved opdatering af galleri-kategori', error);
    return NextResponse.json({ error: 'Der opstod en fejl.' }, { status: 500 });
  }
}

/**
 * DELETE /api/gallery/categories/:id – slet kategori. Kun administratorer.
 * Billeder i kategorien slettes IKKE – de mister blot kategorien (se
 * "on delete set null" i databaseskemaet).
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: 'Ikke godkendt.' }, { status: 401 });
  }

  try {
    const deleted = await deleteGalleryCategory(params.id);
    if (!deleted) {
      return NextResponse.json({ error: 'Ikke fundet.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Fejl ved sletning af galleri-kategori', error);
    return NextResponse.json({ error: 'Der opstod en fejl.' }, { status: 500 });
  }
}
