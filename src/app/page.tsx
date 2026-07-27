import Image from 'next/image';
import Link from 'next/link';
import { KeyLocationPhoto } from '@/components/booking/KeyLocationPhoto';
import { InstallPrompt } from '@/components/InstallPrompt';

const NAV_ITEMS = [
  {
    href: '/onsk-booking',
    icon: '📅',
    title: 'Ønsk booking',
    description: 'Bed om en periode i lejligheden',
  },
  {
    href: '/info',
    icon: '📋',
    title: 'Praktisk info',
    description: 'Tjekliste, FAQ og info om lejligheden',
  },
  {
    href: '/fejl',
    icon: '🛠️',
    title: 'Rapportér fejl',
    description: 'Er noget i stykker eller mangler?',
  },
] as const;

export default function FamilyLandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col pb-6 sm:pb-10">
      <div className="relative h-48 w-full overflow-hidden sm:h-64 sm:rounded-b-xl2">
        <Image
          src="/images/hero-mallorca.jpg"
          alt="Udsigt over en vig på Mallorca"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 768px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 px-4 py-4 sm:px-6">
          <h1 className="text-2xl font-semibold text-white drop-shadow-sm sm:text-3xl">
            Mallorca-appen
          </h1>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-3 pt-6 sm:px-6">
        <p className="text-sm text-muted">
          Velkommen! Her kan familie og venner ønske en periode i lejligheden, se praktisk
          info om opholdet, og rapportere hvis noget er i stykker. Sven og Inger holder styr
          på kalenderen og vender tilbage på jeres ønsker.
        </p>

        <InstallPrompt />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1.5 rounded-xl2 border border-line bg-white p-5 text-center hover:bg-canvas"
            >
              <span className="text-3xl" aria-hidden="true">
                {item.icon}
              </span>
              <span className="font-medium text-ink">{item.title}</span>
              <span className="text-xs text-muted">{item.description}</span>
            </Link>
          ))}
        </div>

        <KeyLocationPhoto />

        <footer className="mt-6 flex justify-center">
          <Link href="/admin/login" className="text-xs text-muted underline-offset-2 hover:underline">
            Administrator
          </Link>
        </footer>
      </div>
    </main>
  );
}
