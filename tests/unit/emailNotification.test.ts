import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

const sendMail = vi.fn();
const createTransport = vi.fn(() => ({ sendMail }));

vi.mock('nodemailer', () => ({ default: { createTransport } }));

const { sendBookingRequestNotification } = await import('@/lib/notifications/email');

const originalEnv = { ...process.env };

describe('sendBookingRequestNotification', () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    createTransport.mockClear();
    sendMail.mockReset();
    sendMail.mockResolvedValue({ messageId: 'test' });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('springer stille over uden konfiguration (ingen fejl, intet kald)', async () => {
    delete process.env.GMAIL_USER;
    delete process.env.GMAIL_APP_PASSWORD;
    delete process.env.ADMIN_NOTIFICATION_EMAILS;

    await sendBookingRequestNotification({
      name: 'Joakim H.',
      startDate: '2026-08-10',
      endDate: '2026-08-17',
      flightNumber: null,
    });

    expect(createTransport).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('sender en mail via Gmail når fuldt konfigureret', async () => {
    process.env.GMAIL_USER = 'ingerriber@gmail.com';
    process.env.GMAIL_APP_PASSWORD = 'test-app-adgangskode';
    process.env.ADMIN_NOTIFICATION_EMAILS = 'sven@svenriber.dk, ingerriber@gmail.com';

    await sendBookingRequestNotification({
      name: 'Joakim H.',
      startDate: '2026-08-10',
      endDate: '2026-08-17',
      flightNumber: 'SK1533',
    });

    expect(createTransport).toHaveBeenCalledWith({
      service: 'gmail',
      auth: { user: 'ingerriber@gmail.com', pass: 'test-app-adgangskode' },
    });
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'ingerriber@gmail.com',
        to: ['sven@svenriber.dk', 'ingerriber@gmail.com'],
        subject: 'Nyt ønske om booking – Joakim H.',
      }),
    );
    const [call] = sendMail.mock.calls[0]!;
    expect(call.text).toContain('SK1533');
  });

  it('kaster ikke en fejl videre, hvis afsendelsen fejler', async () => {
    process.env.GMAIL_USER = 'ingerriber@gmail.com';
    process.env.GMAIL_APP_PASSWORD = 'test-app-adgangskode';
    process.env.ADMIN_NOTIFICATION_EMAILS = 'sven@svenriber.dk';
    sendMail.mockRejectedValue(new Error('netværksfejl'));

    await expect(
      sendBookingRequestNotification({
        name: 'Joakim H.',
        startDate: '2026-08-10',
        endDate: '2026-08-17',
        flightNumber: null,
      }),
    ).resolves.toBeUndefined();
  });
});
