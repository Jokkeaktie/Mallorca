'use client';

import { useState } from 'react';
import type { AdminBooking } from '@/lib/types';
import { SUGGESTED_COLORS, isValidHexColor } from '@/lib/colors';

export interface BookingFormValues {
  name: string;
  status: 'request' | 'approved';
  color: string;
  startDate: string;
  endDate: string;
  arrivalTime: string;
  departureTime: string;
  flightNumber: string;
  internalComment: string;
}

interface BookingFormProps {
  initial?: AdminBooking;
  onSubmit: (values: BookingFormValues) => Promise<void>;
  onCancel: () => void;
}

function toFormValues(booking?: AdminBooking): BookingFormValues {
  return {
    name: booking?.name ?? '',
    status: booking?.status ?? 'request',
    color: booking?.color ?? SUGGESTED_COLORS[0]!.value,
    startDate: booking?.startDate ?? '',
    endDate: booking?.endDate ?? '',
    arrivalTime: booking?.arrivalTime ?? '',
    departureTime: booking?.departureTime ?? '',
    flightNumber: booking?.flightNumber ?? '',
    internalComment: booking?.internalComment ?? '',
  };
}

export function BookingForm({ initial, onSubmit, onCancel }: BookingFormProps) {
  const [values, setValues] = useState<BookingFormValues>(toFormValues(initial));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update<K extends keyof BookingFormValues>(key: K, value: BookingFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!values.name.trim()) {
      setError('Navn er påkrævet.');
      return;
    }
    if (!values.startDate || !values.endDate) {
      setError('Startdato og slutdato er påkrævet.');
      return;
    }
    if (values.endDate < values.startDate) {
      setError('Slutdato skal være samme dag som eller efter startdato.');
      return;
    }
    if (!isValidHexColor(values.color)) {
      setError('Vælg en gyldig farve.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Der opstod en fejl.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium text-ink">
          Navn
        </label>
        <input
          id="name"
          value={values.name}
          onChange={(e) => update('name', e.target.value)}
          className="rounded-xl2 border border-line px-3 py-2 text-base outline-none focus:border-accent"
          placeholder="Fx Joakim H."
          maxLength={120}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Status</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => update('status', 'request')}
            className={`flex-1 rounded-xl2 border px-3 py-2 text-sm ${
              values.status === 'request'
                ? 'border-accent bg-accent/10 font-medium text-accent'
                : 'border-line text-ink'
            }`}
          >
            ~ Ønske
          </button>
          <button
            type="button"
            onClick={() => update('status', 'approved')}
            className={`flex-1 rounded-xl2 border px-3 py-2 text-sm ${
              values.status === 'approved'
                ? 'border-accent bg-accent/10 font-medium text-accent'
                : 'border-line text-ink'
            }`}
          >
            ✓ Godkendt
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Farve</span>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={c.label}
              aria-label={c.label}
              onClick={() => update('color', c.value)}
              className={`h-8 w-8 rounded-full border-2 ${
                values.color.toLowerCase() === c.value.toLowerCase()
                  ? 'border-ink'
                  : 'border-transparent'
              }`}
              style={{ backgroundColor: c.value }}
            />
          ))}
          <input
            type="color"
            value={isValidHexColor(values.color) ? values.color : '#3A6351'}
            onChange={(e) => update('color', e.target.value)}
            className="h-8 w-8 cursor-pointer rounded-full border border-line p-0"
            aria-label="Vælg brugerdefineret farve"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="startDate" className="text-sm font-medium text-ink">
            Startdato
          </label>
          <input
            id="startDate"
            type="date"
            value={values.startDate}
            onChange={(e) => update('startDate', e.target.value)}
            className="rounded-xl2 border border-line px-3 py-2 text-base outline-none focus:border-accent"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="endDate" className="text-sm font-medium text-ink">
            Slutdato
          </label>
          <input
            id="endDate"
            type="date"
            value={values.endDate}
            onChange={(e) => update('endDate', e.target.value)}
            className="rounded-xl2 border border-line px-3 py-2 text-base outline-none focus:border-accent"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="arrivalTime" className="text-sm font-medium text-ink">
            Ankomsttidspunkt <span className="text-muted">(valgfri)</span>
          </label>
          <input
            id="arrivalTime"
            type="time"
            value={values.arrivalTime}
            onChange={(e) => update('arrivalTime', e.target.value)}
            className="rounded-xl2 border border-line px-3 py-2 text-base outline-none focus:border-accent"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="departureTime" className="text-sm font-medium text-ink">
            Afrejsetidspunkt <span className="text-muted">(valgfri)</span>
          </label>
          <input
            id="departureTime"
            type="time"
            value={values.departureTime}
            onChange={(e) => update('departureTime', e.target.value)}
            className="rounded-xl2 border border-line px-3 py-2 text-base outline-none focus:border-accent"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="flightNumber" className="text-sm font-medium text-ink">
          Flynummer <span className="text-muted">(valgfri)</span>
        </label>
        <input
          id="flightNumber"
          value={values.flightNumber}
          onChange={(e) => update('flightNumber', e.target.value)}
          className="rounded-xl2 border border-line px-3 py-2 text-base outline-none focus:border-accent"
          placeholder="Fx SK1533"
          maxLength={20}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="internalComment" className="text-sm font-medium text-ink">
          Intern kommentar <span className="text-muted">(vises kun for administratorer)</span>
        </label>
        <textarea
          id="internalComment"
          value={values.internalComment}
          onChange={(e) => update('internalComment', e.target.value)}
          rows={3}
          maxLength={2000}
          className="rounded-xl2 border border-line px-3 py-2 text-base outline-none focus:border-accent"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl2 border border-line px-4 py-2.5 text-sm hover:bg-canvas"
        >
          Annullér
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-xl2 bg-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {isSubmitting ? 'Gemmer…' : 'Gem'}
        </button>
      </div>
    </form>
  );
}
