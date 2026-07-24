import { cookies } from 'next/headers';
import { getAdminUser } from '@/lib/supabase/serverAuthClient';
import { FAMILY_SESSION_COOKIE, verifyFamilySessionToken } from '@/lib/auth/familySession';

/** Returnerer den loggede ind administrators id, eller null hvis ikke logget ind. */
export async function requireAdmin(): Promise<string | null> {
  const user = await getAdminUser();
  return user?.id ?? null;
}

/**
 * Tjekker om anmoderen enten er en logget ind administrator, eller har en
 * gyldig cookie for familiens fælles adgangskode. Bruges af de ruter der
 * leverer den offentlige (begrænsede) kalenderdata.
 */
export async function hasFamilyOrAdminAccess(): Promise<boolean> {
  const adminId = await requireAdmin();
  if (adminId) return true;

  const cookieStore = cookies();
  const token = cookieStore.get(FAMILY_SESSION_COOKIE)?.value;
  return verifyFamilySessionToken(token);
}
