/**
 * Animated exercise figure (SVG stick-athlete rig). CONTRACT — the animation area implements
 * the rig and pose sets; this stub only fixes the public props so other areas can integrate.
 *
 *   <ExerciseFigure animation="air_squat" variant="card" gradient={['#B9F3E0', '#C9D6FF']} />
 *
 * - `animation`: id from src/components/anim/poses (matches Exercise.animation)
 * - `variant`: 'thumb' (64–96px, static first frame, no gradient chrome), 'card' (gradient tile),
 *              'hero' (large, gradient, for the player background / landing hero)
 * - `playing`: animate (default true; 'thumb' defaults to false)
 * - `speed`: playback multiplier (default 1)
 * - `gradient`: [from, to] hex for the tile background; defaults to brand mint → sky
 */
export interface ExerciseFigureProps {
  animation: string;
  variant?: 'thumb' | 'card' | 'hero';
  playing?: boolean;
  speed?: number;
  gradient?: [string, string];
  className?: string;
  /** Accessible label (exercise name in the current locale). */
  label?: string;
}

export default function ExerciseFigure({
  variant = 'card',
  gradient,
  className = '',
  label,
}: ExerciseFigureProps) {
  const [g1, g2] = gradient ?? ['#B9F3E0', '#C9D6FF'];
  const size = variant === 'thumb' ? 72 : variant === 'card' ? 200 : 320;
  return (
    <div
      className={`hero-art overflow-hidden rounded-inner ${className}`}
      style={{
        ['--course-g1' as string]: g1,
        ['--course-g2' as string]: g2,
        width: size,
        height: size,
      }}
      role="img"
      aria-label={label}
    >
      <svg viewBox="0 0 200 200" width="100%" height="100%" aria-hidden="true">
        <circle cx="100" cy="46" r="14" fill="#0B0B0D" />
        <path
          d="M100 60v50M100 80l-26 18M100 80l26 18M100 110l-20 44M100 110l20 44"
          stroke="#0B0B0D"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  );
}
