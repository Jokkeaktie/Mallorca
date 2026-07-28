import { NextResponse, type NextRequest } from 'next/server';
import { hasFamilyOrAdminAccess, requireAdmin } from '@/lib/auth/accessControl';
import {
  ALLOWED_KEY_PHOTO_CONTENT_TYPES,
  KEY_PHOTO_STORAGE_BUCKET,
  KEY_PHOTO_STORAGE_PATH,
  MAX_KEY_PHOTO_SIZE_BYTES,
  clearKeyPhoto,
  getKeyPhotoInfo,
  setKeyPhoto,
} from '@/lib/settings/keyPhoto';
import { getServiceSupabaseClient } from '@/lib/supabase/serviceClient';
import { sendPushToAdmins } from '@/lib/notifications/push';

/**
 * GET /api/key-photo
 *
 * Fortæller kun OM der findes et fælles billede af nøglegemmestedet (ikke
 * knyttet til en bestemt booking) – selve billedet hentes separat via
 * /api/key-photo/image, som selv tjekker adgang.
 */
export async function GET() {
  const isAllowed = await hasFamilyOrAdminAccess();
  if (!isAllowed) {
    return NextResponse.json({ error: 'Ikke godkendt.' }, { status: 401 });
  }

  const info = await getKeyPhotoInfo();
  return NextResponse.json({ hasPhoto: !!info.photoPath });
}

/**
 * POST /api/key-photo
 *
 * Uploader (eller erstatter) det fælles billede af nøglegemmestedet.
 * Tilgængelig for familie/venner OG administratorer – det er typisk den
 * afrejsende gæst, der selv tager billedet til den næste gæst. Sletning er
 * bevidst forbeholdt administratorer (se DELETE nedenfor).
 * Forventer multipart/form-data med et felt "photo".
 */
export async function POST(request: NextRequest) {
  const isAllowed = await hasFamilyOrAdminAccess();
  if (!isAllowed) {
    return NextResponse.json({ error: 'Ikke godkendt.' }, { status: 401 });
  }
  const isAdmin = !!(await requireAdmin());

  const formData = await request.formData().catch(() => null);
  const file = formData?.get('photo');

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Intet billede modtaget.' }, { status: 400 });
  }

  if (!ALLOWED_KEY_PHOTO_CONTENT_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: 'Filtypen understøttes ikke. Brug JPEG, PNG, WEBP, HEIC eller GIF.' },
      { status: 400 },
    );
  }

  if (file.size > MAX_KEY_PHOTO_SIZE_BYTES) {
    return NextResponse.json({ error: 'Billedet er for stort. Maks 8 MB.' }, { status: 400 });
  }

  const supabase = getServiceSupabaseClient();
  const { error: uploadError } = await supabase.storage
    .from(KEY_PHOTO_STORAGE_BUCKET)
    .upload(KEY_PHOTO_STORAGE_PATH, file, { contentType: file.type, upsert: true });

  if (uploadError) {
    console.error('Fejl ved upload af nøglebillede', uploadError);
    return NextResponse.json({ error: 'Kunne ikke uploade billedet.' }, { status: 500 });
  }

  await setKeyPhoto(KEY_PHOTO_STORAGE_PATH, file.type);

  if (!isAdmin) {
    // Kun push, hvis det er familie/venner der har lagt et nyt billede op -
    // administratorer behøver ikke selv få besked om deres egen handling.
    await sendPushToAdmins({
      title: 'Nyt nøglebillede',
      body: 'Der er lagt et nyt billede af nøglegemmestedet op.',
      url: '/',
    });
  }

  return NextResponse.json({ ok: true });
}

/** DELETE /api/key-photo – fjerner det fælles nøglebillede. Kun administratorer. */
export async function DELETE() {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: 'Ikke godkendt.' }, { status: 401 });
  }

  const info = await getKeyPhotoInfo();
  if (info.photoPath) {
    const supabase = getServiceSupabaseClient();
    const { error: removeError } = await supabase.storage
      .from(KEY_PHOTO_STORAGE_BUCKET)
      .remove([info.photoPath]);
    if (removeError) {
      console.error('Fejl ved sletning af nøglebillede fra storage', removeError);
    }
  }

  await clearKeyPhoto();
  return NextResponse.json({ ok: true });
}
