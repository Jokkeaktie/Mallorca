import { NextResponse, type NextRequest } from 'next/server';
import { hasFamilyOrAdminAccess } from '@/lib/auth/accessControl';
import { getGalleryPhotoFile } from '@/lib/gallery/repository';
import { GALLERY_PHOTO_BUCKET } from '@/lib/gallery/photo';
import { getServiceSupabaseClient } from '@/lib/supabase/serviceClient';

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/gallery/photos/:id/image – leverer selve billeddataen.
 * Tilgængelig for familie/venner OG administratorer. Billedet ligger i en
 * privat Storage-bucket og hentes her udelukkende via service role-nøglen;
 * der er ingen offentlig, gættelig URL til billedet.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const isAllowed = await hasFamilyOrAdminAccess();
  if (!isAllowed) {
    return NextResponse.json({ error: 'Ikke godkendt.' }, { status: 401 });
  }

  const file = await getGalleryPhotoFile(params.id);
  if (!file) {
    return NextResponse.json({ error: 'Intet billede fundet.' }, { status: 404 });
  }

  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase.storage.from(GALLERY_PHOTO_BUCKET).download(file.photoPath);

  if (error || !data) {
    console.error('Fejl ved hentning af galleribillede', error);
    return NextResponse.json({ error: 'Kunne ikke hente billedet.' }, { status: 500 });
  }

  const arrayBuffer = await data.arrayBuffer();
  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: {
      'Content-Type': file.photoContentType,
      'Cache-Control': 'private, max-age=300',
    },
  });
}
