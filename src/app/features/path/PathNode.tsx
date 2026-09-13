import { clsx } from 'clsx';
import { Glyph } from '@/components/ui/Icon';
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

/** The word for a day that is not a plain workout, shown as its kicker when it has no subtitle. */
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
  onPress: () => void;
  buttonRef?: (el: HTMLButtonElement | null) => void;
}

/**
 * One stop on the course path: a square tile carrying the day's number, standing in one of four
 * columns so the days wind down the screen, with the day's name set in the space left beside it.
 *
 * The tile says the state in fill rather than in words. A finished day is filled in the programme
 * colour and ticked; today is filled in paper — white is the loudest thing this palette has, and
 * the one day that has to be found without reading is today; a day still open is outlined; a
 * locked one is outlined and dimmed. No circles and no rounding: the stop is a square, like every
 * other object in the product.
 */
export function PathNode({ node, status, n, column, onPress, buttonRef }: PathNodeProps) {
  const { t, l } = useT();
  const title = l(node.title);
  const kindKey = KIND_LABEL[node.kind];
  const meta = [
    status === 'current' ? t('app.homeTodayEyebrow') : null,
    node.subtitle ? l(node.subtitle) : kindKey ? t(kindKey) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  // The name takes whatever columns the tile leaves, on whichever side has room for it.
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
          'flex aspect-square w-full max-w-16 items-center justify-center justify-self-center border-2',
          'transition-transform duration-150 ease-(--ease-out) active:scale-[0.96]',
          status === 'done' && 'hero-art border-course',
          status === 'current' && 'border-paper bg-paper text-ink',
          status === 'open' && 'border-border-strong text-text',
          status === 'locked' && 'border-border text-muted-2 opacity-55',
        )}
      >
        {status === 'done' ? (
          <Glyph size={20}>✓</Glyph>
        ) : (
          <span className="numeral tabular text-lg leading-none">{String(n).padStart(2, '0')}</span>
        )}
      </button>
      <span
        style={{ gridColumn: labelSpan }}
        className={clsx(
          'min-w-0',
          labelBefore && 'text-right',
          status === 'locked' && 'opacity-55',
        )}
      >
        {/*
         * Wrapped, not truncated: the stop stands in one of four columns, so the space left for
         * its name is narrow — and «EMOM 8, +2 во 2-м к…» tells an athlete nothing at all. Two
         * lines each is the most the rhythm takes before the stops stop reading as a column.
         */}
        <span className="line-clamp-2 block text-[13px] leading-snug font-semibold">{title}</span>
        {meta ? (
          <span
            className={clsx(
              'eyebrow mt-0.5 line-clamp-2 block',
              status === 'current' ? 'text-course' : 'text-muted-2',
            )}
          >
            {meta}
          </span>
        ) : null}
      </span>
    </li>
  );
}
