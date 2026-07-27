import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { sendBookingRequestNotification } from '@/lib/notifications/email';

const originalEnv = { ...process.env };

describe('sendBookingRequestNotification', () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    global.fetch = vi.fn(async () => new Response('{}', { status: 200 })) as unknown as typeof fetch;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('springer stille over uden konfiguration (ingen fejl, intet kald)', async () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
    delete process.env.ADMIN_NOTIFICATION_EMAILS;

    await sendBookingRequestNotification({
      name: 'Joakim H.',
      startDate: '2026-08-10',
      endDate: '2026-08-17',
      flightNumber: null,
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('sender en mail via Resend når fuldt konfigureret', async () => {
    process.env.RESEND_API_KEY = 'test-key';
    process.env.RESEND_FROM_EMAIL = 'Mallorca-appen <onsker@example.dk>';
    process.env.ADMIN_NOTIFICATION_EMAILS = 'sven@example.dk, inger@example.dk';

    await sendBookingRequestNotification({
      name: 'Joakim H.',
      startDate: '2026-08-10',
      endDate: '2026-08-17',
      flightNumber: 'SK1533',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer test-key' }),
      }),
    );
    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
    const body = JSON.parse(init.body as string);
    expect(body.to).toEqual(['sven@example.dk', 'inger@example.dk']);
    expect(body.from).toBe('Mallorca-appen <onsker@example.dk>');
    expect(body.text).toContain('SK1533');
  });

  it('kaster ikke en fejl videre, hvis Resend-kaldet fejler', async () => {
    process.env.RESEND_API_KEY = 'test-key';
    process.env.RESEND_FROM_EMAIL = 'Mallorca-appen <onsker@example.dk>';
    process.env.ADMIN_NOTIFICATION_EMAILS = 'sven@example.dk';
    global.fetch = vi.fn(async () => {
      throw new Error('netværksfejl');
    }) as unknown as typeof fetch;

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
