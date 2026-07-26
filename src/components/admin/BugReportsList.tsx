'use client';

import { useEffect, useState } from 'react';
import type { BugReport } from '@/lib/types';
import { formatDanishDate } from '@/lib/date/format';

export function BugReportsList() {
  const [reports, setReports] = useState<BugReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (isLoading) return <p className="text-sm text-muted">Indlæser…</p>;
  if (error) return <p className="text-sm text-red-700">{error}</p>;

  if (reports.length === 0) {
    return <p className="text-sm text-muted">Ingen fejlrapporter endnu.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {reports.map((report) => (
        <li key={report.id} className="flex flex-col gap-2 rounded-xl2 border border-line bg-white p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm text-muted">
                {formatDanishDate(report.createdAt.slice(0, 10))} ·{' '}
                {report.reporterName ?? 'Anonym'}
              </p>
              <p className="whitespace-pre-line text-ink">{report.description}</p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                report.status === 'resolved'
                  ? 'bg-accent/15 text-accent'
                  : 'bg-muted/15 text-muted'
              }`}
            >
              {report.status === 'resolved' ? '✓ Løst' : '~ Ny'}
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
              onClick={() => toggleStatus(report)}
              className="rounded-full border border-line px-3 py-1 text-xs hover:bg-canvas"
            >
              {report.status === 'new' ? 'Markér som løst' : 'Genåbn'}
            </button>
            <button
              type="button"
              onClick={() => handleDelete(report.id)}
              className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-700 hover:bg-red-50"
            >
              Slet
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
