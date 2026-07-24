import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

export const APARTMENT_TIME_ZONE = 'Europe/Madrid';

/** Dags dato (YYYY-MM-DD) i lejlighedens tidszone, Europe/Madrid. */
export function getTodayInApartmentTimeZone(): string {
  return formatInTimeZone(new Date(), APARTMENT_TIME_ZONE, 'yyyy-MM-dd');
}

/** Returnerer et Date-objekt der repræsenterer "nu" i Europe/Madrid, til brug i kalenderberegninger. */
export function nowInApartmentTimeZone(): Date {
  return toZonedTime(new Date(), APARTMENT_TIME_ZONE);
}
