import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth/accessControl';
import { deletePushSubscription, savePushSubscription } from '@/lib/pushSubscriptions/repository';
import { pushSubscriptionSchema, unsubscribeSchema } from '@/lib/validation/pushSubscription';

/**
 * POST /api/push/subscribe – gemmer et push-abonnement. Kun administratorer
 * kan slå push-notifikationer til - familie/venner får dem aldrig.
 * Forventer den JSON, browserens PushSubscription.toJSON() returnerer.
 */
export async function POST(request: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: 'Ikke godkendt.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = pushSubscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ugyldigt input.' }, { status: 400 });
  }

  try {
    await savePushSubscription({
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error('Fejl ved oprettelse af push-abonnement', error);
    return NextResponse.json({ error: 'Der opstod en fejl.' }, { status: 500 });
  }
}

/** DELETE /api/push/subscribe – fjerner et push-abonnement (slår notifikationer fra). */
export async function DELETE(request: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: 'Ikke godkendt.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = unsubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ugyldigt input.' }, { status: 400 });
  }

  try {
    await deletePushSubscription(parsed.data.endpoint);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Fejl ved sletning af push-abonnement', error);
    return NextResponse.json({ error: 'Der opstod en fejl.' }, { status: 500 });
  }
}
