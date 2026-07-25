import Link from 'next/link';
import { InfoView } from '@/components/info/InfoView';

export const metadata = { title: 'Praktisk info – Mallorca-kalenderen' };

export default function InfoPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-3 py-6 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-ink sm:text-2xl">Praktisk info</h1>
        <p className="text-sm text-muted">Godt at vide om lejligheden.</p>
      </header>

      <InfoView />

      <Link href="/" className="text-sm text-accent underline underline-offset-2">
        ← Tilbage til kalenderen
      </Link>
    </main>
  );
}
