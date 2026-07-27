import { NextResponse } from 'next/server';
import { hasFamilyOrAdminAccess } from '@/lib/auth/accessControl';
import { KEY_PHOTO_STORAGE_BUCKET, getKeyPhotoInfo } from '@/lib/settings/keyPhoto';
import { getServiceSupabaseClient } from '@/lib/supabase/serviceClient';

/**
 * GET /api/key-photo/image
 *
 * Leverer selve billedet af det fælles nøglegemmested. Tilgængelig for
 * familie/venner OG administratorer. Billedet ligger i en privat
 * Storage-bucket og hentes her udelukkende via service role-nøglen; der er
 * ingen offentlig, gættelig URL til billedet.
 */
export async function GET() {
  const isAllowed = await hasFamilyOrAdminAccess();
  if (!isAllowed) {
    return NextResponse.json({ error: 'Ikke godkendt.' }, { status: 401 });
  }

  const info = await getKeyPhotoInfo();
  if (!info.photoPath) {
    return NextResponse.json({ error: 'Intet billede fundet.' }, { status: 404 });
  }

  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase.storage
    .from(KEY_PHOTO_STORAGE_BUCKET)
    .download(info.photoPath);

  if (error || !data) {
    console.error('Fejl ved hentning af nøglebillede', error);
    return NextResponse.json({ error: 'Kunne ikke hente billedet.' }, { status: 500 });
  }

  const arrayBuffer = await data.arrayBuffer();
  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: {
      'Content-Type': info.photoContentType ?? 'application/octet-stream',
      'Cache-Control': 'private, max-age=300',
    },
  });
}
