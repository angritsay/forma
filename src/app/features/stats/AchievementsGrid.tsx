import { clsx } from 'clsx';
import { Glyph } from '@/components/ui/Icon';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { AchievementStatus } from '@/lib/training/types';
import { useT } from '@/app/hooks/useT';

/**
 * One achievement: numbered rather than pictured.
 *
 * The emoji that content stores against an achievement (`a.icon`) is not drawn — the brand keeps no
 * coloured pictograms in the interface, and a grid of twelve of them was the most colourful thing
 * in the app. The numeral and the title do the identifying; the white fill behind the numeral says
 * "earned".
 */
function AchievementTile({ item, n }: { item: AchievementStatus; n: number }) {
  const { t, l } = useT();
  return (
    <div
      className={clsx(
        'flex h-full flex-col gap-3 rounded-tile border p-4',
        item.unlocked ? 'border-border-strong' : 'border-border',
      )}
      aria-label={`${l(item.title)} — ${
        item.unlocked ? t('app.statsAchievementUnlocked') : t('app.statsAchievementLocked')
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          aria-hidden="true"
          className={clsx(
            /*
             * `--r-inner`, not `--r-tile`: this numeral sits inside the tile's own 16px padding,
             * and a concentric inner radius is the outer one minus that padding. Matching the
             * tile's 20px here would read as a bubble rather than as a stamp.
             */
            'numeral flex h-8 min-w-8 items-center justify-center rounded-inner px-1.5 text-sm',
            item.unlocked
              ? 'bg-primary text-on-primary'
              : 'border border-border-strong text-muted-2',
          )}
        >
          {String(n).padStart(2, '0')}
        </span>
        {item.unlocked ? <Glyph size={16}>✓</Glyph> : null}
      </div>
      <div className="flex flex-col gap-1">
        <span
          className={clsx('font-display text-[13px] leading-[1.3]', !item.unlocked && 'text-muted')}
        >
          {l(item.title)}
        </span>
        <span className="text-xs text-muted">{l(item.description)}</span>
      </div>
      {!item.unlocked ? (
        <ProgressBar
          value={item.progress}
          size="sm"
          tone="primary"
          label={l(item.title)}
          valueText={`${Math.round(item.progress * 100)}%`}
          className="mt-auto pt-1"
        />
      ) : null}
    </div>
  );
}

/**
 * What has been earned, and — behind it — what has not.
 *
 * Twelve tiles in a two-column grid meant that on nearly every athlete's screen ten of them were
 * grey: a wall of things you have not done, under the heading of your achievements. So the earned
 * ones keep the grid, and the rest go into a row that is swiped sideways — present, countable,
 * still showing their progress, and no longer the larger half of the section.
 *
 * The locked row is a plain horizontal scroller rather than a component with a state machine: it
 * has no "current" card, nothing snaps, and a keyboard reaches every tile by tabbing through it.
 */
export function AchievementsGrid({ items }: { items: readonly AchievementStatus[] }) {
  const { t } = useT();
  /* The numeral is the achievement's position in the whole set, not in the half it landed in. */
  const numbered = items.map((item, i) => ({ item, n: i + 1 }));
  const unlocked = numbered.filter(({ item }) => item.unlocked);
  const locked = numbered.filter(({ item }) => !item.unlocked);

  return (
    <div className="flex flex-col gap-4">
      {unlocked.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3">
          {unlocked.map(({ item, n }) => (
            <li key={item.id}>
              <AchievementTile item={item} n={n} />
            </li>
          ))}
        </ul>
      ) : null}

      {locked.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h3 className="eyebrow text-muted-2">{t('app.statsAchievementsLocked')}</h3>
          <ul className="deck-scroller -mx-6 flex gap-3 overflow-x-auto px-6 lg:-mx-10 lg:px-10">
            {locked.map(({ item, n }) => (
              <li key={item.id} className="w-[46%] max-w-[220px] shrink-0">
                <AchievementTile item={item} n={n} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
