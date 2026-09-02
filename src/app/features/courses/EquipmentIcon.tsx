/**
 * Small equipment pictograms (24×24 grid, 2px strokes) matching the kit's icon style.
 * `none` has no glyph — callers show the text label instead.
 */
import { clsx } from 'clsx';
import type { Equipment } from '@/content/schema';

export const EQUIPMENT_PATHS: Record<Exclude<Equipment, 'none'>, string> = {
  dumbbells: 'M2 9.5v5M22 9.5v5M5 7v10M19 7v10M8 9v6M16 9v6M8 12h8',
  kettlebell: 'M9.5 9.5V6.5a2.5 2.5 0 0 1 5 0v3M12 9.5a6 6 0 1 0 0 12 6 6 0 0 0 0-12z',
  pullup_bar: 'M3 6h18M7 6v6M17 6v6M7 12a5 5 0 0 0 10 0',
  bands: 'M3 12c3-5 6-5 9 0s6 5 9 0',
  jump_rope: 'M6 3v4M18 3v4M6 7c0 10 12 10 12 0',
  box: 'M4 9h16v11H4zM4 9l3-4h10l3 4',
  chair: 'M6 3v9M18 3v9M6 12h12M6 12v9M18 12v9M6 16h12',
  mat: 'M3 8h18v8H3zM7 8v8M11 8v8',
};

export interface EquipmentIconProps {
  equipment: Exclude<Equipment, 'none'>;
  size?: number;
  className?: string;
}

export function EquipmentIcon({ equipment, size = 16, className }: EquipmentIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={clsx('inline-block shrink-0', className)}
    >
      <path
        d={EQUIPMENT_PATHS[equipment]}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
