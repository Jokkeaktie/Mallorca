import { NextResponse, type NextRequest } from 'next/server';
import { hasFamilyOrAdminAccess, requireAdmin } from '@/lib/auth/accessControl';
import { createGalleryCategory, listGalleryCategories } from '@/lib/gallery/repository';
import { galleryCategorySchema } from '@/lib/validation/gallery';

/** GET /api/gallery/categories – liste over galleriets kategorier. Familie/venner og administratorer. */
export async function GET() {
  const isAllowed = await hasFamilyOrAdminAccess();
  if (!isAllowed) {
    return NextResponse.json({ error: 'Ikke godkendt.' }, { status: 401 });
  }

  try {
    const categories = await listGalleryCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Fejl ved hentning af galleri-kategorier', error);
    return NextResponse.json({ error: 'Der opstod en fejl.' }, { status: 500 });
  }
}

/** POST /api/gallery/categories – opret ny kategori. Kun administratorer. */
export async function POST(request: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: 'Ikke godkendt.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = galleryCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ugyldigt input.' }, { status: 400 });
  }

  try {
    const category = await createGalleryCategory(parsed.data.name);
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('Fejl ved oprettelse af galleri-kategori', error);
    return NextResponse.json({ error: 'Der opstod en fejl.' }, { status: 500 });
  }
}
