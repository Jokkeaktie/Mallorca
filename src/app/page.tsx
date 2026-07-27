import Link from 'next/link';
import { BookingRequestForm } from '@/components/booking/BookingRequestForm';
import { CurrentStayKeyPhoto } from '@/components/booking/CurrentStayKeyPhoto';
import { InstallPrompt } from '@/components/InstallPrompt';

export default function FamilyCalendarPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-3 py-6 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-ink sm:text-2xl">Mallorca-kalenderen</h1>
            <p className="text-sm text-muted">
              Ønsk en periode i lejligheden – Sven og Inger vender tilbage.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link
              href="/info"
              className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink hover:bg-canvas"
            >
              Praktisk info
            </Link>
            <Link
              href="/fejl"
              className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink hover:bg-canvas"
            >
              Rapportér fejl
            </Link>
          </div>
        </div>
      </header>

      <InstallPrompt />

      <CurrentStayKeyPhoto />

      <BookingRequestForm />

      <footer className="mt-6 flex justify-center">
        <Link href="/admin/login" className="text-xs text-muted underline-offset-2 hover:underline">
          Administrator
        </Link>
      </footer>
    </main>
  );
}
