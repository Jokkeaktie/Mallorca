/**
 * Signeret sessions-cookie til familiens fælles adgangskode.
 *
 * Vi bruger Web Crypto (SubtleCrypto), fordi det virker uændret i både
 * Next.js Middleware (Edge-runtime) og almindelige route handlers
 * (Node-runtime) – i modsætning til Node's "crypto"-modul, som ikke er
 * fuldt understøttet i Edge-runtime.
 *
 * Cookien indeholder ingen hemmeligheder, kun et udløbstidspunkt og en
 * signatur. Uden den rigtige FAMILY_SESSION_SECRET kan man ikke forfalske
 * en gyldig cookie.
 */

export const FAMILY_SESSION_COOKIE = 'family_session';
const FAMILY_SESSION_TTL_SECONDS = 60 * 60 * 24 * 180; // 180 dage

function getSecret(): string {
  const secret = process.env.FAMILY_SESSION_SECRET;
  if (!secret) {
    throw new Error('Manglende FAMILY_SESSION_SECRET miljøvariabel.');
  }
  return secret;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const withPadding = padded + '='.repeat((4 - (padded.length % 4)) % 4);
  const binary = atob(withPadding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  const keyData = new TextEncoder().encode(secret);
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

async function sign(payload: string): Promise<string> {
  const key = await importHmacKey(getSecret());
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return toBase64Url(new Uint8Array(signature));
}

export async function createFamilySessionToken(): Promise<{
  token: string;
  maxAgeSeconds: number;
}> {
  const expiresAt = Date.now() + FAMILY_SESSION_TTL_SECONDS * 1000;
  const payload = toBase64Url(new TextEncoder().encode(JSON.stringify({ exp: expiresAt })));
  const signature = await sign(payload);
  return { token: `${payload}.${signature}`, maxAgeSeconds: FAMILY_SESSION_TTL_SECONDS };
}

export async function verifyFamilySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, signature] = parts as [string, string];

  try {
    const expectedSignature = await sign(payload);
    if (!timingSafeEqual(expectedSignature, signature)) return false;

    const decoded = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as {
      exp: number;
    };
    return typeof decoded.exp === 'number' && decoded.exp > Date.now();
  } catch {
    return false;
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
