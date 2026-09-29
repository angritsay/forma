import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { KeyTitle } from '@/components/ui/HeroField';

/**
 * The colour of the type and the chrome on a slide: `light` is white on the blue field and on
 * graphite, `ink` is #111111 on the club's warm gradient — the one ground in the product that
 * carries ink, because no white reads across its beige middle (global.css header, §17).
 */
export type Chrome = 'light' | 'ink';

export interface SlideFrameProps {
  /** The full-bleed ground: `bg-field`, `bg-bg`, `bg-warm`. */
  ground: string;
  chrome: Chrome;
  /** Draw the club's aurora behind the content (graphite only). */
  aurora?: boolean;
  eyebrow: string;
  /** The heading; its last word is the key word, light blue with the swoosh on `light` chrome. */
  title: string;
  /** At most three short lines at 17px. */
  lines: readonly string[];
  /** The one picture: a doodle, two pills, a small live diagram. Decorative; the lines say it. */
  visual: ReactNode;
}

/**
 * One slide's anatomy, the same on all six so the eye learns it once: the visual in the upper
 * half, and at the bottom a kicker, a display line at 34px and up to three lines at 17px. The
 * text sits low the way it does on every stories surface — the thumb covers the bottom third
 * anyway, and the picture is what the first glance lands on.
 *
 * 34px is between the wizard's 28px question (`Question.tsx`) and the club's 40px figure: bigger
 * than a form, because a slide makes a claim and the question makes none, and it still fits two
 * lines of «Нагрузка подстраивается» in a 342px column. Leading 1.15 on a two-line display face;
 * `.display` alone is 1.2 and was drawn for the one-line case.
 *
 * The bottom padding leaves room for the last slide's button whether or not this slide has one,
 * so the text block stands at the same height through the whole set and nothing jumps.
 */
export function SlideFrame({
  ground,
  chrome,
  aurora,
  eyebrow,
  title,
  lines,
  visual,
}: SlideFrameProps) {
  const ink = chrome === 'ink';
  return (
    <div
      className={clsx(
        'absolute inset-0 flex flex-col overflow-hidden',
        ground,
        aurora && 'club-aurora-host',
      )}
    >
      {aurora ? <div className="club-aurora" aria-hidden="true" /> : null}
      <div
        className="flex flex-1 flex-col px-6"
        style={{
          paddingTop: 'calc(var(--safe-top) + 72px)',
          paddingBottom: 'calc(var(--safe-bottom) + 112px)',
        }}
      >
        <div className="flex min-h-0 flex-1 items-center justify-center" aria-hidden="true">
          <div className="pop-in">{visual}</div>
        </div>
        <div className="flex shrink-0 flex-col gap-3">
          {/*
           * The kicker on the field is white at .8 — the site's `--field-kicker`, 5.2 on electric
           * blue — and full ink on the warm gradient, where a dimmed ink would fall under 4.5 on
           * the orange end. On graphite it is the kit's own `.eyebrow`.
           */}
          <span
            className={clsx(
              'eyebrow',
              ink ? 'text-ink' : ground === 'bg-field' && 'text-on-field/80',
            )}
          >
            {eyebrow}
          </span>
          {/*
           * The key word: light blue with the swoosh on white type (`KeyTitle`, style A). On the
           * warm gradient the whole line is plain ink — light blue on beige is 1.3, and
           * `text-gradient` on the gradient itself would be the gradient on the gradient.
           */}
          <h2
            className={clsx(
              'display text-[34px] leading-[1.15] text-balance',
              ink ? 'text-ink' : 'text-on-field',
            )}
          >
            {ink ? title : <KeyTitle text={title} />}
          </h2>
          <div
            className={clsx(
              'flex flex-col gap-1.5 text-[17px] leading-[1.45]',
              ink ? 'text-ink' : ground === 'bg-field' ? 'text-on-field/90' : 'text-text',
            )}
          >
            {lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
