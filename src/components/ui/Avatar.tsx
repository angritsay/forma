import { clsx } from 'clsx';

/**
 * The three monochrome treatments an avatar can have: two surface fills and a hairline outline.
 * Custom properties, not hexes, so they flip with the paper theme — the previous five tiles were
 * literal dark blues and read as blue on white. Kept as literals in JS rather than read from CSS
 * because the pick has to happen synchronously at render.
 */
const TILES = [
  { fill: 'var(--surface-2)', outline: false },
  { fill: 'var(--surface-3)', outline: false },
  { fill: 'transparent', outline: true },
] as const;

export interface AvatarProps {
  /** Seed stored on the profile; picks the treatment so the avatar is stable across devices. */
  seed: string;
  /** Display name (or email) used for the initials. */
  name?: string | null;
  /** Size in px. Default 40. */
  size?: number;
  className?: string;
}

/** FNV-1a over the seed, reduced to an index into TILES. */
function tileIndex(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) % TILES.length;
}

/**
 * The avatar's background for a seed — a CSS colour string.
 *
 * This used to hash to two pastel HSL hues and draw a gradient, then to one of five blue tiles.
 * The brand has no colour of its own now, so the seed picks a monochrome treatment instead. Same
 * input, same avatar, still stable across devices.
 */
export function avatarTile(seed: string): string {
  return TILES[tileIndex(seed)]!.fill;
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

/**
 * A square with the initials set in the display face. No picture, no colour: a list of people
 * varies by surface and outline only, and the type does the identifying.
 */
export function Avatar({ seed, name, size = 40, className }: AvatarProps) {
  const tile = TILES[tileIndex(seed)]!;
  const text = initials(name);
  const label = (name ?? '').trim();
  return (
    <span
      // A nameless avatar is decoration: `role="img"` without an accessible name is a violation.
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      className={clsx(
        'font-display inline-flex shrink-0 select-none items-center justify-center rounded-control text-text',
        tile.outline && 'border border-border-strong',
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.34),
        background: tile.fill,
      }}
    >
      {text}
    </span>
  );
}
