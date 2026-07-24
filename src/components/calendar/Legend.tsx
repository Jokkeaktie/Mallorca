export function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
      <div className="flex items-center gap-1.5">
        <span
          className="pattern-request inline-block h-4 w-4 rounded border border-black/10"
          style={{ '--pattern-color': '#3A6351' } as React.CSSProperties}
        />
        <span>~ Ønske</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span
          className="pattern-approved inline-block h-4 w-4 rounded border border-black/10"
          style={{ '--pattern-color': '#3A6351' } as React.CSSProperties}
        />
        <span>✓ Godkendt</span>
      </div>
    </div>
  );
}
