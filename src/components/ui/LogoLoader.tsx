import { clsx } from 'clsx';
import { useKitLabels } from './KitContext';

export interface LogoLoaderProps {
  className?: string;
  /** Accessible label; defaults to the kit "loading" label. */
  label?: string;
}

/**
 * The wordmark, waiting: «FORMA» with a wave of weight running through it.
 *
 * This is what the product shows while something is loading, in place of a turning circle. The
 * brandbook has no circles in it and the mark is already a weight contrast in one word — FOR at
 * 800, MA at 200 — so the honest indicator is that contrast set in motion rather than a shape
 * borrowed from every other website. `Spinner` stays for the places a 16px indicator has to sit
 * inside a button or a row, where a wordmark cannot be read.
 *
 * Each letter is drawn twice. The visible copy takes the animated weight; the hidden copy is
 * pinned at 800 and reserves the column, because a variable weight changes a glyph's advance
 * width and the letters would otherwise shove each other sideways as the crest passed. The
 * animation, the grid and the reduced-motion rest state all live in `.wordmark-wave`
 * (src/styles/global.css), which is also what lets the pre-hydration screen draw this with no
 * JavaScript at all.
 *
 * Size comes from the font-size of the element, exactly as it does for {@link Logo}.
 */
export function LogoLoader({ className, label }: LogoLoaderProps) {
  const labels = useKitLabels();
  return (
    <span
      role="status"
      aria-label={label ?? labels.loading}
      className={clsx('wordmark wordmark-wave inline-flex items-baseline', className)}
    >
      {/* Split per letter, unlike <Logo>'s three spans: the wave needs one element each to
          stagger. The F keeps `.wordmark-f` — the ×1.22 stretch and the wider gap after it are
          the mark, not a detail of how it is set. */}
      {LETTERS.map(([char, letterClass], i) => (
        <span key={i} className={letterClass} aria-hidden="true">
          <span data-reserve="">{char}</span>
          <span>{char}</span>
        </span>
      ))}
    </span>
  );
}

/** «FORMA», with the classes the static mark gives the same letters. */
const LETTERS: readonly (readonly [string, string | undefined])[] = [
  ['F', 'wordmark-f'],
  ['O', undefined],
  ['R', undefined],
  ['M', 'wordmark-thin'],
  ['A', 'wordmark-thin'],
] as const;
