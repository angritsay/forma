/**
 * The facts of a session as outlined capitals — «3 подхода / 10 повторов / Отдых 60″» in the
 * design system's exercise screen. A hairline frame around a kicker, no fill: these state, they
 * do not select, and the kit's Chip is a control that fills when chosen.
 */
export function FactChips({ items, className }: { items: readonly string[]; className?: string }) {
  if (items.length === 0) return null;
  return (
    <ul className={className ? `flex flex-wrap gap-2.5 ${className}` : 'flex flex-wrap gap-2.5'}>
      {items.map((x) => (
        <li
          key={x}
          className="control-label border border-border-strong px-3.5 py-2.5 text-[11px] text-text"
        >
          {x}
        </li>
      ))}
    </ul>
  );
}
