import { AdminLoginForm } from '@/components/AdminLoginForm';

export const metadata = { title: 'Administrator-login – Mallorca-appen' };

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-16">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold text-ink">Administratorlogin</h1>
        <p className="max-w-sm text-sm text-muted">
          Kun til lejlighedens ejere. Familie og venner skal bruge den fælles
          adgangskode på forsiden.
        </p>
      </div>
      <AdminLoginForm />
    </main>
  );
}
