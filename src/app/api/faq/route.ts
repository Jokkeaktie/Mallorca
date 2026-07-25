import { NextResponse, type NextRequest } from 'next/server';
import { hasFamilyOrAdminAccess, requireAdmin } from '@/lib/auth/accessControl';
import { createFaqItem, listFaqItems } from '@/lib/content/faq';
import { faqItemSchema } from '@/lib/validation/content';

/** GET /api/faq – praktisk FAQ. Familie/venner og administratorer. */
export async function GET() {
  const isAllowed = await hasFamilyOrAdminAccess();
  if (!isAllowed) {
    return NextResponse.json({ error: 'Ikke godkendt.' }, { status: 401 });
  }

  try {
    const items = await listFaqItems();
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Fejl ved hentning af FAQ', error);
    return NextResponse.json({ error: 'Der opstod en fejl.' }, { status: 500 });
  }
}

/** POST /api/faq – opret nyt spørgsmål/svar. Kun administratorer. */
export async function POST(request: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: 'Ikke godkendt.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = faqItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ugyldigt input.' }, { status: 400 });
  }

  try {
    const item = await createFaqItem(parsed.data);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error('Fejl ved oprettelse af FAQ-punkt', error);
    return NextResponse.json({ error: 'Der opstod en fejl.' }, { status: 500 });
  }
}
