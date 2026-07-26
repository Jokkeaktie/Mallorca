'use client';

import { useRef, useState } from 'react';
import { ALLOWED_PHOTO_CONTENT_TYPES, MAX_PHOTO_SIZE_BYTES } from '@/lib/bookings/photo';

interface BookingPhotoManagerProps {
  bookingId: string;
  hasPhotoInitially: boolean;
  /** Kaldes efter et vellykket upload/sletning, så kalenderdata kan genindlæses. */
  onChange?: () => void;
}

export function BookingPhotoManager({
  bookingId,
  hasPhotoInitially,
  onChange,
}: BookingPhotoManagerProps) {
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
      onChange?.();
    } catch {
      setError('Kunne ikke uploade billedet. Tjek din internetforbindelse.');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRemove() {
    const confirmed = window.confirm('Fjern billedet fra denne kalenderpost?');
    if (!confirmed) return;

    setIsBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/bookings/${bookingId}/photo`, { method: 'DELETE' });
      if (!response.ok) {
        setError('Kunne ikke fjerne billedet.');
        return;
      }
      setHasPhoto(false);
      onChange?.();
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-ink">
        Billede af nøglegemmested <span className="text-muted">(valgfrit, ses af familien)</span>
      </span>

      {hasPhoto && (
        <img
          src={`/api/bookings/${bookingId}/photo?v=${version}`}
          alt="Billede af nøglegemmested"
          className="h-40 w-full rounded-xl2 border border-line object-cover"
        />
      )}

      <div className="flex gap-2">
        <button
          type="button"
          disabled={isBusy}
          onClick={() => fileInputRef.current?.click()}
          className="rounded-xl2 border border-line px-3 py-2 text-sm hover:bg-canvas disabled:opacity-60"
        >
          {hasPhoto ? 'Erstat billede' : 'Tilføj billede'}
        </button>
        {hasPhoto && (
          <button
            type="button"
            disabled={isBusy}
            onClick={handleRemove}
            className="rounded-xl2 border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
          >
            Fjern billede
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelected}
        className="hidden"
      />

      {isBusy && <p className="text-sm text-muted">Arbejder…</p>}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
