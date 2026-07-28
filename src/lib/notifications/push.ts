import webpush from 'web-push';
import {
  deletePushSubscription,
  listPushSubscriptions,
  type PushSubscriptionRecord,
} from '@/lib/pushSubscriptions/repository';

interface PushNotificationPayload {
  title: string;
  body: string;
  /** Sti appen skal åbne/fokusere ved tryk på notifikationen, fx "/admin". */
  url: string;
}

function isConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY &&
    process.env.VAPID_SUBJECT
  );
}

const MAX_BODY_LENGTH = 150;

function truncate(text: string): string {
  return text.length > MAX_BODY_LENGTH ? `${text.slice(0, MAX_BODY_LENGTH - 1)}…` : text;
}

/**
 * Sender en push-notifikation til alle administratorer, der har slået det
 * til (se /api/push/subscribe). Helt valgfrit – uden VAPID-nøglerne sat op
 * springes afsendelsen bare stille over. Udløbne/ugyldige abonnementer
 * (fx en telefon hvor appen er afinstalleret) fjernes automatisk.
 */
export async function sendPushToAdmins(payload: PushNotificationPayload): Promise<void> {
  if (!isConfigured()) return;

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );

  let subscriptions: PushSubscriptionRecord[];
  try {
    subscriptions = await listPushSubscriptions();
  } catch (error) {
    console.error('Fejl ved hentning af push-abonnementer', error);
    return;
  }

  const message = JSON.stringify({ ...payload, body: truncate(payload.body) });

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          message,
        );
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          // Abonnementet findes ikke længere (fx appen afinstalleret) - ryd op.
          await deletePushSubscription(sub.endpoint).catch(() => {});
        } else {
          console.error('Fejl ved afsendelse af push-notifikation', error);
        }
      }
    }),
  );
}
