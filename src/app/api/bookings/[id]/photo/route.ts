import { NextResponse, type NextRequest } from 'next/server';
import { hasFamilyOrAdminAccess, requireAdmin } from '@/lib/auth/accessControl';
import {
  clearBookingPhoto,
  getBookingPhotoInfo,
  setBookingPhoto,
} from '@/lib/bookings/repository';
import {
  ALLOWED_PHOTO_CONTENT_TYPES,
  MAX_PHOTO_SIZE_BYTES,
  PHOTO_STORAGE_BUCKET,
  photoStoragePathFor,
} from '@/lib/bookings/photo';
import { getServiceSupabaseClient } from '@/lib/supabase/serviceClient';

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/bookings/:id/photo
 *
 * Leverer selve billedet (fx af et nøglegemmested) for en booking.
 * Tilgængelig for familie/venner OG administratorer – samme adgangsniveau
 * som resten af kalenderen, da det er meningen at næste gæst skal kunne se det.
 * Billedet ligger i en privat Storage-bucket og hentes her udelukkende via
 * service role-nøglen; der er ingen offentlig, gættelig URL til billedet.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const isAllowed = await hasFamilyOrAdminAccess();
  if (!isAllowed) {
    return NextResponse.json({ error: 'Ikke godkendt.' }, { status: 401 });
  }

  const info = await getBookingPhotoInfo(params.id);
  if (!info?.photoPath) {
    return NextResponse.json({ error: 'Intet billede fundet.' }, { status: 404 });
  }

  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase.storage
    .from(PHOTO_STORAGE_BUCKET)
    .download(info.photoPath);

  if (error || !data) {
    console.error('Fejl ved hentning af booking-billede', error);
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

/**
 * POST /api/bookings/:id/photo
 *
 * Uploader (eller erstatter) billedet for en booking. Tilgængelig for
 * familie/venner OG administratorer – det er typisk den afrejsende gæst,
 * der selv tager billedet af nøglegemmestedet til den næste gæst. Sletning
 * er bevidst forbeholdt administratorer (se DELETE nedenfor), så et billede
 * ikke kan fjernes permanent uden at blive erstattet.
 * Forventer multipart/form-data med et felt "photo".
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const isAllowed = await hasFamilyOrAdminAccess();
  if (!isAllowed) {
    return NextResponse.json({ error: 'Ikke godkendt.' }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get('photo');

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Intet billede modtaget.' }, { status: 400 });
  }

  if (!ALLOWED_PHOTO_CONTENT_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: 'Filtypen understøttes ikke. Brug JPEG, PNG, WEBP, HEIC eller GIF.' },
      { status: 400 },
    );
  }

  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    return NextResponse.json(
      { error: 'Billedet er for stort. Maks 8 MB.' },
      { status: 400 },
    );
  }

  const path = photoStoragePathFor(params.id);
  const supabase = getServiceSupabaseClient();
  const { error: uploadError } = await supabase.storage
    .from(PHOTO_STORAGE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: true });

  if (uploadError) {
    console.error('Fejl ved upload af booking-billede', uploadError);
    return NextResponse.json({ error: 'Kunne ikke uploade billedet.' }, { status: 500 });
  }

  const updated = await setBookingPhoto(params.id, path, file.type);
  if (!updated) {
    return NextResponse.json({ error: 'Kalenderposten blev ikke fundet.' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

/** DELETE /api/bookings/:id/photo – fjerner billedet fra en booking. Kun administratorer. */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: 'Ikke godkendt.' }, { status: 401 });
  }

  const info = await getBookingPhotoInfo(params.id);
  if (info?.photoPath) {
    const supabase = getServiceSupabaseClient();
    const { error: removeError } = await supabase.storage
      .from(PHOTO_STORAGE_BUCKET)
      .remove([info.photoPath]);
    if (removeError) {
      console.error('Fejl ved sletning af booking-billede fra storage', removeError);
    }
  }

  const updated = await clearBookingPhoto(params.id);
  if (!updated) {
    return NextResponse.json({ error: 'Kalenderposten blev ikke fundet.' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
