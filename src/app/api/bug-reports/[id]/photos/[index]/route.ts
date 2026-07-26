import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth/accessControl';
import { getBugReportById } from '@/lib/bugReports/repository';
import { BUG_REPORT_PHOTO_BUCKET } from '@/lib/bugReports/photo';
import { getServiceSupabaseClient } from '@/lib/supabase/serviceClient';

interface RouteParams {
  params: { id: string; index: string };
}

/**
 * GET /api/bug-reports/:id/photos/:index – leverer et af de vedhæftede
 * billeder til en fejlrapport. Kun administratorer (rapporter er private).
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: 'Ikke godkendt.' }, { status: 401 });
  }

  const index = Number.parseInt(params.index, 10);
  if (!Number.isInteger(index) || index < 0) {
    return NextResponse.json({ error: 'Ugyldigt indeks.' }, { status: 400 });
  }

  const report = await getBugReportById(params.id);
  const photo = report?.photos[index];
  if (!photo) {
    return NextResponse.json({ error: 'Intet billede fundet.' }, { status: 404 });
  }

  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase.storage.from(BUG_REPORT_PHOTO_BUCKET).download(photo.path);

  if (error || !data) {
    console.error('Fejl ved hentning af fejlrapport-billede', error);
    return NextResponse.json({ error: 'Kunne ikke hente billedet.' }, { status: 500 });
  }

  const arrayBuffer = await data.arrayBuffer();
  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: {
      'Content-Type': photo.contentType,
      'Cache-Control': 'private, max-age=300',
    },
  });
}
