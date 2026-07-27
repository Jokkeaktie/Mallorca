const RESEND_API_URL = 'https://api.resend.com/emails';

interface BookingRequestNotification {
  name: string;
  startDate: string;
  endDate: string;
  flightNumber: string | null;
}

/**
 * Sender en e-mail til administratorerne, når familie/venner sender et
 * ønske. Notifikationer er helt valgfrie – hvis RESEND_API_KEY,
 * RESEND_FROM_EMAIL eller ADMIN_NOTIFICATION_EMAILS ikke er sat op, springes
 * afsendelsen bare stille over, og selve ønsket oprettes uden problemer.
 * Fejl ved afsendelse blokerer aldrig oprettelsen af ønsket – de logges kun.
 */
export async function sendBookingRequestNotification(
  input: BookingRequestNotification,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const recipientsRaw = process.env.ADMIN_NOTIFICATION_EMAILS;

  if (!apiKey || !from || !recipientsRaw) return;

  const to = recipientsRaw
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);
  if (to.length === 0) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const lines = [
    `${input.name} har ønsket en periode i lejligheden: ${input.startDate} – ${input.endDate}.`,
  ];
  if (input.flightNumber) lines.push(`Flynummer: ${input.flightNumber}`);
  if (appUrl) lines.push(`\nSe og godkend det i administratorområdet: ${appUrl}/admin`);

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        subject: `Nyt ønske om booking – ${input.name}`,
        text: lines.join('\n'),
      }),
    });
    if (!response.ok) {
      console.error('Kunne ikke sende notifikations-mail', await response.text().catch(() => ''));
    }
  } catch (error) {
    console.error('Fejl ved afsendelse af notifikations-mail', error);
  }
}
