'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function FamilyLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/family/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? 'Der opstod en fejl. Prøv igen.');
        return;
      }

      const next = searchParams.get('next') || '/';
      router.replace(next);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-medium text-ink">
          Fælles adgangskode
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl2 border border-line bg-white px-4 py-3 text-base outline-none focus:border-accent"
          placeholder="Indtast adgangskode"
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
        className="rounded-xl2 bg-accent px-4 py-3 text-base font-medium text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {isSubmitting ? 'Kontrollerer…' : 'Se kalenderen'}
      </button>
    </form>
  );
}
