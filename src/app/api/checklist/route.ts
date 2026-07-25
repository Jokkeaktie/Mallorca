import { NextResponse, type NextRequest } from 'next/server';
import { hasFamilyOrAdminAccess, requireAdmin } from '@/lib/auth/accessControl';
import { createChecklistItem, listChecklistItems } from '@/lib/content/checklist';
import { checklistItemSchema } from '@/lib/validation/content';

/** GET /api/checklist – tjekliste ved afrejse. Familie/venner og administratorer. */
export async function GET() {
  const isAllowed = await hasFamilyOrAdminAccess();
  if (!isAllowed) {
    return NextResponse.json({ error: 'Ikke godkendt.' }, { status: 401 });
  }

  try {
    const items = await listChecklistItems();
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Fejl ved hentning af tjekliste', error);
    return NextResponse.json({ error: 'Der opstod en fejl.' }, { status: 500 });
  }
}

/** POST /api/checklist – opret nyt punkt. Kun administratorer. */
export async function POST(request: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: 'Ikke godkendt.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = checklistItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ugyldigt input.' }, { status: 400 });
  }

  try {
    const item = await createChecklistItem(parsed.data);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error('Fejl ved oprettelse af tjekliste-punkt', error);
    return NextResponse.json({ error: 'Der opstod en fejl.' }, { status: 500 });
  }
}
