/**
 * Inline SVG icon set (24×24 grid, 2px strokes, round caps). Icons inherit `currentColor`
 * so they follow the text color of their container. Decorative by default (`aria-hidden`);
 * pass `title` to make an icon meaningful on its own.
 */
import { clsx } from 'clsx';
import type { SVGProps } from 'react';

export const ICON_NAMES = [
  'home',
  'courses',
  'stats',
  'profile',
  'back',
  'close',
  'play',
  'pause',
  'next',
  'prev',
  'check',
  'lock',
  'flame',
  'steps',
  'clock',
  'bolt',
  'trophy',
  'chevron',
  'plus',
  'minus',
  'settings',
  'globe',
  'logout',
  'search',
  'info',
  'warning',
  'edit',
  'star',
  'calendar',
  'refresh',
  'mail',
  'user',
] as const;

export type IconName = (typeof ICON_NAMES)[number];

interface IconDef {
  /** Stroked paths (default). */
  d?: string;
  /** Filled paths (solid glyphs such as play/pause). */
  fill?: string;
}

export const ICONS: Record<IconName, IconDef> = {
  home: { d: 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z' },
  courses: {
    d: 'M4 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM14 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1zM4 15a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM14 15a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1z',
  },
  stats: { d: 'M5 20v-8M12 20V4M19 20v-6' },
  profile: { d: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0' },
  back: { d: 'M15 18l-6-6 6-6' },
  close: { d: 'M6 6l12 12M18 6L6 18' },
  play: { fill: 'M8 5.5v13a1 1 0 0 0 1.5.9l11-6.5a1 1 0 0 0 0-1.8l-11-6.5A1 1 0 0 0 8 5.5z' },
  pause: { fill: 'M6 5h4v14H6zM14 5h4v14h-4z' },
  next: {
    fill: 'M5 6.2v11.6a1 1 0 0 0 1.5.8l9-5.8a1 1 0 0 0 0-1.6l-9-5.8A1 1 0 0 0 5 6.2zM18 5h2v14h-2z',
  },
  prev: {
    fill: 'M19 6.2v11.6a1 1 0 0 1-1.5.8l-9-5.8a1 1 0 0 1 0-1.6l9-5.8a1 1 0 0 1 1.5.8zM4 5h2v14H4z',
  },
  check: { d: 'M5 12.5l4.5 4.5L19 7.5' },
  lock: { d: 'M6 11h12v9a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1zM8 11V7a4 4 0 0 1 8 0v4' },
  flame: {
    d: 'M12 3c.6 3.2 3.4 4.6 4.6 7.6.9 2.4.3 5-1.7 6.6A6 6 0 0 1 6.4 13c0-1.6.7-3 1.6-4.2.2 1.2.9 2.2 1.9 2.7-.3-2.6.5-5.4 2.1-8.5z',
  },
  steps: {
    fill: 'M9 2.5c1.9 0 3 2.3 3 5.3S10.9 13 9 13 6 10.8 6 7.8s1.1-5.3 3-5.3zM7.5 14.5h3l-.4 3.1a1.1 1.1 0 0 1-2.2 0zM15 7c1.9 0 3 2.3 3 5.3S16.9 17.5 15 17.5 12 15.3 12 12.3 13.1 7 15 7zM13.5 19h3l-.4 2.6a1.1 1.1 0 0 1-2.2 0z',
  },
  clock: { d: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3.5 2' },
  bolt: { d: 'M13 2L4.5 13.5H11l-1 8.5 8.5-11.5H13z' },
  trophy: {
    d: 'M7 4h10v5a5 5 0 0 1-10 0zM7 6H4.5a2.5 2.5 0 0 0 2.5 4M17 6h2.5a2.5 2.5 0 0 1-2.5 4M12 14v3M8 21h8M10 17h4v4h-4z',
  },
  chevron: { d: 'M9 6l6 6-6 6' },
  plus: { d: 'M12 5v14M5 12h14' },
  minus: { d: 'M5 12h14' },
  settings: {
    d: 'M4 7h8M16 7h4M4 12h2M10 12h10M4 17h9M17 17h3M14 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM8 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM15 15a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  },
  globe: {
    d: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z',
  },
  logout: { d: 'M14 8l4 4-4 4M18 12H8M11 4H5v16h6' },
  search: { d: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4' },
  info: { d: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 7.8v.4' },
  warning: { d: 'M12 3.5L21.5 20h-19zM12 10v4M12 17.2v.4' },
  edit: { d: 'M4 20h4.5L19 9.5 14.5 5 4 15.5zM12.5 7l4.5 4.5' },
  star: {
    d: 'M12 3l2.8 5.9 6.4.9-4.6 4.5 1.1 6.4L12 17.7l-5.7 3 1.1-6.4L2.8 9.8l6.4-.9z',
  },
  calendar: { d: 'M4 6h16v14H4zM4 10.5h16M8 3v4M16 3v4' },
  refresh: { d: 'M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5' },
  mail: { d: 'M3 6h18v12H3zM3 7l9 6 9-6' },
  user: { d: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0' },
};

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  /** Pixel size (width = height). Default 20. */
  size?: number;
  /** Stroke width for outlined icons. Default 2. */
  strokeWidth?: number;
  /** Accessible name; when omitted the icon is decorative. */
  title?: string;
}

export function Icon({ name, size = 20, strokeWidth = 2, title, className, ...rest }: IconProps) {
  const def = ICONS[name];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={clsx('inline-block shrink-0', className)}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {def.fill ? <path d={def.fill} fill="currentColor" /> : null}
      {def.d ? (
        <path
          d={def.d}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
    </svg>
  );
}
