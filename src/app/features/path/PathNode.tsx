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

const CIRCLE: Record<NodeStatus, string> = {
  done: 'bg-accent text-on-primary',
  current: 'bg-surface-2 text-text ring-4 ring-primary',
  open: 'bg-surface-2 text-text border border-border-strong',
  locked: 'bg-surface-3 text-muted-2',
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

/** One stop on the path: a 72px circle (figure / footprints / trophy / star) plus its label. */
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
            className="absolute -inset-2 animate-pulse rounded-pill border-2 border-primary/60"
          />
        ) : null}
        <button
          ref={buttonRef}
          type="button"
          onClick={onPress}
          aria-label={`${title} — ${t(NODE_STATUS_LABEL[status])}`}
          aria-current={status === 'current' ? 'step' : undefined}
          className={clsx(
            'relative flex size-full items-center justify-center rounded-pill transition-transform active:scale-95',
            CIRCLE[status],
          )}
        >
          {glyph}
          {status === 'done' ? (
            <span className="absolute -bottom-0.5 -right-0.5 flex size-6 items-center justify-center rounded-pill bg-primary text-on-primary ring-2 ring-bg">
              <Icon name="check" size={14} strokeWidth={3} />
            </span>
          ) : null}
        </button>
      </div>
      <div className="flex w-full flex-col items-center text-center">
        <span
          className={clsx(
            'w-full truncate text-[13px] font-semibold',
            status === 'locked' ? 'text-muted' : 'text-text',
          )}
        >
          {title}
        </span>
        {subtitle ? (
          <span className="w-full truncate text-xs text-muted-2">{subtitle}</span>
        ) : null}
      </div>
    </div>
  );
}
