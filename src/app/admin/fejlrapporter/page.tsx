import Link from 'next/link';
import { AdminBugReportsSection } from '@/components/admin/AdminBugReportsSection';

export const metadata = { title: 'Fejlrapporter – Mallorca-kalenderen' };

export default function AdminBugReportsPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10">
      <Link href="/admin" className="text-sm text-accent underline underline-offset-2">
        ← Tilbage til administratorområdet
      </Link>

      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-ink">Fejlrapporter fra familie/venner</h1>
        <p className="text-sm text-muted">
          Kun synlige for administratorer. Indsendt fra{' '}
          <Link href="/fejl" className="underline underline-offset-2">
            /fejl
          </Link>
          .
        </p>
      </header>

      <AdminBugReportsSection />

      <Link href="/admin" className="text-sm text-accent underline underline-offset-2">
        ← Tilbage til administratorområdet
      </Link>
    </main>
  );
}
