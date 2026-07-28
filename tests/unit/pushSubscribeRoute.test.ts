import { describe, expect, it, vi, beforeEach } from 'vitest';

const requireAdmin = vi.fn();
const savePushSubscription = vi.fn();
const deletePushSubscription = vi.fn();

vi.mock('@/lib/auth/accessControl', () => ({ requireAdmin }));
vi.mock('@/lib/pushSubscriptions/repository', () => ({
  savePushSubscription,
  deletePushSubscription,
}));

const { POST, DELETE } = await import('@/app/api/push/subscribe/route');

function makeRequest(method: string, body: unknown) {
  return new Request('http://localhost/api/push/subscribe', {
    method,
    body: JSON.stringify(body),
  }) as any;
}

const validSubscription = {
  endpoint: 'https://push.example.com/abc123',
  keys: { p256dh: 'p256dh-value', auth: 'auth-value' },
};

describe('POST /api/push/subscribe', () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    savePushSubscription.mockReset();
  });

  it('afviser uden admin-adgang', async () => {
    requireAdmin.mockResolvedValue(null);

    const response = await POST(makeRequest('POST', validSubscription));

    expect(response.status).toBe(401);
    expect(savePushSubscription).not.toHaveBeenCalled();
  });

  it('gemmer et gyldigt abonnement for administratoren', async () => {
    requireAdmin.mockResolvedValue('admin-1');
    savePushSubscription.mockResolvedValue(undefined);

    const response = await POST(makeRequest('POST', validSubscription));

    expect(response.status).toBe(201);
    expect(savePushSubscription).toHaveBeenCalledWith({
      endpoint: validSubscription.endpoint,
      p256dh: 'p256dh-value',
      auth: 'auth-value',
    });
  });

  it('afviser ugyldigt input', async () => {
    requireAdmin.mockResolvedValue('admin-1');

    const response = await POST(makeRequest('POST', { endpoint: 'ikke-en-url' }));

    expect(response.status).toBe(400);
    expect(savePushSubscription).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/push/subscribe', () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    deletePushSubscription.mockReset();
  });

  it('afviser uden admin-adgang', async () => {
    requireAdmin.mockResolvedValue(null);

    const response = await DELETE(makeRequest('DELETE', { endpoint: validSubscription.endpoint }));

    expect(response.status).toBe(401);
    expect(deletePushSubscription).not.toHaveBeenCalled();
  });

  it('sletter abonnementet for administratoren', async () => {
    requireAdmin.mockResolvedValue('admin-1');
    deletePushSubscription.mockResolvedValue(undefined);

    const response = await DELETE(makeRequest('DELETE', { endpoint: validSubscription.endpoint }));

    expect(response.status).toBe(200);
    expect(deletePushSubscription).toHaveBeenCalledWith(validSubscription.endpoint);
  });
});
