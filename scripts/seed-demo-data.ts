/**
 * Valgfrit script der opretter et par demo-kalenderposter, så funktionerne
 * kan vises frem i udviklingsmiljøet.
 *
 * Dette script opretter ALDRIG data af sig selv – det skal køres manuelt,
 * og kun mod et udviklings-/test-Supabase-projekt. Kør det ikke mod jeres
 * rigtige produktionsdatabase.
 *
 * Brug:
 *   ALLOW_SEED=true npm run seed
 */
import './env';
import { createClient } from '@supabase/supabase-js';
import { addDays, formatISO } from 'date-fns';

async function main() {
  if (process.env.ALLOW_SEED !== 'true') {
    console.error(
      'Seed er ikke kørt. Sæt miljøvariablen ALLOW_SEED=true for bevidst at bekræfte, ' +
        'at dette er et udviklings-/test-Supabase-projekt, og prøv igen:\n\n' +
        '  ALLOW_SEED=true npm run seed\n',
    );
    process.exit(1);
  }

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error('Manglende SUPABASE_URL eller SUPABASE_SERVICE_ROLE_KEY i .env.local');
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey);
  const today = new Date();
  const isoDate = (offsetDays: number) => formatISO(addDays(today, offsetDays), { representation: 'date' });

  const demoBookings = [
    {
      name: 'Joakim H.',
      status: 'request',
      color: '#3A6351',
      start_date: isoDate(14),
      end_date: isoDate(21),
      arrival_time: null,
      departure_time: null,
      internal_comment: 'Foretrækker uge med skoleferie.',
      created_by: 'demo-seed',
    },
    {
      name: 'Tania H.',
      status: 'approved',
      color: '#C1653A',
      start_date: isoDate(21),
      end_date: isoDate(28),
      arrival_time: '15:00',
      departure_time: '10:00',
      internal_comment: null,
      created_by: 'demo-seed',
    },
    {
      name: 'Peter og Lise',
      status: 'request',
      color: '#2F5D8A',
      start_date: isoDate(18),
      end_date: isoDate(25),
      arrival_time: null,
      departure_time: null,
      internal_comment: 'Overlapper med Joakims ønske – afventer beslutning.',
      created_by: 'demo-seed',
    },
  ];

  const { error } = await supabase.from('bookings').insert(demoBookings);
  if (error) {
    console.error('Kunne ikke oprette demo-data:', error.message);
    process.exit(1);
  }

  console.log(`Oprettede ${demoBookings.length} demo-kalenderposter.`);
}

main();
