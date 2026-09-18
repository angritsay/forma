/**
 * What has been earned, as a row of big circles — «Взято» in the owner's prototype
 * (`design/ui_kits/app-v2`, «Ты»).
 *
 * An earned achievement is a white circle with its own emoji in it and its name under it, and it
 * lands on the spring, one after another. The rest follow in the same row, swiped sideways: a hairline ring
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
import { RingProgress } from '@/components/ui/RingProgress';
import type { AchievementStatus } from '@/lib/training/types';
import { useT } from '@/app/hooks/useT';

/** Circle diameter. The prototype's badges are 80px; the name under them is what needs the column. */
const SIZE = 80;

/**
 * What a taken achievement shows inside its white circle: its own emoji.
 *
 * `lib/training/levels.ts` has defined one per achievement since the rules were written — 🏁 🔥 💪
 * 💯 ⚡ 📅 🗓️ 🚶 📏 🎓 🥉 🥇 ⏱️ — `evaluateAchievements` carries it into `AchievementStatus.icon`,
 * and until now nothing in the app read the field. The catalogue drew thirteen identical circles
 * with a numeral in each, which is a list of things you do not have with nothing to tell them
 * apart. The emoji is what makes «Сотня» and «Ходок» two different objects.
 *
 * It is the one place in the product besides the count pill where an emoji earns its keep, and
 * the reason is that it cannot be drawn in our kit: an emoji renders in the system's colour font,
 * in nobody's brand colour, so it reads as a thing *earned* rather than as a metric. That is also
 * why the locked rows keep their numeral — the emoji then **is** the difference between "not yet"
 * and "got it", and not another opacity.
 *
 * The circle and the ring are still the structure; the emoji is only the fill. Where a platform
 * draws the glyph flat and monochrome, the figure still reads, because the figure was never the
 * emoji. We do not feature-detect that: every published trick for asking a browser whether it drew
 * colour is slow and wrong somewhere.
 *
 * `size` is explicit because inside a circle the emoji is a fill, not a neighbour, so `.emoji`'s
 * cap-height-matched `.78em` default has nothing to match against.
 */
function AchievementMark({ item, size }: { item: AchievementStatus; size: number }) {
  return (
    <span aria-hidden="true" className="emoji" style={{ fontSize: size }}>
      {/* A missing emoji falls back to the tick this circle carried before. */}
      {item.icon || '✓'}
    </span>
  );
}

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
          <AchievementMark item={item} size={30} />
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

/**
 * The same achievement as a row, for the catalogue.
 *
 * The shelf above shows a circle and a name and keeps the rule in a `title` attribute, which is
 * the right trade for a row you swipe past — and the wrong one for the screen the owner asked for:
 * «Достижения открывают каталог достижений». A catalogue of grey circles with no rule attached is
 * a list of things you have not done and no way to do them. So here the rule is the row: the
 * figure on the left, what it is called, and what earns it, printed.
 *
 * It is the same figure at half the size: white with the achievement's own emoji when it is taken,
 * the hairline ring with its numeral filling as the athlete gets closer when it is not. One
 * achievement, one appearance — and thirteen rows that are finally thirteen different things.
 */
function AchievementRow({ item, n }: { item: AchievementStatus; n: number }) {
  const { t, l } = useT();
  const ROW = 48;
  return (
    <li className="flex items-center gap-4 border-t border-border py-4">
      {item.unlocked ? (
        <span
          aria-hidden="true"
          className="flex shrink-0 items-center justify-center rounded-pill bg-paper text-ink"
          style={{ width: ROW, height: ROW }}
        >
          <AchievementMark item={item} size={20} />
        </span>
      ) : (
        <RingProgress
          value={item.progress}
          size={ROW}
          stroke={2}
          tone="primary"
          className="shrink-0"
        >
          <span className="numeral tabular text-[12px] text-muted-2">
            {String(n).padStart(2, '0')}
          </span>
        </RingProgress>
      )}
      <div className="flex min-w-0 flex-col gap-1">
        <span
          className={clsx('font-display text-[15px] leading-snug', !item.unlocked && 'text-muted')}
        >
          {l(item.title)}
        </span>
        {/* The rule, and the reason this screen exists. */}
        <span className="text-[13px] leading-snug text-muted-2">{l(item.description)}</span>
      </div>
      <span className="sr-only">
        {item.unlocked ? t('app.statsAchievementUnlocked') : t('app.statsAchievementLocked')}
      </span>
    </li>
  );
}

/** Every achievement there is, taken first, each with the rule that earns it. */
export function AchievementList({ items }: { items: readonly AchievementStatus[] }) {
  const numbered = items.map((item, i) => ({ item, n: i + 1 }));
  const ordered = [
    ...numbered.filter(({ item }) => item.unlocked),
    ...numbered.filter(({ item }) => !item.unlocked),
  ];
  return (
    <ul className="flex flex-col border-b border-border">
      {ordered.map(({ item, n }) => (
        <AchievementRow key={item.id} item={item} n={n} />
      ))}
    </ul>
  );
}
