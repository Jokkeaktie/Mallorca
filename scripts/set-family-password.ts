/**
 * Sætter (eller nulstiller) familiens fælles adgangskode til kalenderen.
 *
 * Brug:
 *   npm run set-family-password -- "et-godt-fælles-kodeord"
 *
 * Kør dette scriptet én gang efter at have oprettet databaseskemaet
 * (supabase/schema.sql), så familievisningen har en adgangskode at
 * logge ind med. Administratorerne kan senere ændre adgangskoden fra
 * administratorpanelet i selve appen.
 */
import './env';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

async function main() {
  const [password] = process.argv.slice(2);

  if (!password || password.length < 8) {
    console.error('Brug: npm run set-family-password -- "mindst-8-tegn"');
    process.exit(1);
  }

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error('Manglende SUPABASE_URL eller SUPABASE_SERVICE_ROLE_KEY i .env.local');
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey);
  const hash = await bcrypt.hash(password, 10);

  const { error } = await supabase
    .from('app_settings')
    .upsert({ id: 1, family_password_hash: hash });

  if (error) {
    console.error('Kunne ikke gemme adgangskoden:', error.message);
    process.exit(1);
  }

  console.log('Familiens fælles adgangskode er sat.');
}

main();
