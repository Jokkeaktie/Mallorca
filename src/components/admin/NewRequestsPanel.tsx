'use client';

import { useEffect, useState } from 'react';
import type { AdminBooking } from '@/lib/types';
import { formatDanishDate, formatDanishDateRange } from '@/lib/date/format';
import { Skeleton } from '@/components/ui/Skeleton';

interface NewRequestsPanelProps {
  /** Bumpes udefra (fx efter opret/redigér/slet) for at tvinge genindlæsning. */
  refreshToken: number;
  onEdit: (booking: AdminBooking) => void;
  onDelete: (booking: AdminBooking) => void;
  onChanged: () => void;
}

/**
 * Samler alle ubehandlede ønsker (status "request") ét sted, sorteret efter
 * hvornår de blev SENDT (ikke hvornår perioden ligger) – så et ønske til
 * fx næste sommer, der lige er kommet ind, ikke drukner i kalenderen.
 */
export function NewRequestsPanel({
  refreshToken,
  onEdit,
  onDelete,
  onChanged,
}: NewRequestsPanelProps) {
  const [requests, setRequests] = useState<AdminBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToken]);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/bookings?from=1970-01-01', { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      const bookings: AdminBooking[] = data.bookings ?? [];
      const pending = bookings
        .filter((b) => b.status === 'request')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setRequests(pending);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleApprove(booking: AdminBooking) {
    setBusyId(booking.id);
    setError(null);
    try {
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: booking.name,
          status: 'approved',
          color: booking.color,
          startDate: booking.startDate,
          endDate: booking.endDate,
          arrivalTime: booking.arrivalTime,
          departureTime: booking.departureTime,
          flightNumber: booking.flightNumber,
          internalComment: booking.internalComment,
        }),
      });
      if (!response.ok) {
        setError('Kunne ikke godkende ønsket.');
        return;
      }
      setRequests((prev) => prev.filter((r) => r.id !== booking.id));
      onChanged();
    } finally {
      setBusyId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 rounded-xl2 border border-line bg-white p-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  if (requests.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 rounded-xl2 border-2 border-accent/40 bg-accent/5 p-4">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
          <span aria-hidden="true">🔔</span> Nye ønsker
          <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-white">
            {requests.length}
          </span>
        </h2>
        <span aria-hidden="true" className="shrink-0 text-lg text-muted">
          {isOpen ? '–' : '+'}
        </span>
      </button>

      {isOpen && (
        <>
          <ul className="flex flex-col gap-2">
            {requests.map((booking) => (
              <li
                key={booking.id}
                className="flex flex-col gap-1.5 rounded-xl2 border border-line bg-white p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-ink">{booking.name}</p>
                    <p className="text-sm text-muted">
                      {formatDanishDateRange(booking.startDate, booking.endDate)}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted">
                    Sendt {formatDanishDate(booking.createdAt.slice(0, 10))}
                  </span>
                </div>

                {(booking.flightNumber || booking.arrivalTime || booking.departureTime) && (
                  <p className="text-xs text-muted">
                    {[
                      booking.flightNumber && `Fly ${booking.flightNumber}`,
                      booking.arrivalTime && `Ankomst ${booking.arrivalTime}`,
                      booking.departureTime && `Afrejse ${booking.departureTime}`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}

                {booking.internalComment && (
                  <p className="text-xs italic text-muted">
                    &ldquo;{booking.internalComment}&rdquo;
                  </p>
                )}

                <div className="mt-1 flex gap-2">
                  <button
                    type="button"
                    disabled={busyId === booking.id}
                    onClick={() => handleApprove(booking)}
                    className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60"
                  >
                    {busyId === booking.id ? 'Godkender…' : '✓ Godkend'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(booking)}
                    className="rounded-full border border-line px-3 py-1 text-xs hover:bg-canvas"
                  >
                    Redigér
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(booking)}
                    className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-700 hover:bg-red-50"
                  >
                    Slet
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {error && (
            <p role="alert" className="text-xs text-red-700">
              {error}
            </p>
          )}
        </>
      )}
    </div>
  );
}
