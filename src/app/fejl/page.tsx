import Link from 'next/link';
import { BugReportForm } from '@/components/bugReports/BugReportForm';

export const metadata = { title: 'Rapportér en fejl – Mallorca-appen' };

export default function BugReportPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-3 py-6 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-ink sm:text-2xl">Rapportér en fejl</h1>
        <p className="text-sm text-muted">
          Opdaget noget, der er i stykker eller mangler? Fortæl os om det her — det går kun til
          administratorerne.
        </p>
      </header>

      <div className="flex items-start gap-3 rounded-xl2 border border-line bg-white p-3 text-sm text-ink">
        <span aria-hidden="true" className="mt-0.5">
          ⚠️
        </span>
        <p>
          Denne side er kun til <strong>mindre fejl og mangler</strong>, som ikke haster — vi
          kigger på dem, når vi har tid. Ved <strong>akutte eller alvorlige problemer</strong>
          (fx vandskade, ingen strøm, eller andet der skal løses med det samme), skal du i
          stedet kontakte <strong>Sven eller Inger</strong> direkte. Hvis vi ikke kan kontaktes,
          så ring til <strong>Dawn Taylor</strong>.
        </p>
      </div>

      <BugReportForm />

      <Link href="/" className="text-sm text-accent underline underline-offset-2">
        ← Tilbage til forsiden
      </Link>
    </main>
  );
}
