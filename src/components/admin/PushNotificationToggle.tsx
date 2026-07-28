'use client';

import { useEffect, useState } from 'react';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

function isStandaloneDisplay(): boolean {
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
}

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

type Support = 'checking' | 'unsupported' | 'not-installed' | 'ready';

/**
 * Lader administratorer slå push-notifikationer til/fra for deres egen
 * enhed. På iOS kræver Web Push, at appen er installeret til hjemmeskærmen
 * (almindelig Safari-fane understøtter det ikke) - på Android/desktop er
 * det ikke et krav.
 */
export function PushNotificationToggle() {
  const [support, setSupport] = useState<Support>('checking');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function check() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setSupport('unsupported');
        return;
      }
      if (isIOS() && !isStandaloneDisplay()) {
        setSupport('not-installed');
        return;
      }
      setSupport('ready');
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      setIsSubscribed(!!existing);
    }
    check();
  }, []);

  async function handleEnable() {
    setError(null);
    setIsBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setError('Du skal give tilladelse til notifikationer for at slå dem til.');
        return;
      }
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        setError('Push-notifikationer er ikke sat op i appen endnu.');
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!response.ok) {
        setError('Kunne ikke gemme abonnementet. Prøv igen.');
        return;
      }
      setIsSubscribed(true);
    } catch {
      setError('Kunne ikke slå notifikationer til. Prøv igen.');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDisable() {
    setError(null);
    setIsBusy(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setIsSubscribed(false);
    } catch {
      setError('Kunne ikke slå notifikationer fra. Prøv igen.');
    } finally {
      setIsBusy(false);
    }
  }

  if (support === 'checking' || support === 'unsupported') return null;

  return (
    <div className="flex flex-col gap-2 rounded-xl2 border border-line bg-white p-4">
      <h2 className="text-base font-semibold text-ink">Push-notifikationer</h2>

      {support === 'not-installed' ? (
        <p className="text-xs text-muted">
          Føj appen til hjemmeskærmen for at kunne slå notifikationer til (se tippet på forsiden
          om at installere appen).
        </p>
      ) : (
        <>
          <p className="text-xs text-muted">
            Få besked med det samme på denne enhed, når der kommer et nyt ønske, en fejlrapport
            eller et nyt nøglebillede.
          </p>
          <button
            type="button"
            disabled={isBusy}
            onClick={isSubscribed ? handleDisable : handleEnable}
            className={
              isSubscribed
                ? 'self-start rounded-full border border-line px-3 py-1 text-xs hover:bg-canvas disabled:opacity-60'
                : 'self-start rounded-full bg-accent px-3 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60'
            }
          >
            {isBusy
              ? 'Arbejder…'
              : isSubscribed
                ? 'Slå notifikationer fra'
                : 'Slå notifikationer til'}
          </button>
          {error && (
            <p role="alert" className="text-xs text-red-700">
              {error}
            </p>
          )}
        </>
      )}
    </div>
  );
}
