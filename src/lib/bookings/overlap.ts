interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

/**
 * Afgør om en booking dækker en given kalenderdag.
 *
 * Bevidst valg: afrejsedagen tæller stadig som "dækket" i den almindelige
 * kalendervisning (så gæsten kan se lejligheden er i brug den dag), men
 * det forhindrer IKKE at en anden booking må have samme dag som ankomst.
 * Det er derfor lovligt at én familie rejser og en anden ankommer samme
 * kalenderdag – det håndteres ved at begge bookinger vises den dag, med
 * præcise klokkeslæt synlige for administratorer.
 */
export function isDateWithinBooking(isoDate: string, range: DateRange): boolean {
  return isoDate >= range.startDate && isoDate <= range.endDate;
}

/** To datointervaller overlapper hvis de deler mindst én dag. */
export function rangesOverlap(a: DateRange, b: DateRange): boolean {
  return a.startDate <= b.endDate && b.startDate <= a.endDate;
}

/**
 * Grupperer bookinger pr. dag i et givent interval af ISO-datoer.
 * Bruges af kalendervisningerne til at vise alle overlappende
 * ønsker/bookinger for en dag samtidig.
 */
export function groupBookingsByDay<T extends DateRange>(
  bookings: T[],
  isoDates: string[],
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const isoDate of isoDates) {
    map.set(
      isoDate,
      bookings.filter((b) => isDateWithinBooking(isoDate, b)),
    );
  }
  return map;
}
