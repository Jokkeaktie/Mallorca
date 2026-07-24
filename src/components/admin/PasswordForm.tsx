'use client';

import { useState } from 'react';

export function PasswordForm() {
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus('saving');
    setError(null);

    try {
      const response = await fetch('/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? 'Der opstod en fejl.');
        setStatus('error');
        return;
      }

      setNewPassword('');
      setStatus('saved');
    } catch {
      setError('Der opstod en fejl. Tjek din internetforbindelse.');
      setStatus('error');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="newPassword" className="text-sm font-medium text-ink">
          Ny fælles adgangskode til familievisningen
        </label>
        <input
          id="newPassword"
          type="text"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          minLength={8}
          required
          className="rounded-xl2 border border-line px-3 py-2 text-base outline-none focus:border-accent"
          placeholder="Mindst 8 tegn"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      {status === 'saved' && (
        <p className="text-sm text-accent">Adgangskoden er opdateret.</p>
      )}

      <button
        type="submit"
        disabled={status === 'saving'}
        className="self-start rounded-xl2 bg-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
      >
        {status === 'saving' ? 'Gemmer…' : 'Opdatér adgangskode'}
      </button>
    </form>
  );
}
