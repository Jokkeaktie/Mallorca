import Link from 'next/link';
import { GalleryManager } from '@/components/admin/GalleryManager';

export const metadata = { title: 'Billeder – Mallorca-appen' };

export default function AdminGalleryPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-3 py-6 sm:px-6 sm:py-10">
      <Link href="/admin" className="text-sm text-accent underline underline-offset-2">
        ← Tilbage til administratorområdet
      </Link>

      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-ink sm:text-2xl">Billeder</h1>
        <p className="text-sm text-muted">
          Vises på familiens side under{' '}
          <Link href="/billeder" className="underline underline-offset-2">
            Billeder
          </Link>
          .
        </p>
      </header>

      <GalleryManager />

      <Link href="/admin" className="text-sm text-accent underline underline-offset-2">
        ← Tilbage til administratorområdet
      </Link>
    </main>
  );
}
