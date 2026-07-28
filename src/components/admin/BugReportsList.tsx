'use client';

import { useEffect, useState } from 'react';
import type { BugReport } from '@/lib/types';
import { formatDanishDate } from '@/lib/date/format';
import { Skeleton } from '@/components/ui/Skeleton';

export function BugReportsList() {
  const [reports, setReports] = useState<BugReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/bug-reports', { cache: 'no-store' });
      if (!response.ok) {
        setError('Kunne ikke hente fejlrapporter.');
        return;
      }
      const data = await response.json();
      setReports(data.reports ?? []);
    } catch {
      setError('Kunne ikke hente fejlrapporter.');
    } finally {
      setIsLoading(false);
    }
  }

  async function toggleStatus(report: BugReport) {
    const newStatus = report.status === 'new' ? 'resolved' : 'new';
    const response = await fetch(`/api/bug-reports/${report.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!response.ok) {
      setError('Kunne ikke opdatere status.');
      return;
    }
    setReports((prev) =>
      prev.map((r) => (r.id === report.id ? { ...r, status: newStatus } : r)),
    );
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm('Slet denne fejlrapport permanent?');
    if (!confirmed) return;

    const response = await fetch(`/api/bug-reports/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      setError('Kunne ikke slette rapporten.');
      return;
    }
    setReports((prev) => prev.filter((r) => r.id !== id));
  }

  if (isLoading) {
    return (
      <ul className="flex flex-col gap-3">
        {[0, 1].map((i) => (
          <li key={i} className="flex flex-col gap-2 rounded-xl2 border border-line bg-white p-3">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </li>
        ))}
      </ul>
    );
  }
  if (error && reports.length === 0) return <p className="text-sm text-red-700">{error}</p>;

  if (reports.length === 0) {
    return <p className="text-sm text-muted">Ingen fejlrapporter endnu.</p>;
  }

  const openReports = reports.filter((r) => r.status === 'new');
  const resolvedReports = reports.filter((r) => r.status === 'resolved');

  return (
    <div className="flex flex-col gap-4">
      {openReports.length === 0 ? (
        <p className="text-sm text-muted">Ingen åbne fejlrapporter.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {openReports.map((report) => (
            <BugReportCard
              key={report.id}
              report={report}
              onToggleStatus={toggleStatus}
              onDelete={handleDelete}
            />
          ))}
        </ul>
      )}

      {resolvedReports.length > 0 && (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setShowResolved((v) => !v)}
            aria-expanded={showResolved}
            className="self-start text-sm text-muted underline underline-offset-2 hover:text-ink"
          >
            {showResolved ? '– Skjul' : '+ Vis'} løste fejlrapporter ({resolvedReports.length})
          </button>

          {showResolved && (
            <ul className="flex flex-col gap-3">
              {resolvedReports.map((report) => (
                <BugReportCard
                  key={report.id}
                  report={report}
                  onToggleStatus={toggleStatus}
                  onDelete={handleDelete}
                />
              ))}
            </ul>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

interface BugReportCardProps {
  report: BugReport;
  onToggleStatus: (report: BugReport) => void;
  onDelete: (id: string) => void;
}

function BugReportCard({ report, onToggleStatus, onDelete }: BugReportCardProps) {
  const isResolved = report.status === 'resolved';

  return (
    <li
      className={`flex flex-col gap-2 rounded-xl2 border-l-4 border border-line p-3 ${
        isResolved ? 'border-l-accent/50 bg-canvas' : 'border-l-amber-400 bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm text-muted">
            {formatDanishDate(report.createdAt.slice(0, 10))} · {report.reporterName ?? 'Anonym'}
          </p>
          <p className="whitespace-pre-line text-ink">{report.description}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
            isResolved ? 'bg-accent/15 text-accent' : 'bg-amber-100 text-amber-800'
          }`}
        >
          {isResolved ? '✓ Løst' : '● Åben'}
        </span>
      </div>

      {report.photos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {report.photos.map((_, index) => (
            <a
              key={index}
              href={`/api/bug-reports/${report.id}/photos/${index}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={`/api/bug-reports/${report.id}/photos/${index}`}
                alt={`Billede ${index + 1} til fejlrapport`}
                className="h-20 w-20 rounded-xl2 border border-line object-cover"
              />
            </a>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onToggleStatus(report)}
          className="rounded-full border border-line px-3 py-1 text-xs hover:bg-canvas"
        >
          {isResolved ? 'Genåbn' : 'Markér som løst'}
        </button>
        <button
          type="button"
          onClick={() => onDelete(report.id)}
          className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-700 hover:bg-red-50"
        >
          Slet
        </button>
      </div>
    </li>
  );
}
