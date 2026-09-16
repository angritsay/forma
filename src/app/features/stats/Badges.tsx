/**
 * What has been earned, as a row of big circles — «Взято» in the owner's prototype
 * (`design/ui_kits/app-v2`, «Ты»).
 *
 * An earned achievement is a white circle with a check and its name under it, and it lands on the
 * spring, one after another. The rest follow in the same row, swiped sideways: a hairline ring
 * with the achievement's number in it, the ring filling as the athlete gets closer, so what is
 * left to take is visible without a wall of grey tiles saying so. The description that used to
 * be printed on every tile is the circle's `title` and its accessible name now — a tile with a
 * numeral, a name, two lines of body and a bar was the most text on the tab, and the owner's
 * whole note was «МИНИМУМ текста».
 *
 * `BadgeCircle` is exported on its own because «Готово!» draws freshly earned achievements with
 * the same figure: an achievement should look the same the moment it is taken and on the shelf.
 */
import { clsx } from 'clsx';
import { Glyph } from '@/components/ui/Icon';
import { RingProgress } from '@/components/ui/RingProgress';
import type { AchievementStatus } from '@/lib/training/types';
import { useT } from '@/app/hooks/useT';

/** Circle diameter. The prototype's badges are 80px; the name under them is what needs the column. */
const SIZE = 80;

export interface BadgeCircleProps {
  item: AchievementStatus;
  /** Position in the whole set, drawn inside a locked ring. */
  n: number;
  /** Order of landing among the earned ones; each waits 45ms longer than the one before. */
  delay?: number;
}

export function BadgeCircle({ item, n, delay = 0 }: BadgeCircleProps) {
  const { t, l } = useT();
  const title = l(item.title);
  const description = l(item.description);
  return (
    <div
      className="flex w-22 flex-col items-center gap-2.5"
      role="img"
      aria-label={`${title} — ${description}. ${
        item.unlocked ? t('app.statsAchievementUnlocked') : t('app.statsAchievementLocked')
      }`}
      title={description}
    >
      {item.unlocked ? (
        <span
          className="pop-in flex items-center justify-center rounded-pill bg-paper text-ink"
          style={{ width: SIZE, height: SIZE, animationDelay: `${delay}ms` }}
        >
          <Glyph size={24}>✓</Glyph>
        </span>
      ) : (
        /*
         * The ring's track is the hairline the prototype outlines a locked badge with, and the
         * white arc on it is the progress that used to be a bar under two lines of text.
         */
        <RingProgress value={item.progress} size={SIZE} stroke={2} tone="primary">
          <span className="numeral tabular text-[13px] text-muted-2">
            {String(n).padStart(2, '0')}
          </span>
        </RingProgress>
      )}
      <span
        className={clsx(
          'line-clamp-2 text-center text-[12px] leading-[1.25] font-semibold',
          !item.unlocked && 'text-muted-2',
        )}
        aria-hidden="true"
      >
        {title}
      </span>
    </div>
  );
}

/** Every achievement in one row swiped sideways: the earned ones first, then what is left. */
export function Badges({ items }: { items: readonly AchievementStatus[] }) {
  const numbered = items.map((item, i) => ({ item, n: i + 1 }));
  const ordered = [
    ...numbered.filter(({ item }) => item.unlocked),
    ...numbered.filter(({ item }) => !item.unlocked),
  ];
  return (
    <ul className="deck-scroller -mx-6 flex gap-3 overflow-x-auto px-6 pb-1 md:-mx-10 md:px-10">
      {ordered.map(({ item, n }, i) => (
        <li key={item.id} className="shrink-0">
          <BadgeCircle item={item} n={n} delay={item.unlocked ? i * 45 : 0} />
        </li>
      ))}
    </ul>
  );
}
