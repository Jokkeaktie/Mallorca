'use client';

import { useEffect, useRef, useState } from 'react';
import { ALLOWED_IMAGE_CONTENT_TYPES, MAX_IMAGE_SIZE_BYTES } from '@/lib/media/imagePolicy';
import { MAX_BUG_REPORT_PHOTOS } from '@/lib/validation/bugReport';

interface PendingPhoto {
  file: File;
  previewUrl: string;
}

interface BugReportFormProps {
  /** Kaldes efter en vellykket indsendelse, fx så en liste kan genindlæses. */
  onSubmitted?: () => void;
}

export function BugReportForm({ onSubmitted }: BugReportFormProps = {}) {
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Ryd op i objekt-URL'er, så vi ikke lækker hukommelse.
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFilesSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;

    setError(null);

    const accepted: PendingPhoto[] = [];
    for (const file of files) {
      if (!ALLOWED_IMAGE_CONTENT_TYPES.has(file.type)) {
        setError('En eller flere filer har en filtype, der ikke understøttes.');
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        setError('Et eller flere billeder er for store. Maks 8 MB pr. billede.');
        continue;
      }
      accepted.push({ file, previewUrl: URL.createObjectURL(file) });
    }

    setPhotos((prev) => {
      const combined = [...prev, ...accepted];
      if (combined.length > MAX_BUG_REPORT_PHOTOS) {
        setError(`Højst ${MAX_BUG_REPORT_PHOTOS} billeder pr. rapport.`);
        return combined.slice(0, MAX_BUG_REPORT_PHOTOS);
      }
      return combined;
    });
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!description.trim()) {
      setError('Skriv en kort beskrivelse af fejlen.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('description', description.trim());
      if (reporterName.trim()) formData.append('reporterName', reporterName.trim());
      photos.forEach((p) => formData.append('photos', p.file));

      const response = await fetch('/api/bug-reports', { method: 'POST', body: formData });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? 'Kunne ikke sende rapporten. Prøv igen.');
        return;
      }

      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setDescription('');
      setReporterName('');
      setPhotos([]);
      setIsSent(true);
      onSubmitted?.();
    } catch {
      setError('Kunne ikke sende rapporten. Tjek din internetforbindelse.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSent) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl2 border border-line bg-white p-6 text-center">
        <p className="text-lg">✓</p>
        <p className="text-ink">Tak! Rapporten er sendt til administratorerne.</p>
        <button
          type="button"
          onClick={() => setIsSent(false)}
          className="text-sm text-accent underline underline-offset-2"
        >
          Rapportér en ny fejl
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="description" className="text-sm font-medium text-ink">
          Hvad er der galt?
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="Fx: Opvaskemaskinen larmer, eller der mangler en pære i entréen"
          className="rounded-xl2 border border-line px-3 py-2 text-base outline-none focus:border-accent"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="reporterName" className="text-sm font-medium text-ink">
          Dit navn <span className="text-muted">(valgfrit)</span>
        </label>
        <input
          id="reporterName"
          value={reporterName}
          onChange={(e) => setReporterName(e.target.value)}
          maxLength={120}
          placeholder="Fx Joakim H."
          className="rounded-xl2 border border-line px-3 py-2 text-base outline-none focus:border-accent"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-ink">
          Billeder <span className="text-muted">(valgfrit, op til {MAX_BUG_REPORT_PHOTOS})</span>
        </span>

        {photos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {photos.map((photo, index) => (
              <div key={photo.previewUrl} className="relative">
                <img
                  src={photo.previewUrl}
                  alt=""
                  className="h-20 w-20 rounded-xl2 border border-line object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  aria-label="Fjern billede"
                  className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-xs text-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {photos.length < MAX_BUG_REPORT_PHOTOS && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="self-start rounded-xl2 border border-line px-3 py-2 text-sm hover:bg-canvas"
          >
            + Tilføj billede
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFilesSelected}
          className="hidden"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-xl2 bg-accent px-4 py-3 text-base font-medium text-white hover:opacity-90 disabled:opacity-60"
      >
        {isSubmitting ? 'Sender…' : 'Send rapport'}
      </button>
    </form>
  );
}
