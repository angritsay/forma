import type { ReactNode } from 'react';

export interface SectionProps {
  title: ReactNode;
  /** Right-aligned slot next to the title (a counter, a link). */
  aside?: ReactNode;
  children: ReactNode;
}

/**
 * Titled block of the Stats and Profile screens.
 *
 * A display heading opposite its aside over a hairline — the same header the course index and the
 * home sections use, so the four screens read as one document rather than as four layouts that
 * happen to share a colour scheme.
 */
export function Section({ title, aside, children }: SectionProps) {
  return (
    <section className="flex flex-col">
      <div className="flex items-baseline justify-between gap-3 border-t border-border pt-5 pb-2">
        <h2 className="font-display text-xl">{title}</h2>
        {aside ? <span className="eyebrow">{aside}</span> : null}
      </div>
      {children}
    </section>
  );
}
