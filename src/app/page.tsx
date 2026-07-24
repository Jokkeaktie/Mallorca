import Link from 'next/link';
import { CalendarShell } from '@/components/calendar/CalendarShell';

export default function FamilyCalendarPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-3 py-6 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-ink sm:text-2xl">Mallorca-kalenderen</h1>
        <p className="text-sm text-muted">Se hvornår lejligheden er ønsket eller booket.</p>
      </header>

      <CalendarShell />

      <footer className="mt-6 flex justify-center">
        <Link href="/admin/login" className="text-xs text-muted underline-offset-2 hover:underline">
          Administrator
        </Link>
      </footer>
    </main>
  );
}
