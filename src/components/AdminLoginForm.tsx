'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserSupabaseClient } from '@/lib/supabase/browserClient';

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // MIDLERTIDIG DEBUG-INFO: viser hvad browseren rent faktisk har fået med
      // fra miljøvariablerne, og den tekniske fejl fra Supabase. Fjernes igen,
      // når admin-login virker som forventet.
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const debugInfo = `URL: ${url ? url : '(MANGLER)'} | anon-nøgle: ${
        anonKey ? `${anonKey.slice(0, 12)}… (${anonKey.length} tegn)` : '(MANGLER)'
      }`;

      const supabase = getBrowserSupabaseClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(
          `Forkert e-mail eller adgangskode. [DEBUG: ${signInError.message} (status ${signInError.status ?? 'ukendt'}) — ${debugInfo}]`,
        );
        return;
      }

      router.replace('/admin');
      router.refresh();
    } catch (err) {
      setError(`Uventet fejl. [DEBUG: ${err instanceof Error ? err.message : String(err)}]`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-medium text-ink">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl2 border border-line bg-white px-4 py-3 text-base outline-none focus:border-accent"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-medium text-ink">
          Adgangskode
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl2 border border-line bg-white px-4 py-3 text-base outline-none focus:border-accent"
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
        {isSubmitting ? 'Logger ind…' : 'Log ind'}
      </button>
    </form>
  );
}
