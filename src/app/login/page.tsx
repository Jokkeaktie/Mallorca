import { Suspense } from 'react';
import { FamilyLoginForm } from '@/components/FamilyLoginForm';

export const metadata = { title: 'Log ind – Mallorca-appen' };

export default function FamilyLoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-16">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold text-ink">Mallorca-appen</h1>
        <p className="max-w-sm text-sm text-muted">
          Indtast familiens fælles adgangskode for at se, hvornår lejligheden
          er ønsket og booket.
        </p>
      </div>
      <Suspense>
        <FamilyLoginForm />
      </Suspense>
    </main>
  );
}
