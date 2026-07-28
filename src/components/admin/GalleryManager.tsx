'use client';

import { useEffect, useRef, useState } from 'react';
import type { GalleryCategory, GalleryPhoto } from '@/lib/types';
import { Skeleton } from '@/components/ui/Skeleton';
import { compressImageForUpload } from '@/lib/media/compressImage';

const UNCATEGORIZED_KEY = '__uncategorized__';

export function GalleryManager() {
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [uploadCategoryId, setUploadCategoryId] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const [categoriesRes, photosRes] = await Promise.all([
        fetch('/api/gallery/categories', { cache: 'no-store' }),
        fetch('/api/gallery/photos', { cache: 'no-store' }),
      ]);
      if (!categoriesRes.ok || !photosRes.ok) {
        setError('Kunne ikke hente galleriet.');
        return;
      }
      const categoriesData = await categoriesRes.json();
      const photosData = await photosRes.json();
      setCategories(categoriesData.categories ?? []);
      setPhotos(photosData.photos ?? []);
    } catch {
      setError('Kunne ikke hente galleriet.');
    } finally {
      setIsLoading(false);
    }
  }

  // --- Kategorier ---

  async function handleAddCategory(event: React.FormEvent) {
    event.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;

    const response = await fetch('/api/gallery/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) {
      setError('Kunne ikke oprette kategorien.');
      return;
    }
    const data = await response.json();
    setCategories((prev) => [...prev, data.category]);
    setNewCategoryName('');
  }

  function handleCategoryNameChange(id: string, name: string) {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
  }

  async function handleSaveCategory(category: GalleryCategory) {
    const trimmed = category.name.trim();
    if (!trimmed) {
      setError('Kategorinavnet må ikke være tomt.');
      return;
    }
    const response = await fetch(`/api/gallery/categories/${category.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    });
    if (!response.ok) {
      setError('Kunne ikke gemme kategorien.');
      return;
    }
    setError(null);
  }

  async function handleMoveCategory(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const current = categories[index]!;
    const target = categories[targetIndex]!;

    const reordered = [...categories];
    reordered[index] = target;
    reordered[targetIndex] = current;
    setCategories(reordered);

    await Promise.all([
      fetch(`/api/gallery/categories/${current.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortOrder: target.sortOrder }),
      }),
      fetch(`/api/gallery/categories/${target.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortOrder: current.sortOrder }),
      }),
    ]);
  }

  async function handleDeleteCategory(id: string) {
    const confirmed = window.confirm(
      'Slet denne kategori? Billeder i kategorien slettes ikke, men bliver ukategoriserede.',
    );
    if (!confirmed) return;

    const response = await fetch(`/api/gallery/categories/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      setError('Kunne ikke slette kategorien.');
      return;
    }
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setPhotos((prev) => prev.map((p) => (p.categoryId === id ? { ...p, categoryId: null } : p)));
  }

  // --- Upload ---

  async function handleFilesSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    event.target.value = '';
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);
    const failures: string[] = [];

    for (const file of Array.from(files)) {
      try {
        // Formindsk billedet før upload - iPhone-fotos er ofte langt over
        // vores 4 MB-grænse, og ville ellers fejle med en uklar fejlbesked.
        const uploadFile = await compressImageForUpload(file);

        const formData = new FormData();
        formData.append('photo', uploadFile);
        if (uploadCategoryId) formData.append('categoryId', uploadCategoryId);

        const response = await fetch('/api/gallery/photos', { method: 'POST', body: formData });
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          const reason = body?.error ?? `HTTP ${response.status}`;
          failures.push(`${file.name}: ${reason}`);
          continue;
        }
        const data = await response.json();
        setPhotos((prev) => [...prev, data.photo]);
      } catch (err) {
        const reason = err instanceof Error ? err.message : 'netværksfejl';
        failures.push(`${file.name}: ${reason}`);
      }
    }

    setIsUploading(false);
    if (failures.length > 0) {
      setError(`Kunne ikke uploade ${failures.length} billede(r):\n${failures.join('\n')}`);
    }
  }

  // --- Fotos ---

  async function handleChangeCategory(photo: GalleryPhoto, categoryId: string | null) {
    setPhotos((prev) => prev.map((p) => (p.id === photo.id ? { ...p, categoryId } : p)));
    const response = await fetch(`/api/gallery/photos/${photo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId }),
    });
    if (!response.ok) {
      setError('Kunne ikke flytte billedet til den nye kategori.');
    }
  }

  async function handleMovePhoto(group: GalleryPhoto[], index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= group.length) return;

    const current = group[index]!;
    const target = group[targetIndex]!;

    setPhotos((prev) =>
      prev.map((p) => {
        if (p.id === current.id) return { ...p, sortOrder: target.sortOrder };
        if (p.id === target.id) return { ...p, sortOrder: current.sortOrder };
        return p;
      }),
    );

    await Promise.all([
      fetch(`/api/gallery/photos/${current.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortOrder: target.sortOrder }),
      }),
      fetch(`/api/gallery/photos/${target.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortOrder: current.sortOrder }),
      }),
    ]);
  }

  async function handleDeletePhoto(id: string) {
    const confirmed = window.confirm('Slet dette billede permanent?');
    if (!confirmed) return;

    const response = await fetch(`/api/gallery/photos/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      setError('Kunne ikke slette billedet.');
      return;
    }
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-24 w-full rounded-xl2" />
        <Skeleton className="h-40 w-full rounded-xl2" />
      </div>
    );
  }

  const groups: { key: string; category: GalleryCategory | null; photos: GalleryPhoto[] }[] = [
    ...categories.map((category) => ({
      key: category.id,
      category,
      photos: photos
        .filter((p) => p.categoryId === category.id)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    })),
    {
      key: UNCATEGORIZED_KEY,
      category: null,
      photos: photos.filter((p) => p.categoryId === null).sort((a, b) => a.sortOrder - b.sortOrder),
    },
  ].filter((g) => g.category !== null || g.photos.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-xl2 border border-line bg-white p-4">
        <h2 className="text-base font-semibold text-ink">Kategorier</h2>
        <p className="text-sm text-muted">
          Bruges til at gruppere billederne, fx &quot;Udsigt&quot;, &quot;Inventar&quot; eller
          &quot;Sådan finder du hertil&quot;.
        </p>

        <ul className="flex flex-col gap-2">
          {categories.map((category, index) => (
            <li key={category.id} className="flex flex-wrap items-center gap-2 rounded-xl2 border border-line p-2">
              <input
                value={category.name}
                onChange={(e) => handleCategoryNameChange(category.id, e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={() => handleMoveCategory(index, -1)}
                disabled={index === 0}
                aria-label="Flyt op"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-base disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => handleMoveCategory(index, 1)}
                disabled={index === categories.length - 1}
                aria-label="Flyt ned"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-base disabled:opacity-30"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => handleSaveCategory(category)}
                className="rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
              >
                Gem
              </button>
              <button
                type="button"
                onClick={() => handleDeleteCategory(category.id)}
                className="rounded-full border border-red-200 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50"
              >
                Slet
              </button>
            </li>
          ))}
          {categories.length === 0 && <p className="text-sm text-muted">Ingen kategorier endnu.</p>}
        </ul>

        <form onSubmit={handleAddCategory} className="flex gap-2">
          <input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Fx: Udsigt"
            maxLength={60}
            className="flex-1 rounded-xl2 border border-line px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <button
            type="submit"
            className="rounded-xl2 bg-accent px-3 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Ny kategori
          </button>
        </form>
      </div>

      <div className="flex flex-col gap-3 rounded-xl2 border border-line bg-white p-4">
        <h2 className="text-base font-semibold text-ink">Upload billeder</h2>
        <p className="text-sm text-muted">Maks 4 MB pr. billede. I kan vælge flere på én gang.</p>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={uploadCategoryId}
            onChange={(e) => setUploadCategoryId(e.target.value)}
            className="rounded-xl2 border border-line px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="">Ingen kategori</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl2 border border-line px-4 py-2 text-sm font-medium hover:bg-canvas disabled:opacity-60"
          >
            {isUploading ? 'Uploader…' : '+ Vælg billeder'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilesSelected}
            className="hidden"
          />
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="whitespace-pre-line rounded-xl2 border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {groups.length === 0 ? (
        <p className="text-sm text-muted">Ingen billeder i galleriet endnu.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <div key={group.key} className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-ink">
                {group.category ? group.category.name : 'Ukategoriseret'}
              </h3>
              {group.photos.length === 0 ? (
                <p className="text-xs text-muted">Ingen billeder i denne kategori endnu.</p>
              ) : (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {group.photos.map((photo, index) => (
                    <li key={photo.id} className="flex flex-col gap-2 rounded-xl2 border border-line bg-white p-2">
                      <a
                        href={`/api/gallery/photos/${photo.id}/image`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src={`/api/gallery/photos/${photo.id}/image`}
                          alt="Galleribillede"
                          className="h-28 w-full rounded-lg object-cover"
                        />
                      </a>
                      <select
                        value={photo.categoryId ?? ''}
                        onChange={(e) => handleChangeCategory(photo, e.target.value || null)}
                        className="w-full rounded-lg border border-line px-2 py-1.5 text-xs outline-none focus:border-accent"
                      >
                        <option value="">Ukategoriseret</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleMovePhoto(group.photos, index, -1)}
                          disabled={index === 0}
                          aria-label="Flyt op"
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-sm disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMovePhoto(group.photos, index, 1)}
                          disabled={index === group.photos.length - 1}
                          aria-label="Flyt ned"
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-sm disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePhoto(photo.id)}
                          aria-label="Slet billede"
                          className="ml-auto rounded-full border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                        >
                          Slet
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
