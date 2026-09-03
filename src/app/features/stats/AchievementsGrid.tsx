import { clsx } from 'clsx';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { AchievementStatus } from '@/lib/training/types';
import { useT } from '@/app/hooks/useT';

/** Two-column grid: unlocked badges in full color, locked ones muted with their progress. */
export function AchievementsGrid({ items }: { items: readonly AchievementStatus[] }) {
  const { t, l } = useT();
  return (
    <ul className="grid grid-cols-2 gap-3">
      {items.map((a) => (
        <li key={a.id}>
          <Card
            level={2}
            padding="sm"
            className={clsx('flex h-full flex-col gap-2', a.unlocked && 'border-accent/40')}
            aria-label={`${l(a.title)} — ${
              a.unlocked ? t('app.statsAchievementUnlocked') : t('app.statsAchievementLocked')
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={clsx(
                  'flex size-10 items-center justify-center rounded-pill text-xl',
                  a.unlocked ? 'bg-accent/15' : 'bg-surface-3 grayscale',
                )}
              >
                <span aria-hidden="true">{a.icon}</span>
              </span>
              {a.unlocked ? (
                <span className="flex size-6 items-center justify-center rounded-pill bg-success/20 text-success">
                  <Icon name="check" size={14} strokeWidth={3} />
                </span>
              ) : null}
            </div>
            <span className={clsx('text-[15px] font-semibold', !a.unlocked && 'text-muted')}>
              {l(a.title)}
            </span>
            <span className="text-xs text-muted">{l(a.description)}</span>
            {!a.unlocked ? (
              <ProgressBar
                value={a.progress}
                size="sm"
                tone="accent"
                label={l(a.title)}
                valueText={`${Math.round(a.progress * 100)}%`}
                className="mt-auto pt-1"
              />
            ) : null}
          </Card>
        </li>
      ))}
    </ul>
  );
}
