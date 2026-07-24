'use client';

export type CalendarViewMode = 'month' | 'week' | 'year';

interface CalendarNavProps {
  view: CalendarViewMode;
  onViewChange: (view: CalendarViewMode) => void;
  label: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

const VIEW_LABELS: Record<CalendarViewMode, string> = {
  month: 'Måned',
  week: 'Uge',
  year: 'År',
};

export function CalendarNav({ view, onViewChange, label, onPrev, onNext, onToday }: CalendarNavProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          aria-label="Forrige"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-lg leading-none hover:bg-canvas"
        >
          ‹
        </button>
        <h2 className="min-w-[9rem] text-center text-lg font-semibold capitalize text-ink sm:text-xl">
          {label}
        </h2>
        <button
          type="button"
          onClick={onNext}
          aria-label="Næste"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-lg leading-none hover:bg-canvas"
        >
          ›
        </button>
        <button
          type="button"
          onClick={onToday}
          className="ml-1 rounded-full border border-line bg-white px-3 py-1.5 text-sm hover:bg-canvas"
        >
          I dag
        </button>
      </div>

      <div className="flex gap-1 rounded-full border border-line bg-white p-1 self-start sm:self-auto">
        {(Object.keys(VIEW_LABELS) as CalendarViewMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onViewChange(mode)}
            className={`rounded-full px-3 py-1.5 text-sm transition ${
              view === mode ? 'bg-accent text-white' : 'text-ink hover:bg-canvas'
            }`}
            aria-pressed={view === mode}
          >
            {VIEW_LABELS[mode]}
          </button>
        ))}
      </div>
    </div>
  );
}
