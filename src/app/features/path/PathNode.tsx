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

export interface PathNodeProps {
  node: CourseNode;
  status: NodeStatus;
  /** 1-based position of the day in the course, drawn as its numeral. */
  n: number;
  onPress: () => void;
  buttonRef?: (el: HTMLButtonElement | null) => void;
}

/**
 * One day of the course as a ruled row: its number, its name with a kicker under it, and a mark
 * on the right. The row carries the whole state in type: the current day is the only one whose
 * number takes the programme colour and the only one ruled off in it; a finished day ends in a
 * tick, the current one in an arrow, and a locked one is dimmed. No tiles, no circles, no
 * pictograms — a column of thirty days has to read as an index, and an index is numbers and words.
 */
export function PathNode({ node, status, n, onPress, buttonRef }: PathNodeProps) {
  const { t, l } = useT();
  const title = l(node.title);
  const kindKey = KIND_LABEL[node.kind];
  const meta = [
    status === 'current' ? t('app.homeTodayEyebrow') : null,
    node.subtitle ? l(node.subtitle) : kindKey ? t(kindKey) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <li>
      <button
        ref={buttonRef}
        type="button"
        onClick={onPress}
        aria-label={`${title} — ${t(NODE_STATUS_LABEL[status])}`}
        aria-current={status === 'current' ? 'step' : undefined}
        className={clsx(
          'grid w-full grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3.5 border-b py-3.5 text-left',
          'transition-colors duration-150 ease-(--ease-out) hover:bg-surface',
          status === 'current' ? 'border-course' : 'border-border',
          status === 'locked' && 'opacity-50',
        )}
      >
        <span
          className={clsx(
            'numeral tabular text-lg leading-none',
            status === 'current' ? 'text-course' : 'text-muted',
          )}
        >
          {String(n).padStart(2, '0')}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-semibold">{title}</span>
          {meta ? (
            <span
              className={clsx(
                'eyebrow mt-0.5 block truncate',
                status === 'current' ? 'text-course' : 'text-muted-2',
              )}
            >
              {meta}
            </span>
          ) : null}
        </span>
        <span className="flex w-5 justify-end">
          {status === 'done' ? (
            <Glyph size={16} className="text-course">
              ✓
            </Glyph>
          ) : status === 'current' ? (
            <Glyph size={16}>→</Glyph>
          ) : null}
        </span>
      </button>
    </li>
  );
}
