import Link from 'next/link';
import { ChecklistEditor } from '@/components/admin/ChecklistEditor';
import { FaqEditor } from '@/components/admin/FaqEditor';

export const metadata = { title: 'Praktisk info – Mallorca-kalenderen' };

export default function AdminInfoPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-ink">Praktisk info til familien</h1>
        <p className="text-sm text-muted">
          Vises på familiens side under{' '}
          <Link href="/info" className="underline underline-offset-2">
            Praktisk info
          </Link>
          .
        </p>
      </header>

      <FaqEditor />
      <ChecklistEditor />

      <Link href="/admin" className="text-sm text-accent underline underline-offset-2">
        ← Tilbage til administratorområdet
      </Link>
    </main>
  );
}
