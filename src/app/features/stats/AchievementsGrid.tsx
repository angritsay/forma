import { clsx } from 'clsx';
import { Glyph } from '@/components/ui/Icon';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { AchievementStatus } from '@/lib/training/types';
import { useT } from '@/app/hooks/useT';

/**
 * Two-column grid of square tiles: unlocked achievements marked with a tick, locked ones muted
 * with their progress.
 *
 * Each tile is numbered 01/02/03 rather than pictured. The emoji that content stores against an
 * achievement (`a.icon`) is not drawn: the brand keeps no coloured pictograms in the interface,
 * and a grid of twelve of them was the most colourful thing in the app. The numeral and the
 * title do the identifying; the white fill behind the numeral says "earned".
 */
export function AchievementsGrid({ items }: { items: readonly AchievementStatus[] }) {
  const { t, l } = useT();
  return (
    <ul className="grid grid-cols-2 gap-3">
      {items.map((a, i) => (
        <li key={a.id}>
          <div
            className={clsx(
              'flex h-full flex-col gap-3 border p-4',
              a.unlocked ? 'border-border-strong' : 'border-border',
            )}
            aria-label={`${l(a.title)} — ${
              a.unlocked ? t('app.statsAchievementUnlocked') : t('app.statsAchievementLocked')
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span
                aria-hidden="true"
                className={clsx(
                  'numeral flex h-8 min-w-8 items-center justify-center px-1.5 text-sm',
                  a.unlocked
                    ? 'bg-primary text-on-primary'
                    : 'border border-border-strong text-muted-2',
                )}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              {a.unlocked ? <Glyph size={16}>✓</Glyph> : null}
            </div>
            <div className="flex flex-col gap-1">
              <span
                className={clsx(
                  'font-display text-[13px] leading-[1.3]',
                  !a.unlocked && 'text-muted',
                )}
              >
                {l(a.title)}
              </span>
              <span className="text-xs text-muted">{l(a.description)}</span>
            </div>
            {!a.unlocked ? (
              <ProgressBar
                value={a.progress}
                size="sm"
                tone="primary"
                label={l(a.title)}
                valueText={`${Math.round(a.progress * 100)}%`}
                className="mt-auto pt-1"
              />
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
