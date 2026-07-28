import Link from 'next/link';
import { GalleryView } from '@/components/gallery/GalleryView';

export const metadata = { title: 'Billeder – Mallorca-appen' };

export default function GalleryPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-3 py-6 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-ink sm:text-2xl">Billeder</h1>
        <p className="text-sm text-muted">Indtryk fra lejligheden og omgivelserne.</p>
      </header>

      <GalleryView />

      <Link href="/" className="text-sm text-accent underline underline-offset-2">
        ← Tilbage til forsiden
      </Link>
    </main>
  );
}
