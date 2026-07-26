/** Pulserende placeholder-blok, brugt til indlæsningstilstande i stedet for ren tekst. */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-line/70 ${className}`} />;
}
