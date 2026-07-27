import Link from 'next/link';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { InstallPrompt } from '@/components/InstallPrompt';

export const metadata = { title: 'Administrator – Mallorca-appen' };

export default function AdminPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-3 py-6 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink sm:text-2xl">Administratorområde</h1>
          <p className="text-sm text-muted">Opret, redigér og slet kalenderposter.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/vejledning"
            className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-canvas"
          >
            Kort vejledning
          </Link>
          <Link
            href="/admin/info"
            className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-canvas"
          >
            Praktisk info
          </Link>
          <Link
            href="/admin/fejlrapporter"
            className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-canvas"
          >
            Fejlrapporter
          </Link>
        </div>
      </header>

      <InstallPrompt />

      <AdminDashboard />
    </main>
  );
}
