import { NextResponse, type NextRequest } from 'next/server';
import { hasFamilyOrAdminAccess, requireAdmin } from '@/lib/auth/accessControl';
import { createBugReport, listBugReports } from '@/lib/bugReports/repository';
import { bugReportPhotoPathFor, BUG_REPORT_PHOTO_BUCKET, extensionForContentType } from '@/lib/bugReports/photo';
import { bugReportSchema, MAX_BUG_REPORT_PHOTOS } from '@/lib/validation/bugReport';
import { ALLOWED_IMAGE_CONTENT_TYPES, MAX_IMAGE_SIZE_BYTES } from '@/lib/media/imagePolicy';
import { getServiceSupabaseClient } from '@/lib/supabase/serviceClient';
import type { BugReportPhoto } from '@/lib/types';
import { sendPushToAdmins } from '@/lib/notifications/push';

/**
 * GET /api/bug-reports – liste over alle fejlrapporter. Kun administratorer.
 * Der findes bevidst ingen "familie"-udgave af dette endpoint: rapporter er
 * kun synlige for lejlighedens ejere.
 */
export async function GET() {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: 'Ikke godkendt.' }, { status: 401 });
  }

  try {
    const reports = await listBugReports();
    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Fejl ved hentning af fejlrapporter', error);
    return NextResponse.json({ error: 'Der opstod en fejl.' }, { status: 500 });
  }
}

/**
 * POST /api/bug-reports – opret en ny fejlrapport med valgfrie billeder.
 * Tilgængelig for familie/venner OG administratorer (det er lejeren, der
 * indsender rapporten). Forventer multipart/form-data med felterne
 * "description", valgfrit "reporterName", og 0+ filer under "photos".
 */
export async function POST(request: NextRequest) {
  const isAllowed = await hasFamilyOrAdminAccess();
  if (!isAllowed) {
    return NextResponse.json({ error: 'Ikke godkendt.' }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: 'Ugyldigt input.' }, { status: 400 });
  }

  const parsed = bugReportSchema.safeParse({
    description: formData.get('description'),
    reporterName: formData.get('reporterName'),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ugyldigt input.' }, { status: 400 });
  }

  const photoFiles = formData.getAll('photos').filter((f): f is File => f instanceof File && f.size > 0);

  if (photoFiles.length > MAX_BUG_REPORT_PHOTOS) {
    return NextResponse.json(
      { error: `Højst ${MAX_BUG_REPORT_PHOTOS} billeder pr. rapport.` },
      { status: 400 },
    );
  }

  for (const file of photoFiles) {
    if (!ALLOWED_IMAGE_CONTENT_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'En eller flere filer har en filtype, der ikke understøttes.' },
        { status: 400 },
      );
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json({ error: 'Et eller flere billeder er for store. Maks 8 MB.' }, { status: 400 });
    }
  }

  const reportId = crypto.randomUUID();
  const supabase = getServiceSupabaseClient();
  const uploadedPhotos: BugReportPhoto[] = [];

  for (let i = 0; i < photoFiles.length; i++) {
    const file = photoFiles[i]!;
    const path = bugReportPhotoPathFor(reportId, i, extensionForContentType(file.type));
    const { error: uploadError } = await supabase.storage
      .from(BUG_REPORT_PHOTO_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: true });
    if (uploadError) {
      console.error('Fejl ved upload af fejlrapport-billede', uploadError);
      return NextResponse.json({ error: 'Kunne ikke uploade billederne.' }, { status: 500 });
    }
    uploadedPhotos.push({ path, contentType: file.type });
  }

  try {
    await createBugReport({
      id: reportId,
      description: parsed.data.description,
      reporterName: parsed.data.reporterName,
      photos: uploadedPhotos,
    });
    await sendPushToAdmins({
      title: 'Ny fejlrapport',
      body: parsed.data.reporterName
        ? `${parsed.data.reporterName}: ${parsed.data.description}`
        : parsed.data.description,
      url: '/admin/fejlrapporter',
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error('Fejl ved oprettelse af fejlrapport', error);
    return NextResponse.json({ error: 'Der opstod en fejl.' }, { status: 500 });
  }
}
