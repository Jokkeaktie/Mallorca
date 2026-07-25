'use client';

import { useEffect, useState } from 'react';

const DISMISSED_KEY = 'mallorca-install-prompt-dismissed';

type Platform = 'ios' | 'android' | null;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
}

function detectPlatform(): Platform {
  const ua = window.navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return null;
}

/**
 * Diskret, engangsvist tip om at føje kalenderen til hjemmeskærmen på mobil.
 * Vises ikke, hvis appen allerede kører som installeret PWA, på desktop,
 * eller hvis brugeren tidligere har lukket tippet (huskes i localStorage).
 */
export function InstallPrompt() {
  const [platform, setPlatform] = useState<Platform>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandaloneDisplay()) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const detected = detectPlatform();
    if (!detected) return;

    setPlatform(detected);
    setVisible(true);

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }

    function handleInstalled() {
      setVisible(false);
      localStorage.setItem(DISMISSED_KEY, 'true');
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  function dismiss() {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, 'true');
  }

  async function handleInstallClick() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  }

  if (!visible) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl2 border border-line bg-white p-3 text-sm text-ink">
      <span aria-hidden="true" className="mt-0.5 text-lg">
        📲
      </span>
      <div className="flex-1">
        {platform === 'ios' ? (
          <p>
            Tilføj kalenderen til hjemmeskærmen: tryk på Del-ikonet{' '}
            <span aria-hidden="true">⎋</span> nederst i browseren, og vælg{' '}
            <strong>“Føj til hjemmeskærm”</strong>.
          </p>
        ) : deferredPrompt ? (
          <div className="flex flex-col gap-2">
            <p>Tilføj kalenderen til hjemmeskærmen, så den er ét tryk væk næste gang.</p>
            <button
              type="button"
              onClick={handleInstallClick}
              className="self-start rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
            >
              Installér
            </button>
          </div>
        ) : (
          <p>
            Tilføj kalenderen til hjemmeskærmen: åbn menuen{' '}
            <span aria-hidden="true">⋮</span> i browseren, og vælg{' '}
            <strong>“Installer app”</strong> eller <strong>“Føj til startskærm”</strong>.
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Luk tip"
        className="shrink-0 text-muted hover:text-ink"
      >
        ×
      </button>
    </div>
  );
}
