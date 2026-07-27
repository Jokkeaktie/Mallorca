'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarShell } from '@/components/calendar/CalendarShell';
import { BookingForm, type BookingFormValues } from './BookingForm';
import { PasswordForm } from './PasswordForm';
import { KeyLocationPhoto } from '@/components/booking/KeyLocationPhoto';
import type { AdminBooking, CalendarBooking } from '@/lib/types';
import { getBrowserSupabaseClient } from '@/lib/supabase/browserClient';

type FormMode = { kind: 'create' } | { kind: 'edit'; booking: AdminBooking };

function toApiPayload(values: BookingFormValues) {
  return {
    name: values.name.trim(),
    status: values.status,
    color: values.color,
    startDate: values.startDate,
    endDate: values.endDate,
    arrivalTime: values.arrivalTime || null,
    departureTime: values.departureTime || null,
    internalComment: values.internalComment || null,
  };
}

export function AdminDashboard() {
  const router = useRouter();
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [banner, setBanner] = useState<string | null>(null);

  function refresh() {
    setRefreshToken((n) => n + 1);
  }

  async function handleCreate(values: BookingFormValues) {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toApiPayload(values)),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error ?? 'Kunne ikke oprette posten.');
    }
    setFormMode(null);
    setBanner('Kalenderposten er oprettet.');
    refresh();
  }

  async function handleUpdate(id: string, values: BookingFormValues) {
    const response = await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toApiPayload(values)),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error ?? 'Kunne ikke opdatere posten.');
    }
    setFormMode(null);
    setBanner('Kalenderposten er opdateret.');
    refresh();
  }

  async function handleDelete(booking: CalendarBooking) {
    const confirmed = window.confirm(`Slet kalenderposten for "${booking.name}"?`);
    if (!confirmed) return;

    const response = await fetch(`/api/bookings/${booking.id}`, { method: 'DELETE' });
    if (!response.ok) {
      setBanner('Kunne ikke slette posten. Prøv igen.');
      return;
    }
    setBanner('Kalenderposten er slettet.');
    refresh();
  }

  async function handleLogout() {
    const supabase = getBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.replace('/admin/login');
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setFormMode({ kind: 'create' })}
          className="rounded-xl2 bg-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          + Ny kalenderpost
        </button>
        <div className="flex items-center gap-3 text-sm">
          <button
            type="button"
            onClick={() => setShowSettings((v) => !v)}
            className="text-muted underline-offset-2 hover:underline"
          >
            Indstillinger
          </button>
          <button type="button" onClick={handleLogout} className="text-muted underline-offset-2 hover:underline">
            Log ud
          </button>
        </div>
      </div>

      {banner && (
        <div className="flex items-center justify-between rounded-xl2 bg-accent/10 px-4 py-2 text-sm text-accent">
          <span>{banner}</span>
          <button type="button" onClick={() => setBanner(null)} aria-label="Luk besked">
            ×
          </button>
        </div>
      )}

      {showSettings && (
        <div className="rounded-xl2 border border-line bg-white p-4">
          <h2 className="mb-3 text-base font-semibold text-ink">
            Familiens fælles adgangskode
          </h2>
          <PasswordForm />
        </div>
      )}

      <KeyLocationPhoto isAdmin />

      <CalendarShell
        isAdmin
        refreshToken={refreshToken}
        onEditBooking={(booking) => setFormMode({ kind: 'edit', booking: booking as AdminBooking })}
        onDeleteBooking={handleDelete}
      />

      {formMode && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center"
          onClick={() => setFormMode(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-xl2 bg-white p-5 sm:rounded-xl2"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-semibold text-ink">
              {formMode.kind === 'create' ? 'Ny kalenderpost' : 'Redigér kalenderpost'}
            </h3>
            <BookingForm
              initial={formMode.kind === 'edit' ? formMode.booking : undefined}
              onCancel={() => setFormMode(null)}
              onSubmit={(values) =>
                formMode.kind === 'create'
                  ? handleCreate(values)
                  : handleUpdate(formMode.booking.id, values)
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
