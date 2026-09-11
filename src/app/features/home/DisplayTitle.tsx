import { clsx } from 'clsx';
import type { ElementType } from 'react';
import { splitDisplay } from './displayTitle';

export interface DisplayTitleProps {
  /** The line, as content stores it; split into heavy and light halves here. */
  text: string;
  /** Element to render — the screen's h1 by default. */
  as?: ElementType;
  /** Size utility (`text-5xl`…); the weight and face come from `.display`. */
  className?: string;
  id?: string;
}

/**
 * The one big line of a screen, set the brand's way: Unbounded 800 capitals for the first word
 * and 200 for the rest — «ПРИСЕД без боли». One per screen; a second competes with it.
 *
 * `hyphens: auto` comes with `.display`, so a long Russian word wraps at a syllable rather than
 * overflowing the 390px column; the `<span>` for the light half is inline so the two weights flow
 * as one sentence and wrap wherever the sentence does.
 */
export function DisplayTitle({ text, as: Tag = 'h1', className, id }: DisplayTitleProps) {
  const { head, tail } = splitDisplay(text);
  if (!head) return null;
  return (
    <Tag id={id} className={clsx('display text-balance', className)}>
      {head}
      {tail ? (
        <>
          {' '}
          <span className="t-thin">{tail}</span>
        </>
      ) : null}
    </Tag>
  );
}

/** The same split as an inline fragment, for a heading whose element another component owns. */
export function DisplayText({ text }: { text: string }) {
  const { head, tail } = splitDisplay(text);
  if (!head) return null;
  return (
    <>
      {head}
      {tail ? (
        <>
          {' '}
          <span className="t-thin">{tail}</span>
        </>
      ) : null}
    </>
  );
}
