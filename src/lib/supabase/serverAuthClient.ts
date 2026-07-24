import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Server-side Supabase-klient der læser/skriver Supabase Auth-sessionen
 * via cookies. Bruges til at slå op, om der er en logget ind administrator.
 * Bruger anon-nøglen (samme som browser-klienten) – det er auth-sessionen
 * (cookien), ikke nøglen, der giver adgangen.
 */
export function getServerAuthClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Ignoreres når kaldt fra en Server Component uden write-adgang.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // Ignoreres når kaldt fra en Server Component uden write-adgang.
          }
        },
      },
    },
  );
}

/** Returnerer den loggede ind administrators bruger, eller null. */
export async function getAdminUser() {
  const supabase = getServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
