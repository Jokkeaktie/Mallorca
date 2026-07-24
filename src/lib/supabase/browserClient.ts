import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser-klient der udelukkende bruges til administrator-login/-logout
 * via Supabase Auth. Bruger den offentlige "anon"-nøgle, som er beregnet
 * til at være tilgængelig i frontend. Al adgang til bookingdata sker
 * IKKE gennem denne klient, men gennem vores egne API-ruter.
 */
export function getBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
