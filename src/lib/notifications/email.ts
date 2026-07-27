import nodemailer from 'nodemailer';

interface BookingRequestNotification {
  name: string;
  startDate: string;
  endDate: string;
  flightNumber: string | null;
}

/**
 * Sender en e-mail til administratorerne, når familie/venner sender et
 * ønske – via Gmail (med en app-adgangskode, ikke den almindelige
 * kontoadgangskode). Notifikationer er helt valgfrie – hvis GMAIL_USER,
 * GMAIL_APP_PASSWORD eller ADMIN_NOTIFICATION_EMAILS ikke er sat op,
 * springes afsendelsen bare stille over, og selve ønsket oprettes uden
 * problemer. Fejl ved afsendelse blokerer aldrig oprettelsen af ønsket –
 * de logges kun.
 */
export async function sendBookingRequestNotification(
  input: BookingRequestNotification,
): Promise<void> {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
  const recipientsRaw = process.env.ADMIN_NOTIFICATION_EMAILS;

  if (!gmailUser || !gmailAppPassword || !recipientsRaw) return;

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
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailAppPassword },
    });
    await transporter.sendMail({
      from: gmailUser,
      to,
      subject: `Nyt ønske om booking – ${input.name}`,
      text: lines.join('\n'),
    });
  } catch (error) {
    console.error('Fejl ved afsendelse af notifikations-mail', error);
  }
}
