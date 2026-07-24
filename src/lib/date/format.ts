import { format, parseISO } from 'date-fns';
import { da } from 'date-fns/locale';

export function formatDanishDate(isoDate: string): string {
  return format(parseISO(isoDate), 'd. MMM yyyy', { locale: da });
}

export function formatDanishDateShort(isoDate: string): string {
  return format(parseISO(isoDate), 'd. MMM', { locale: da });
}

export function formatDanishWeekday(date: Date): string {
  return format(date, 'EEE', { locale: da });
}

export function formatDanishMonthYear(date: Date): string {
  return format(date, 'MMMM yyyy', { locale: da });
}

export function formatDanishDateRange(startIso: string, endIso: string): string {
  if (startIso === endIso) return formatDanishDate(startIso);
  return `${formatDanishDateShort(startIso)} – ${formatDanishDate(endIso)}`;
}
