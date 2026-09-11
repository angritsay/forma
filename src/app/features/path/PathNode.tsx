import { clsx } from 'clsx';
import type { CSSProperties } from 'react';
import ExerciseFigure from '@/components/anim/ExerciseFigure';
import { Icon, type IconName } from '@/components/ui/Icon';
import type { CourseNode, Exercise } from '@/content/schema';
import type { TKey } from '@/i18n/index';
import { useT } from '@/app/hooks/useT';
import { NODE_SIZE } from './layout';
import type { NodeStatus } from './nodeState';

export const NODE_LABEL_W = 152;

export const NODE_STATUS_LABEL: Record<NodeStatus, TKey> = {
  done: 'app.pathNodeDone',
  current: 'app.pathNodeCurrent',
  open: 'app.pathNodeOpen',
  locked: 'app.pathNodeLocked',
};

/**
 * The four states of a stop on the path.
 *
 * These were circles. They are 20px-radius tiles now — the same shape as the course art, so a day
 * on the path and the course it belongs to read as one family of object. Only `current` carries
 * the accent, which is what makes "you are here" findable in a column of thirty stops; `done`
 * recedes to a filled surface rather than claiming the blue for every day already behind you.
 */
const TILE: Record<NodeStatus, string> = {
  done: 'bg-surface-2 text-muted border border-border',
  current: 'bg-surface-2 text-text ring-2 ring-accent',
  open: 'bg-transparent text-text border border-border-strong',
  locked: 'bg-transparent text-muted-2 border border-border',
};

const KIND_ICON: Record<Exclude<CourseNode['kind'], 'workout'>, IconName> = {
  rest: 'steps',
  test: 'trophy',
  benchmark: 'trophy',
  milestone: 'star',
};

export interface PathNodeProps {
  node: CourseNode;
  status: NodeStatus;
  /** Horizontal offset from the centre line, px. */
  x: number;
  /** Centre of the circle, px from the top of the path. */
  y: number;
  /** Exercise whose figure is the thumbnail (workout nodes). */
  exercise?: Exercise | undefined;
  onPress: () => void;
  buttonRef?: (el: HTMLButtonElement | null) => void;
}

/** One stop on the path: a 72px tile (figure / footprints / trophy / star) plus its label. */
export function PathNode({ node, status, x, y, exercise, onPress, buttonRef }: PathNodeProps) {
  const { t, l } = useT();
  const title = l(node.title);
  const subtitle = node.subtitle ? l(node.subtitle) : undefined;
  const style: CSSProperties = {
    top: y - NODE_SIZE / 2,
    left: '50%',
    width: NODE_LABEL_W,
    transform: `translateX(calc(-50% + ${x}px))`,
  };

  let glyph: React.ReactNode;
  if (status === 'locked') {
    glyph = <Icon name="lock" size={28} />;
  } else if (node.kind === 'workout') {
    glyph = (
      <ExerciseFigure
        animation={exercise?.animation ?? 'air_squat'}
        variant="thumb"
        className="size-11"
      />
    );
  } else {
    glyph = <Icon name={KIND_ICON[node.kind]} size={30} />;
  }

  return (
    <div className="absolute flex flex-col items-center gap-2" style={style}>
      <div className="relative" style={{ width: NODE_SIZE, height: NODE_SIZE }}>
        {status === 'current' ? (
          <span
            aria-hidden="true"
            className="absolute -inset-2 animate-pulse rounded-[28px] border border-accent/60"
          />
        ) : null}
        <button
          ref={buttonRef}
          type="button"
          onClick={onPress}
          aria-label={`${title} — ${t(NODE_STATUS_LABEL[status])}`}
          aria-current={status === 'current' ? 'step' : undefined}
          className={clsx(
            'relative flex size-full items-center justify-center rounded-tile transition-transform active:scale-95',
            TILE[status],
          )}
        >
          {glyph}
          {status === 'done' ? (
            <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-control bg-accent text-on-primary">
              <Icon name="check" size={12} strokeWidth={3} />
            </span>
          ) : null}
        </button>
      </div>
      <div className="flex w-full flex-col items-center text-center">
        <span
          className={clsx(
            'font-display w-full truncate text-[13px] leading-[1.24]',
            status === 'locked' ? 'text-muted' : 'text-text',
          )}
        >
          {title}
        </span>
        {subtitle ? <span className="w-full truncate text-xs text-muted-2">{subtitle}</span> : null}
      </div>
    </div>
  );
}
