import Link from 'next/link';
import { BugReportForm } from '@/components/bugReports/BugReportForm';

export const metadata = { title: 'Rapportér en fejl – Mallorca-kalenderen' };

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

      <BugReportForm />

      <Link href="/" className="text-sm text-accent underline underline-offset-2">
        ← Tilbage til kalenderen
      </Link>
    </main>
  );
}
