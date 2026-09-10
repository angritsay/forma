import { clsx } from 'clsx';

/**
 * The five course tiles, repeated here as literals rather than read from CSS: the avatar has to
 * pick one synchronously in JS, and a custom property is only resolvable once the element is in
 * the document. Keep in step with --tile-1…5 in src/styles/global.css.
 */
const TILES = ['#1a2634', '#20293c', '#16202b', '#232f42', '#1c2532'] as const;

export interface AvatarProps {
  /** Seed stored on the profile; picks the tile so the avatar is stable across devices. */
  seed: string;
  /** Display name (or email) used for the initials. */
  name?: string | null;
  /** Size in px. Default 40. */
  size?: number;
  className?: string;
}

/**
 * FNV-1a hash → one of the five course tiles.
 *
 * This used to hash to two pastel HSL hues and draw a gradient. Both halves of that are now off
 * the brand — there are no gradients, and no pastels outside the one blue accent — so the seed
 * picks a tile instead. Same input, same avatar, still stable across devices.
 */
export function avatarTile(seed: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return TILES[(h >>> 0) % TILES.length]!;
}

export function initials(name?: string | null): string {
  const clean = (name ?? '').trim();
  if (!clean) return '';
  const local = clean.includes('@') ? clean.split('@')[0]! : clean;
  const parts = local.split(/[\s._-]+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + second).toUpperCase();
}

export function Avatar({ seed, name, size = 40, className }: AvatarProps) {
  const tile = avatarTile(seed);
  const text = initials(name);
  const label = (name ?? '').trim();
  return (
    <span
      // A nameless avatar is decoration: `role="img"` without an accessible name is a violation.
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      className={clsx(
        'font-display inline-flex shrink-0 select-none items-center justify-center rounded-control font-semibold text-tile-fg',
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.38),
        background: tile,
      }}
    >
      {text}
    </span>
  );
}
