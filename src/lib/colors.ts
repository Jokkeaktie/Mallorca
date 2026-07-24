/** Foreslåede farver til hurtigt valg i administrator-formularen. */
export const SUGGESTED_COLORS: { label: string; value: string }[] = [
  { label: 'Skovgrøn', value: '#3A6351' },
  { label: 'Terrakotta', value: '#C1653A' },
  { label: 'Havblå', value: '#2F5D8A' },
  { label: 'Aubergine', value: '#6B3E63' },
  { label: 'Okker', value: '#B08A2E' },
  { label: 'Bordeaux', value: '#8A2E3B' },
  { label: 'Grafit', value: '#4A4A48' },
  { label: 'Petroleum', value: '#215B5B' },
];

export function isValidHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

/**
 * Vælger sort eller hvid tekstfarve ud fra baggrundsfarvens lysstyrke,
 * så navnet altid er læsbart oven på den valgte farve.
 */
export function getReadableTextColor(hexColor: string): '#000000' | '#ffffff' {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#000000' : '#ffffff';
}
