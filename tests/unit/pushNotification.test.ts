import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

const setVapidDetails = vi.fn();
const sendNotification = vi.fn();
const listPushSubscriptions = vi.fn();
const deletePushSubscription = vi.fn();

vi.mock('web-push', () => ({
  default: { setVapidDetails, sendNotification },
}));
vi.mock('@/lib/pushSubscriptions/repository', () => ({
  listPushSubscriptions,
  deletePushSubscription,
}));

const { sendPushToAdmins } = await import('@/lib/notifications/push');

const originalEnv = { ...process.env };

const subA = { endpoint: 'https://push.example/a', p256dh: 'p256dh-a', auth: 'auth-a' };
const subB = { endpoint: 'https://push.example/b', p256dh: 'p256dh-b', auth: 'auth-b' };

describe('sendPushToAdmins', () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    setVapidDetails.mockClear();
    sendNotification.mockReset();
    listPushSubscriptions.mockReset();
    deletePushSubscription.mockReset();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('springer stille over uden VAPID-konfiguration', async () => {
    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;
    delete process.env.VAPID_SUBJECT;

    await sendPushToAdmins({ title: 'Titel', body: 'Besked', url: '/admin' });

    expect(listPushSubscriptions).not.toHaveBeenCalled();
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it('sender til alle gemte abonnementer når konfigureret', async () => {
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'public-key';
    process.env.VAPID_PRIVATE_KEY = 'private-key';
    process.env.VAPID_SUBJECT = 'mailto:test@example.dk';
    listPushSubscriptions.mockResolvedValue([subA, subB]);
    sendNotification.mockResolvedValue(undefined);

    await sendPushToAdmins({ title: 'Nyt ønske', body: 'Peter og Lise', url: '/admin' });

    expect(setVapidDetails).toHaveBeenCalledWith('mailto:test@example.dk', 'public-key', 'private-key');
    expect(sendNotification).toHaveBeenCalledTimes(2);
    expect(sendNotification).toHaveBeenCalledWith(
      { endpoint: subA.endpoint, keys: { p256dh: subA.p256dh, auth: subA.auth } },
      expect.stringContaining('Nyt ønske'),
    );
  });

  it('afkorter en lang besked', async () => {
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'public-key';
    process.env.VAPID_PRIVATE_KEY = 'private-key';
    process.env.VAPID_SUBJECT = 'mailto:test@example.dk';
    listPushSubscriptions.mockResolvedValue([subA]);
    sendNotification.mockResolvedValue(undefined);

    const longBody = 'x'.repeat(300);
    await sendPushToAdmins({ title: 'Titel', body: longBody, url: '/admin' });

    const [, message] = sendNotification.mock.calls[0]!;
    const payload = JSON.parse(message);
    expect(payload.body.length).toBeLessThan(300);
    expect(payload.body.endsWith('…')).toBe(true);
  });

  it('rydder op i udløbne abonnementer (410 Gone)', async () => {
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'public-key';
    process.env.VAPID_PRIVATE_KEY = 'private-key';
    process.env.VAPID_SUBJECT = 'mailto:test@example.dk';
    listPushSubscriptions.mockResolvedValue([subA]);
    const goneError = Object.assign(new Error('Gone'), { statusCode: 410 });
    sendNotification.mockRejectedValue(goneError);
    deletePushSubscription.mockResolvedValue(undefined);

    await sendPushToAdmins({ title: 'Titel', body: 'Besked', url: '/admin' });

    expect(deletePushSubscription).toHaveBeenCalledWith(subA.endpoint);
  });

  it('kaster ikke fejl videre ved anden fejl end 404/410', async () => {
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'public-key';
    process.env.VAPID_PRIVATE_KEY = 'private-key';
    process.env.VAPID_SUBJECT = 'mailto:test@example.dk';
    listPushSubscriptions.mockResolvedValue([subA]);
    sendNotification.mockRejectedValue(new Error('netværksfejl'));

    await expect(
      sendPushToAdmins({ title: 'Titel', body: 'Besked', url: '/admin' }),
    ).resolves.toBeUndefined();
    expect(deletePushSubscription).not.toHaveBeenCalled();
  });
});
