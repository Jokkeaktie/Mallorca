import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth/accessControl';
import { deleteBugReport, getBugReportById, updateBugReportStatus } from '@/lib/bugReports/repository';
import { BUG_REPORT_PHOTO_BUCKET } from '@/lib/bugReports/photo';
import { bugReportStatusSchema } from '@/lib/validation/bugReport';
import { getServiceSupabaseClient } from '@/lib/supabase/serviceClient';

interface RouteParams {
  params: { id: string };
}

/** PATCH /api/bug-reports/:id – skift status (ny/løst). Kun administratorer. */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: 'Ikke godkendt.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bugReportStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ugyldigt input.' }, { status: 400 });
  }

  try {
    const report = await updateBugReportStatus(params.id, parsed.data.status);
    if (!report) {
      return NextResponse.json({ error: 'Ikke fundet.' }, { status: 404 });
    }
    return NextResponse.json({ report });
  } catch (error) {
    console.error('Fejl ved opdatering af fejlrapport', error);
    return NextResponse.json({ error: 'Der opstod en fejl.' }, { status: 500 });
  }
}

/** DELETE /api/bug-reports/:id – slet fejlrapport (og tilknyttede billeder). Kun administratorer. */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: 'Ikke godkendt.' }, { status: 401 });
  }

  try {
    const report = await getBugReportById(params.id);
    if (report && report.photos.length > 0) {
      const supabase = getServiceSupabaseClient();
      const { error: removeError } = await supabase.storage
        .from(BUG_REPORT_PHOTO_BUCKET)
        .remove(report.photos.map((p) => p.path));
      if (removeError) {
        console.error('Fejl ved sletning af fejlrapport-billeder', removeError);
      }
    }

    const deleted = await deleteBugReport(params.id);
    if (!deleted) {
      return NextResponse.json({ error: 'Ikke fundet.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Fejl ved sletning af fejlrapport', error);
    return NextResponse.json({ error: 'Der opstod en fejl.' }, { status: 500 });
  }
}
