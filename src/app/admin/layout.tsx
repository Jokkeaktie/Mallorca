import Link from 'next/link';

/**
 * Fast bjælke øverst på ALLE administratorsider (inkl. login), så det altid
 * er tydeligt at man er i administratorområdet og ikke på familiens side –
 * en anden farve end resten af appen, plus en genvej tilbage til forsiden.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="sticky top-0 z-40 flex items-center justify-between gap-3 bg-ink px-4 py-2.5 text-white">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
          <span aria-hidden="true">🔒</span>
          Administratorområde
        </span>
        <Link
          href="/"
          className="rounded-full border border-white/40 px-3 py-1 text-xs font-medium hover:bg-white/10"
        >
          ← Til familiesiden
        </Link>
      </div>
      {children}
    </div>
  );
}
