import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { InstallPrompt } from '@/components/InstallPrompt';

export const metadata = { title: 'Administrator – Mallorca-appen' };

export default function AdminPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-3 py-6 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-ink sm:text-2xl">Administratorområde</h1>
        <p className="text-sm text-muted">Opret, redigér og slet kalenderposter.</p>
      </header>

      <InstallPrompt />

      <AdminDashboard />
    </main>
  );
}
