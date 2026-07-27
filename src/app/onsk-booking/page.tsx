import Link from 'next/link';
import { BookingRequestForm } from '@/components/booking/BookingRequestForm';

export const metadata = { title: 'Ønsk booking – Mallorca-kalenderen' };

export default function OnskBookingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-3 py-6 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-ink sm:text-2xl">Ønsk booking</h1>
        <p className="text-sm text-muted">
          Ønsk en periode i lejligheden – Sven og Inger vender tilbage.
        </p>
      </header>

      <BookingRequestForm />

      <Link href="/" className="text-sm text-accent underline underline-offset-2">
        ← Tilbage til forsiden
      </Link>
    </main>
  );
}
