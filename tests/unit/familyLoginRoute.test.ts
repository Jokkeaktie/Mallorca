import { describe, expect, it, vi, beforeEach } from 'vitest';

const verifyFamilyPassword = vi.fn();

vi.mock('@/lib/auth/familyPassword', () => ({ verifyFamilyPassword }));
vi.mock('@/lib/auth/rateLimit', () => ({ isRateLimited: () => false }));

const { POST } = await import('@/app/api/family/login/route');
const { FAMILY_SESSION_COOKIE } = await import('@/lib/auth/familySession');

function makeRequest(password: unknown) {
  return new Request('http://localhost/api/family/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  }) as any;
}

describe('POST /api/family/login', () => {
  beforeEach(() => {
    verifyFamilyPassword.mockReset();
  });

  it('afviser forkert fælles adgangskode', async () => {
    verifyFamilyPassword.mockResolvedValue(false);
    const response = await POST(makeRequest('forkert-kode'));
    expect(response.status).toBe(401);
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('giver læseadgang (sætter session-cookie) ved korrekt adgangskode', async () => {
    verifyFamilyPassword.mockResolvedValue(true);
    const response = await POST(makeRequest('rigtig-kode'));
    expect(response.status).toBe(200);
    const setCookie = response.headers.get('set-cookie');
    expect(setCookie).toBeTruthy();
    expect(setCookie).toContain(FAMILY_SESSION_COOKIE);
    expect(setCookie).toContain('HttpOnly');
  });

  it('afviser tomt input', async () => {
    const response = await POST(makeRequest(''));
    expect(response.status).toBe(400);
  });
});
