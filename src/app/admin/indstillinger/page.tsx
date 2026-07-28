import Link from 'next/link';
import { PushNotificationToggle } from '@/components/admin/PushNotificationToggle';
import { PasswordForm } from '@/components/admin/PasswordForm';
import { KeyLocationPhoto } from '@/components/booking/KeyLocationPhoto';

export const metadata = { title: 'Indstillinger – Mallorca-appen' };

export default function AdminSettingsPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-3 py-6 sm:px-6 sm:py-10">
      <Link href="/admin" className="text-sm text-accent underline underline-offset-2">
        ← Tilbage til administratorområdet
      </Link>

      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-ink sm:text-2xl">Indstillinger</h1>
      </header>

      <PushNotificationToggle />

      <div className="rounded-xl2 border border-line bg-white p-4">
        <h2 className="mb-3 text-base font-semibold text-ink">Familiens fælles adgangskode</h2>
        <PasswordForm />
      </div>

      <KeyLocationPhoto isAdmin />

      <Link href="/admin" className="text-sm text-accent underline underline-offset-2">
        ← Tilbage til administratorområdet
      </Link>
    </main>
  );
}
