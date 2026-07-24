import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase-klient med service role-nøglen.
 *
 * ADVARSEL: Denne klient omgår Row Level Security. Den må ALDRIG
 * importeres i klientkode (komponenter markeret "use client") og må
 * kun bruges inde i API route handlers / server components, som selv
 * står for al adgangskontrol og feltfiltrering.
 */
let cached: SupabaseClient | null = null;

export function getServiceSupabaseClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Manglende SUPABASE_URL eller SUPABASE_SERVICE_ROLE_KEY miljøvariabel.',
    );
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return cached;
}
