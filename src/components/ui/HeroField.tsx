import { clsx } from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';
import { splitKeyWord } from '@/lib/ui/keyWord';
import { Swoosh, type SwooshTone } from './Swoosh';

export interface HeroFieldProps extends HTMLAttributes<HTMLElement> {
  /** The element it renders as. A `section` by default: the field is the screen's main thing. */
  as?: 'section' | 'div' | 'article';
  /** Padding. `md` is the default card padding; `lg` is for a field that opens a screen. */
  padding?: 'md' | 'lg';
  children?: ReactNode;
}

const PAD = { md: 'p-5', lg: 'px-5 pt-6 pb-5.5' } as const;

/**
 * The blue field — the third palette's hero card (global.css header, style A).
 *
 * **One per screen**, and it holds the thing happening here: the course you are walking, the coach
 * you can book, the result you just earned. Everything secondary sits on a charcoal `Card` below it.
 * Two blue fields on one screen is two «main things», which is none.
 *
 * Type on it is white (7.71 on the field), the key word light blue (`KeyWord`, 5.7), a tag on it is
 * a `Pill` in `white`, `ghost`, `neon` or a section tone. The field itself never becomes type on
 * charcoal — electric blue on the ground is 2.26.
 */
export function HeroField({
  as: Tag = 'section',
  padding = 'md',
  className,
  children,
  ...rest
}: HeroFieldProps) {
  return (
    <Tag
      className={clsx(
        'relative overflow-hidden rounded-card bg-field text-on-field',
        PAD[padding],
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export interface KeyWordProps {
  children: ReactNode;
  /** Draw the hand-drawn underline under it. Default true. */
  swoosh?: boolean;
  swooshTone?: SwooshTone;
  className?: string;
}

/**
 * The key word of a hero field's heading: light blue, with the swoosh under it.
 *
 * `inline-block` so the underline measures the word and not the line; the word therefore does not
 * break inside itself, which is what a key word should do anyway. The swoosh hangs below the
 * baseline in the line's own leading and takes no layout, so a heading with a key word is exactly
 * as tall as the same heading without one.
 */
export function KeyWord({ children, swoosh = true, swooshTone, className }: KeyWordProps) {
  return (
    <span className={clsx('relative inline-block text-accent', className)}>
      {children}
      {swoosh ? (
        <Swoosh
          tone={swooshTone}
          className="pointer-events-none absolute inset-x-0 -bottom-[0.28em] h-[0.3em]"
        />
      ) : null}
    </span>
  );
}

export interface KeyTitleProps {
  /** The heading as one string; its last word becomes the key word. */
  text: string;
  swoosh?: boolean;
  swooshTone?: SwooshTone;
}

/**
 * A heading string with its last word set as the {@link KeyWord}. The split is `splitKeyWord` —
 * the copy is not rewritten to carry markup, so every existing title gets a key word for free and
 * a translator never has to know the device exists.
 */
export function KeyTitle({ text, swoosh, swooshTone }: KeyTitleProps) {
  const [lead, key] = splitKeyWord(text);
  if (!key) return <>{text}</>;
  return (
    <>
      {lead}
      <KeyWord swoosh={swoosh} swooshTone={swooshTone}>
        {key}
      </KeyWord>
    </>
  );
}
