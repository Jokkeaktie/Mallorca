'use client';

import { useEffect, useState } from 'react';
import type { GalleryCategory, GalleryPhoto } from '@/lib/types';
import { Skeleton } from '@/components/ui/Skeleton';

export function GalleryView() {
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [categoriesRes, photosRes] = await Promise.all([
          fetch('/api/gallery/categories', { cache: 'no-store' }),
          fetch('/api/gallery/photos', { cache: 'no-store' }),
        ]);
        if (!categoriesRes.ok || !photosRes.ok) {
          setError('Kunne ikke hente billederne. Prøv at genindlæse siden.');
          return;
        }
        const categoriesData = await categoriesRes.json();
        const photosData = await photosRes.json();
        setCategories(categoriesData.categories ?? []);
        setPhotos(photosData.photos ?? []);
      } catch {
        setError('Kunne ikke hente billederne. Tjek din internetforbindelse.');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-xl2" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-700">{error}</p>;
  }

  if (photos.length === 0) {
    return <p className="text-sm text-muted">Der er ikke lagt nogen billeder op endnu.</p>;
  }

  const groups = [
    ...categories.map((category) => ({
      key: category.id,
      name: category.name,
      photos: photos
        .filter((p) => p.categoryId === category.id)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    })),
    {
      key: '__uncategorized__',
      name: 'Andet',
      photos: photos.filter((p) => p.categoryId === null).sort((a, b) => a.sortOrder - b.sortOrder),
    },
  ].filter((g) => g.photos.length > 0);

  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => (
        <section key={group.key} className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-ink">{group.name}</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {group.photos.map((photo) => (
              <li key={photo.id}>
                <button
                  type="button"
                  onClick={() => setPreviewId(photo.id)}
                  className="block aspect-square w-full overflow-hidden rounded-xl2 border border-line"
                >
                  <img
                    src={`/api/gallery/photos/${photo.id}/image`}
                    alt="Galleribillede"
                    className="h-full w-full object-cover"
                  />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {previewId && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/90 p-4"
          onClick={() => setPreviewId(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewId(null)}
            aria-label="Luk billede"
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl leading-none text-ink"
          >
            ×
          </button>
          <img
            src={`/api/gallery/photos/${previewId}/image`}
            alt="Galleribillede"
            className="max-h-full max-w-full rounded-xl2 object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
