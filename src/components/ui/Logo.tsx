import { clsx } from 'clsx';
import type { HTMLAttributes } from 'react';

export interface LogoProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * With the coach's name: «FORMA // Сергей Титов». The site header and the sign-in screen use
   * it; inside the app the mark stands alone.
   */
  lockup?: boolean;
  /** Accessible name; the letters are decorative once this is set. */
  label?: string;
}

/**
 * The wordmark.
 *
 * «FORMA» in Unbounded — FOR at 800, MA at 200 — with the first F stretched ×1.22 as the anchor
 * letter and a wider gap after it. Heavy into light in one word is the brand's whole typographic
 * idea in miniature, and it is why the mark is three spans and not one string: a single span
 * cannot change weight halfway. Colour is inherited, so the mark is white on the dark ground and
 * ink on paper without being told. There is no full stop any more.
 *
 * Size comes from the font-size of the element or a `text-*` class on it; everything inside is
 * in em.
 */
export function Logo({ lockup = false, label = 'Forma', className, ...rest }: LogoProps) {
  const mark = (
    <span className="wordmark inline-flex items-baseline" aria-hidden={label ? true : undefined}>
      <span className="wordmark-f">F</span>
      <span>OR</span>
      <span className="wordmark-thin">MA</span>
    </span>
  );
  if (!lockup) {
    return (
      <span className={clsx('inline-flex items-baseline', className)} aria-label={label} {...rest}>
        {mark}
      </span>
    );
  }
  return (
    <span
      className={clsx('inline-flex items-baseline gap-[0.6em]', className)}
      aria-label={`${label} — Сергей Титов`}
      {...rest}
    >
      {mark}
      <span className="glyph text-[0.55em] text-muted-2" aria-hidden="true">
        //
      </span>
      <span className="text-[0.68em] font-semibold uppercase tracking-[0.1em] text-muted">
        Сергей Титов
      </span>
    </span>
  );
}
