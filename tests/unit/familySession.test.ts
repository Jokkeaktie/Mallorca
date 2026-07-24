import { describe, expect, it } from 'vitest';
import { createFamilySessionToken, verifyFamilySessionToken } from '@/lib/auth/familySession';

describe('familySession', () => {
  it('et nyoprettet token er gyldigt', async () => {
    const { token } = await createFamilySessionToken();
    expect(await verifyFamilySessionToken(token)).toBe(true);
  });

  it('afviser manglende token', async () => {
    expect(await verifyFamilySessionToken(undefined)).toBe(false);
    expect(await verifyFamilySessionToken(null)).toBe(false);
    expect(await verifyFamilySessionToken('')).toBe(false);
  });

  it('afviser et token med forkert signatur (forfalsket)', async () => {
    const { token } = await createFamilySessionToken();
    const [payload] = token.split('.');
    const tampered = `${payload}.forkert-signatur`;
    expect(await verifyFamilySessionToken(tampered)).toBe(false);
  });

  it('afviser et token med manipuleret payload', async () => {
    const { token } = await createFamilySessionToken();
    const [, signature] = token.split('.');
    const fakePayload = Buffer.from(JSON.stringify({ exp: Date.now() + 1_000_000 })).toString(
      'base64url',
    );
    const tampered = `${fakePayload}.${signature}`;
    expect(await verifyFamilySessionToken(tampered)).toBe(false);
  });

  it('afviser et udløbet token', async () => {
    // Simuler et udløbet token ved at signere en payload med exp i fortiden.
    const past = { exp: Date.now() - 1000 };
    const payload = Buffer.from(JSON.stringify(past)).toString('base64url');
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(process.env.FAMILY_SESSION_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sigBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
    const signature = Buffer.from(new Uint8Array(sigBuffer)).toString('base64url');
    const expiredToken = `${payload}.${signature}`;

    expect(await verifyFamilySessionToken(expiredToken)).toBe(false);
  });
});
