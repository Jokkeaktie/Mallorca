/**
 * Gemmer tjekliste-afkrydsninger i browserens localStorage (kun på den
 * enkelte enhed – der er ingen gæstekonti, så dette er bevidst ikke en
 * server-side funktion). Afkrydsningerne udløber automatisk 1 dag efter
 * den aktuelle bookings slutdato, så de ikke bliver ved med at hænge ved
 * for den næste gæst, der bruger samme enhed.
 */

const STORAGE_KEY = 'mallorca-checklist-v1';

interface StoredChecklistState {
  expiresAt: string; // YYYY-MM-DD, inklusiv
  checkedIds: string[];
}

interface BookingLike {
  status: string;
  startDate: string;
  endDate: string;
}

function addDaysToIsoDate(isoDate: string, days: number): string {
  const parts = isoDate.split('-').map(Number);
  const date = new Date(parts[0]!, parts[1]! - 1, parts[2]!);
  date.setDate(date.getDate() + days);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Finder den booking, der dækker i dag (godkendt, og i dag ligger mellem
 * start- og slutdato), og returnerer dens slutdato + 1 dag. Findes ingen
 * aktuel booking, bruges i dag + 1 dag som en enkel, kortvarig standard.
 */
export function computeChecklistExpiry(bookings: BookingLike[], todayIso: string): string {
  const currentBookings = bookings.filter(
    (b) => b.status === 'approved' && b.startDate <= todayIso && todayIso <= b.endDate,
  );
  const latestEndDate = currentBookings.reduce<string | null>((latest, b) => {
    if (!latest || b.endDate > latest) return b.endDate;
    return latest;
  }, null);

  return addDaysToIsoDate(latestEndDate ?? todayIso, 1);
}

export function loadStoredChecked(todayIso: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as StoredChecklistState;
    if (!parsed.expiresAt || parsed.expiresAt < todayIso) {
      window.localStorage.removeItem(STORAGE_KEY);
      return new Set();
    }
    return new Set(parsed.checkedIds);
  } catch {
    return new Set();
  }
}

export function saveCheckedState(expiresAt: string, checkedIds: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: StoredChecklistState = { expiresAt, checkedIds: Array.from(checkedIds) };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // localStorage kan fejle i fx privat browsing-tilstand - ignorer stille,
    // afkrydsningerne virker stadig i den nuværende session.
  }
}
