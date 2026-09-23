import { clsx } from 'clsx';
import { Glyph } from '@/components/ui/Icon';
import { Stars } from '@/components/ui/Stars';
import type { CourseNode } from '@/content/schema';
import type { TKey } from '@/i18n/index';
import { useT } from '@/app/hooks/useT';
import type { NodeStatus } from './nodeState';

export const NODE_STATUS_LABEL: Record<NodeStatus, TKey> = {
  done: 'app.pathNodeDone',
  current: 'app.pathNodeCurrent',
  open: 'app.pathNodeOpen',
  locked: 'app.pathNodeLocked',
};

/** The word for a day that is not a plain workout, shown as its line when it has no subtitle. */
const KIND_LABEL: Partial<Record<CourseNode['kind'], TKey>> = {
  rest: 'app.pathRestTitle',
  milestone: 'app.pathMilestoneTitle',
  test: 'app.nodeTestBadge',
  benchmark: 'app.nodeBenchmarkBadge',
};

/** The four positions a stop can take across the column, as a grid column, 1-based. */
export const PATH_COLUMNS = 4;

export interface PathNodeProps {
  node: CourseNode;
  status: NodeStatus;
  /** 1-based position of the day in the course, drawn as its numeral. */
  n: number;
  /** Which of the four columns this stop stands in, 1..4. */
  column: number;
  /** Best stars ever earned here, 0..3; undefined on a day that cannot earn any. */
  stars?: number;
  onPress: () => void;
  buttonRef?: (el: HTMLButtonElement | null) => void;
}

/**
 * One stop on the course path: a circle carrying the day's number, standing in one of four
 * columns so the days wind down the screen, with the day's name set in the space left beside it.
 *
 * The circle says the state in fill rather than in words — the owner's prototype
 * (`design/ui_kits/app-v2`, «Путь по дням»): a finished day is filled in the programme colour
 * and ticked; today is filled in the neon with its number, because the neon is the loudest thing
 * this palette has — the tag it gives «сегодня» — and the one day that has to be found without
 * reading is today; a day still open is
 * outlined; a locked one is outlined and dimmed.
 *
 * It was a square, on the rule that «this brand has no circles». `design/CHANGELOG.md` §10
 * reversed that rule from the prototype: a person or a rank is a circle, and a day on a path is
 * a stop you stand on — the same object as the ranks on the club's board. The square was
 * also the last square-shouldered control left after §8 restored the radii.
 */
export function PathNode({ node, status, n, column, stars, onPress, buttonRef }: PathNodeProps) {
  const { t, l } = useT();
  const title = l(node.title);
  const kindKey = KIND_LABEL[node.kind];
  const line = node.subtitle ? l(node.subtitle) : kindKey ? t(kindKey) : null;

  // The name takes whatever columns the circle leaves, on whichever side has room for it.
  const labelBefore = column > PATH_COLUMNS / 2;
  const labelSpan = labelBefore ? `1 / ${column}` : `${column + 1} / ${PATH_COLUMNS + 1}`;

  return (
    <li className="grid grid-cols-4 items-center gap-x-3">
      <button
        ref={buttonRef}
        type="button"
        onClick={onPress}
        aria-label={`${title} — ${t(NODE_STATUS_LABEL[status])}`}
        aria-current={status === 'current' ? 'step' : undefined}
        style={{ gridColumn: `${column} / ${column + 1}` }}
        className={clsx(
          'flex aspect-square w-full max-w-16 items-center justify-center justify-self-center rounded-pill border-2',
          'transition-transform duration-150 ease-(--ease-out) active:scale-[0.96]',
          status === 'done' && 'hero-art border-course-accent',
          /*
           * Today lands: `.pop-in` is the spring the prototype gives the current stop (there a
           * halo pulses round it), and the one place on this screen the spring is allowed — it is
           * a thing arriving, not content moving. Reduced motion switches it off in global.css.
           */
          /* Today is the neon — «сегодня» is one of the tags the third palette gives it. */
          status === 'current' && 'pop-in border-action bg-action text-on-action',
          status === 'open' && 'border-border-strong text-text',
          status === 'locked' && 'border-border text-muted-2 opacity-50',
        )}
      >
        {status === 'done' ? (
          <Glyph size={22}>✓</Glyph>
        ) : (
          <span
            className={clsx(
              'numeral tabular leading-none',
              status === 'current' ? 'text-[22px]' : 'text-lg',
            )}
          >
            {String(n).padStart(2, '0')}
          </span>
        )}
      </button>
      <span
        style={{ gridColumn: labelSpan }}
        className={clsx(
          'min-w-0',
          labelBefore && 'text-right',
          status === 'locked' && 'opacity-50',
        )}
      >
        {/*
         * Wrapped, not truncated: the stop stands in one of four columns, so the space left for
         * its name is narrow — and «EMOM 8, +2 во 2-м к…» tells an athlete nothing at all. Two
         * lines each is the most the rhythm takes before the stops stop reading as a column.
         */}
        <span className="line-clamp-2 block text-[15px] leading-snug font-semibold">{title}</span>
        {/*
         * One short line in sentence case, not a kicker: «Мосты 5 мин, цель 100» is read, and
         * Cyrillic capitals at 11px are not. On today the line opens with «Сегодня» in the
         * programme colour — the one word of colour in the column, on the one day it is about.
         */}
        {line || status === 'current' ? (
          <span className="mt-1 line-clamp-2 block text-[13px] leading-snug text-muted-2">
            {status === 'current' ? (
              <>
                <span className="font-semibold text-course-accent">
                  {t('app.homeTodayEyebrow')}
                </span>
                {line ? ' · ' : null}
              </>
            ) : null}
            {line}
          </span>
        ) : null}
        {/*
         * Under the name, not in the circle: the circle is 64px and already carries the day's
         * number or its tick, and three stars crammed into it would read as decoration on a
         * control. A day nobody has done yet shows nothing — an empty row of three would promise
         * a grade to somebody who has not sat down yet.
         */}
        {stars !== undefined && stars > 0 ? (
          <Stars
            value={stars}
            className={clsx('mt-1', labelBefore && 'justify-end')}
            label={t('app.pathStars', { n: Math.round(stars * 10) / 10 })}
          />
        ) : null}
      </span>
    </li>
  );
}
