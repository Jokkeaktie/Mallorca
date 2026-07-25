import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth/accessControl';
import { deleteChecklistItem, updateChecklistItem } from '@/lib/content/checklist';
import { checklistItemSchema } from '@/lib/validation/content';
import { z } from 'zod';

interface RouteParams {
  params: { id: string };
}

const patchSchema = z
  .object({
    text: checklistItemSchema.shape.text.optional(),
    sortOrder: z.number().int().optional(),
  })
  .refine((data) => data.text !== undefined || data.sortOrder !== undefined, {
    message: 'Intet at opdatere.',
  });

/** PATCH /api/checklist/:id – ret tekst og/eller rækkefølge. Kun administratorer. */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: 'Ikke godkendt.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ugyldigt input.' }, { status: 400 });
  }

  try {
    const item = await updateChecklistItem(params.id, parsed.data);
    if (!item) {
      return NextResponse.json({ error: 'Ikke fundet.' }, { status: 404 });
    }
    return NextResponse.json({ item });
  } catch (error) {
    console.error('Fejl ved opdatering af tjekliste-punkt', error);
    return NextResponse.json({ error: 'Der opstod en fejl.' }, { status: 500 });
  }
}

/** DELETE /api/checklist/:id – slet punkt. Kun administratorer. */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: 'Ikke godkendt.' }, { status: 401 });
  }

  try {
    const deleted = await deleteChecklistItem(params.id);
    if (!deleted) {
      return NextResponse.json({ error: 'Ikke fundet.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Fejl ved sletning af tjekliste-punkt', error);
    return NextResponse.json({ error: 'Der opstod en fejl.' }, { status: 500 });
  }
}
