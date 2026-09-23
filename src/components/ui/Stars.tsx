/**
 * Three stars, however full they are.
 *
 * The brandbook is black, white and the one programme colour, with glyphs rather than icons — so
 * a star here is a glyph set in the programme colour, not an illustration. It is a star and not
 * some more austere mark because the owner asked for «звёздочки» and every athlete already knows
 * what one means; inventing a house shape for it would make the product harder to read in
 * exchange for nothing.
 *
 * A partial star is drawn by clipping, not by tinting: the filled glyph is laid over the empty one
 * and revealed to the width it earned. Half a star is half a star, visibly, which is the point —
 * a grey star and a gold star at 50% opacity look the same at this size and say different things.
 */
import { clsx } from 'clsx';
import { starMarks, STARS_MAX } from '@/lib/training/stars';

export interface StarsProps {
  /** Earned, 0..3, fractional. */
  value: number;
  /** Glyph size in px. */
  size?: number;
  /** Accessible sentence; the row is one image to a screen reader, never three. */
  label: string;
  className?: string;
}

function Star({ fill, size }: { fill: number; size: number }) {
  return (
    <span
      className="relative inline-block leading-none"
      style={{ width: size, height: size, fontSize: size }}
      aria-hidden="true"
    >
      <span className="absolute inset-0 text-muted-2 opacity-45">★</span>
      {fill > 0 ? (
        <span
          className="absolute inset-0 overflow-hidden text-course-accent"
          style={{ width: `${Math.round(fill * 100)}%` }}
        >
          <span className="block" style={{ width: size }}>
            ★
          </span>
        </span>
      ) : null}
    </span>
  );
}

export function Stars({ value, size = 13, label, className }: StarsProps) {
  const { full, partial } = starMarks(value);
  const fills = Array.from({ length: STARS_MAX }, (_, i) =>
    i < full ? 1 : i === full ? partial : 0,
  );
  return (
    <span
      className={clsx('inline-flex items-center gap-0.5', className)}
      role="img"
      aria-label={label}
    >
      {fills.map((fill, i) => (
        <Star key={i} fill={fill} size={size} />
      ))}
    </span>
  );
}
