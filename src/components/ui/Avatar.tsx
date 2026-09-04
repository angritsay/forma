import { clsx } from 'clsx';

export interface AvatarProps {
  /** Seed stored on the profile; drives the gradient so the avatar is stable across devices. */
  seed: string;
  /** Display name (or email) used for the initials. */
  name?: string | null;
  /** Diameter in px. Default 40. */
  size?: number;
  className?: string;
}

/** FNV-1a hash → two pastel hues (HSL) for a soft gradient in the brand's "hero art" spirit. */
export function avatarGradient(seed: string): [string, string] {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  const hash = h >>> 0;
  const h1 = hash % 360;
  const h2 = (h1 + 35 + ((hash >>> 9) % 70)) % 360;
  return [`hsl(${h1} 70% 80%)`, `hsl(${h2} 70% 76%)`];
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
  const [g1, g2] = avatarGradient(seed);
  const text = initials(name);
  const label = (name ?? '').trim();
  return (
    <span
      // A nameless avatar is decoration: `role="img"` without an accessible name is a violation.
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      className={clsx(
        'inline-flex shrink-0 select-none items-center justify-center rounded-pill font-semibold text-on-primary',
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.38),
        background: `linear-gradient(135deg, ${g1}, ${g2})`,
      }}
    >
      {text}
    </span>
  );
}
