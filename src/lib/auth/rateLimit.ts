/**
 * Meget simpel, best-effort rate limiting i hukommelse.
 *
 * Vercel-serverless-funktioner er ikke garanteret at genbruge samme
 * instans mellem kald, så dette er IKKE en vandtæt beskyttelse mod
 * brute force – men det bremser gentagne forsøg inden for samme varme
 * instans uden at kræve en ekstra betalt tjeneste (fx Redis). Da det kun
 * beskytter login-forsøg på den fælles familie-adgangskode (ikke
 * administratorlogin, som Supabase Auth selv rate-limiter), vurderes
 * risikoen acceptabel for denne brugssituation.
 */

const attempts = new Map<string, { count: number; windowStart: number }>();
const WINDOW_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 10;

export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    attempts.set(key, { count: 1, windowStart: now });
    return false;
  }

  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}
