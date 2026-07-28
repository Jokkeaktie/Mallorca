'use client';

import { useEffect, useRef, useState } from 'react';
import { ALLOWED_KEY_PHOTO_CONTENT_TYPES, MAX_KEY_PHOTO_SIZE_BYTES } from '@/lib/settings/keyPhoto';

interface KeyLocationPhotoProps {
  /** Viser en "Fjern billede"-knap. Kun administratorer må slette permanent. */
  isAdmin?: boolean;
  /**
   * 'link' (standard): et diskret tekstlink uden billede, så siden ikke ser
   * ud som om et billede mangler, når de fleste ophold slet ikke har en
   * skjult nøgle. 'card' bruges på Indstillinger-siden, hvor det skal se ens
   * ud med de andre indstillings-bokse.
   */
  emptyStateVariant?: 'link' | 'card';
}

/**
 * Ét fælles billede af nøglegemmestedet – ikke knyttet til en bestemt
 * booking. Alle med adgang (familie/venner og administratorer) kan
 * tilføje/opdatere det, typisk den afrejsende gæst, der viser den næste
 * gæst, hvor nøglen er lagt.
 *
 * De fleste ophold har IKKE en skjult nøgle (gæsterne får den direkte af
 * Sven/Inger), så uden et billede vises kun et diskret link i stedet for en
 * fremtrædende boks, der ellers ville se ud som om et billede mangler.
 */
export function KeyLocationPhoto({ isAdmin, emptyStateVariant = 'link' }: KeyLocationPhotoProps) {
  const [hasPhoto, setHasPhoto] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch('/api/key-photo', { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        setHasPhoto(!!data.hasPhoto);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setError(null);

    if (!ALLOWED_KEY_PHOTO_CONTENT_TYPES.has(file.type)) {
      setError('Filtypen understøttes ikke. Brug JPEG, PNG, WEBP, HEIC eller GIF.');
      return;
    }
    if (file.size > MAX_KEY_PHOTO_SIZE_BYTES) {
      setError('Billedet er for stort. Maks 8 MB.');
      return;
    }

    setIsBusy(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const response = await fetch('/api/key-photo', { method: 'POST', body: formData });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? 'Kunne ikke uploade billedet.');
        return;
      }
      setHasPhoto(true);
      setVersion((v) => v + 1);
    } catch {
      setError('Kunne ikke uploade billedet. Tjek din internetforbindelse.');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRemove() {
    const confirmed = window.confirm('Fjern det fælles nøglebillede?');
    if (!confirmed) return;

    setIsBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/key-photo', { method: 'DELETE' });
      if (!response.ok) {
        setError('Kunne ikke fjerne billedet.');
        return;
      }
      setHasPhoto(false);
      setIsPreviewOpen(false);
    } finally {
      setIsBusy(false);
    }
  }

  if (isLoading) return null;

  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      onChange={handleFileSelected}
      className="hidden"
    />
  );

  if (!hasPhoto) {
    if (emptyStateVariant === 'card') {
      return (
        <div className="flex flex-col items-start gap-2 rounded-xl2 border border-line bg-white p-4">
          <h2 className="text-base font-semibold text-ink">Nøglegemmested</h2>
          <p className="text-xs text-muted">
            Der er endnu ikke uploadet et billede af nøglegemmestedet.
          </p>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => fileInputRef.current?.click()}
            className="self-start rounded-full border border-line px-3 py-1 text-xs hover:bg-canvas disabled:opacity-60"
          >
            {isBusy ? 'Uploader…' : '+ Tilføj billede'}
          </button>
          {fileInput}
          {error && (
            <p role="alert" className="text-xs text-red-700">
              {error}
            </p>
          )}
        </div>
      );
    }
    return (
      <div className="flex flex-col items-start gap-1">
        <button
          type="button"
          disabled={isBusy}
          onClick={() => fileInputRef.current?.click()}
          className="text-xs text-muted underline underline-offset-2 hover:text-ink disabled:opacity-60"
        >
          {isBusy ? 'Uploader…' : '+ Tilføj billede af nøglegemmested'}
        </button>
        {fileInput}
        {error && (
          <p role="alert" className="text-xs text-red-700">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl2 border border-line bg-white p-4">
      <h2 className="text-base font-semibold text-ink">Nøglegemmested</h2>

      <button type="button" onClick={() => setIsPreviewOpen(true)} className="text-left">
        <img
          src={`/api/key-photo/image?v=${version}`}
          alt="Billede af nøglegemmested"
          className="h-32 w-full rounded-xl2 border border-line object-cover"
        />
      </button>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={isBusy}
          onClick={() => fileInputRef.current?.click()}
          className="self-start rounded-full border border-line px-3 py-1 text-xs hover:bg-canvas disabled:opacity-60"
        >
          {isBusy ? 'Uploader…' : 'Opdatér billede'}
        </button>
        {isAdmin && (
          <button
            type="button"
            disabled={isBusy}
            onClick={handleRemove}
            className="self-start rounded-full border border-red-200 px-3 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-60"
          >
            Fjern billede
          </button>
        )}
      </div>

      {fileInput}

      {error && (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      )}

      {isPreviewOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/90 p-4"
          onClick={() => setIsPreviewOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsPreviewOpen(false)}
            aria-label="Luk billede"
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl leading-none text-ink"
          >
            ×
          </button>
          <img
            src={`/api/key-photo/image?v=${version}`}
            alt="Billede af nøglegemmested"
            className="max-h-full max-w-full rounded-xl2 object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
