import type { ReactNode } from 'react';

export interface SectionProps {
  title: ReactNode;
  /** Right-aligned slot next to the title (a counter, a link). */
  aside?: ReactNode;
  children: ReactNode;
}

/** Eyebrow-titled block of the Stats and Profile screens. */
export function Section({ title, aside, children }: SectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="eyebrow">{title}</h2>
        {aside ? <span className="tabular text-xs text-muted">{aside}</span> : null}
      </div>
      {children}
    </section>
  );
}
