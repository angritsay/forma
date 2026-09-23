import { clsx } from 'clsx';
import type { ElementType } from 'react';
import { KeyWord } from '@/components/ui/HeroField';
import { splitDisplay } from './displayTitle';

export interface DisplayTitleProps {
  /** The line, as content stores it; split into heavy and light halves here. */
  text: string;
  /** Element to render — the screen's h1 by default. */
  as?: ElementType;
  /** Size utility (`text-5xl`…); the weight and face come from `.display`. */
  className?: string;
  id?: string;
  /**
   * On the blue hero field: the light half becomes the field's key word — light blue with the
   * hand-drawn swoosh under it (`KeyWord`). The two weights stay; the key word is the light half.
   */
  keyed?: boolean;
}

/**
 * The one big line of a screen, set the brand's way: Unbounded 800 capitals for the first word
 * and 200 for the rest — «ПРИСЕД без боли». One per screen; a second competes with it.
 *
 * `.display` sets `hyphens: manual`, so nothing here is ever broken with a hyphen; the `<span>`
 * for the light half is inline so the two weights flow as one sentence and wrap wherever the
 * sentence does.
 */
export function DisplayTitle({
  text,
  as: Tag = 'h1',
  className,
  id,
  keyed = false,
}: DisplayTitleProps) {
  const { head } = splitDisplay(text);
  if (!head) return null;
  return (
    <Tag id={id} className={clsx('display text-balance', className)}>
      <DisplayText text={text} keyed={keyed} />
    </Tag>
  );
}

/** The same split as an inline fragment, for a heading whose element another component owns. */
export function DisplayText({ text, keyed = false }: { text: string; keyed?: boolean }) {
  const { head, tail } = splitDisplay(text);
  if (!head) return null;
  return (
    <>
      {head}
      {tail ? (
        <>
          {' '}
          {keyed ? (
            <KeyWord className="t-thin">{tail}</KeyWord>
          ) : (
            <span className="t-thin">{tail}</span>
          )}
        </>
      ) : null}
    </>
  );
}
