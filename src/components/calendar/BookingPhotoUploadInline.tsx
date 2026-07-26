'use client';

import { useRef, useState } from 'react';
import { ALLOWED_PHOTO_CONTENT_TYPES, MAX_PHOTO_SIZE_BYTES } from '@/lib/bookings/photo';

interface BookingPhotoUploadInlineProps {
  bookingId: string;
  bookingName: string;
  hasPhotoInitially: boolean;
  /** Kaldes efter et vellykket upload, så resten af kalenderen kan opdateres. */
  onUploaded?: () => void;
}

/**
 * Lader ALLE med adgang til kalenderen (familie/venner og administratorer)
 * tilføje eller erstatte billedet af nøglegemmested på en booking – typisk
 * den afrejsende gæst, der viser den næste gæst, hvor nøglen er lagt.
 * Sletning er bevidst ikke med her (kun i administratorernes redigering).
 */
export function BookingPhotoUploadInline({
  bookingId,
  bookingName,
  hasPhotoInitially,
  onUploaded,
}: BookingPhotoUploadInlineProps) {
  const [hasPhoto, setHasPhoto] = useState(hasPhotoInitially);
  const [version, setVersion] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setError(null);

    if (!ALLOWED_PHOTO_CONTENT_TYPES.has(file.type)) {
      setError('Filtypen understøttes ikke. Brug JPEG, PNG, WEBP, HEIC eller GIF.');
      return;
    }
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      setError('Billedet er for stort. Maks 8 MB.');
      return;
    }

    setIsBusy(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const response = await fetch(`/api/bookings/${bookingId}/photo`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? 'Kunne ikke uploade billedet.');
        return;
      }
      setHasPhoto(true);
      setVersion((v) => v + 1);
      onUploaded?.();
    } catch {
      setError('Kunne ikke uploade billedet. Tjek din internetforbindelse.');
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      {hasPhoto && (
        <a
          href={`/api/bookings/${bookingId}/photo?v=${version}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src={`/api/bookings/${bookingId}/photo?v=${version}`}
            alt={`Billede af nøglegemmested for ${bookingName}`}
            className="h-32 w-full rounded-xl2 border border-line object-cover"
          />
        </a>
      )}

      <button
        type="button"
        disabled={isBusy}
        onClick={() => fileInputRef.current?.click()}
        className="self-start rounded-full border border-line px-3 py-1 text-xs hover:bg-canvas disabled:opacity-60"
      >
        {isBusy ? 'Uploader…' : hasPhoto ? 'Opdatér billede af nøgle' : 'Tilføj billede af nøgle'}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelected}
        className="hidden"
      />

      {error && (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
