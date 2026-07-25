const WEEK_ROWS = 5;
const WEEKDAY_LABELS = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];

/**
 * Pulserende placeholder i samme form som månedsgitteret, vist mens
 * kalenderdata hentes. Rent kosmetisk – ingen data, ingen logik.
 */
export function CalendarSkeleton() {
  return (
    <div
      role="status"
      aria-label="Indlæser kalender…"
      className="animate-pulse overflow-hidden rounded-xl2 border border-line bg-white"
    >
      <div className="grid grid-cols-[2.25rem_repeat(7,1fr)] border-b border-line bg-canvas">
        <div className="py-2" />
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="flex items-center justify-center py-2">
            <span className="h-2.5 w-6 rounded-full bg-line" />
          </div>
        ))}
      </div>

      {Array.from({ length: WEEK_ROWS }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid grid-cols-[2.25rem_repeat(7,1fr)] border-b border-line last:border-b-0"
        >
          <div className="border-r border-line bg-canvas" />
          {Array.from({ length: 7 }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="flex min-h-[4.5rem] flex-col gap-1.5 border-r border-line p-1.5 last:border-r-0 sm:min-h-[6rem]"
            >
              <span className="h-5 w-5 rounded-full bg-canvas" />
              {(rowIndex + colIndex) % 3 === 0 && (
                <span className="h-3 w-full rounded bg-canvas" />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
