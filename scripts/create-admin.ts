/**
 * Opretter en administrator (en af lejlighedens ejere) i Supabase Auth.
 *
 * Brug:
 *   npm run create-admin -- forælder1@eksempel.dk "et-sikkert-kodeord"
 *
 * Kør scriptet én gang pr. administrator (typisk to gange – én pr. forælder).
 * Der findes ingen offentlig tilmeldingsside i appen, så dette er den eneste
 * måde at oprette administratorer på.
 */
import './env';
import { createClient } from '@supabase/supabase-js';

async function main() {
  const [email, password] = process.argv.slice(2);

  if (!email || !password) {
    console.error('Brug: npm run create-admin -- <email> <adgangskode>');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Adgangskoden skal være mindst 8 tegn.');
    process.exit(1);
  }

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error('Manglende SUPABASE_URL eller SUPABASE_SERVICE_ROLE_KEY i .env.local');
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey);

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    console.error('Kunne ikke oprette administrator:', error.message);
    process.exit(1);
  }

  console.log(`Administrator oprettet: ${data.user?.email} (id: ${data.user?.id})`);
}

main();
