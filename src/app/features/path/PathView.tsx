/**
 * Duolingo-style winding path: week headers, nodes on a sine offset and a dashed curve behind
 * them. Geometry comes from layout.ts so the DOM and the SVG overlay agree.
 */
import { clsx } from 'clsx';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import type { Course, CourseNode, Exercise } from '@/content/schema';
import { useT } from '@/app/hooks/useT';
import { layoutPath, pathSegments } from './layout';
import { groupNodesByWeek, nodeStatus, type NodeStatus, type PathState } from './nodeState';
import { PathNode } from './PathNode';
import { workoutSignatureExercise } from './plan';

export interface PathViewProps {
  course: Course;
  state: PathState | null | undefined;
  onNodePress: (node: CourseNode, index: number, status: NodeStatus) => void;
}

function useContainerWidth(): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

export function PathView({ course, state, onNodePress }: PathViewProps) {
  const { t } = useT();
  const [ref, width] = useContainerWidth();
  const currentRef = useRef<HTMLButtonElement | null>(null);

  const groups = useMemo(() => groupNodesByWeek(course), [course]);
  const layout = useMemo(
    () => layoutPath(groups, (i) => nodeStatus(i, course.nodes, state)),
    [groups, course, state],
  );
  const exerciseByWorkout = useMemo(() => {
    const map = new Map<string, Exercise | undefined>();
    for (const w of course.workouts) map.set(w.id, workoutSignatureExercise(w));
    return map;
  }, [course]);
  const segments = useMemo(
    () => (width > 0 ? pathSegments(layout.nodes, width / 2) : []),
    [layout, width],
  );

  // Bring the current node into view once the geometry is known.
  const scrolledFor = useRef<string | null>(null);
  useEffect(() => {
    if (width === 0 || scrolledFor.current === course.id) return;
    const el = currentRef.current;
    if (!el) return;
    scrolledFor.current = course.id;
    const id = requestAnimationFrame(() => el.scrollIntoView({ block: 'center' }));
    return () => cancelAnimationFrame(id);
  }, [width, course.id]);

  return (
    <div ref={ref} className="relative w-full" style={{ height: layout.height }}>
      <svg
        className="pointer-events-none absolute inset-0"
        width="100%"
        height={layout.height}
        aria-hidden="true"
      >
        {segments.map((seg, i) => (
          <path
            key={i}
            d={seg.d}
            fill="none"
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray="1 11"
            className={clsx(seg.done ? 'stroke-accent/80' : 'stroke-white/20')}
          />
        ))}
      </svg>
      {layout.rows.map((row) => {
        if (row.kind === 'header') {
          return (
            <div
              key={`w${row.week}`}
              className="absolute inset-x-0 flex items-center justify-between gap-3 px-1"
              style={{ top: row.y, height: 48 }}
            >
              <div className="flex items-center gap-2">
                <span className="font-display text-2xl">{t('app.pathWeek', { n: row.week })}</span>
                {row.deload ? <Badge tone="accent">{t('training.deloadBadge')}</Badge> : null}
              </div>
              <span className="tabular text-xs font-medium text-muted">
                {row.done}/{row.total}
              </span>
            </div>
          );
        }
        const exercise = row.node.workoutId ? exerciseByWorkout.get(row.node.workoutId) : undefined;
        return (
          <PathNode
            key={row.node.id}
            node={row.node}
            status={row.status}
            x={row.x}
            y={row.y}
            exercise={exercise}
            onPress={() => onNodePress(row.node, row.index, row.status)}
            buttonRef={
              row.status === 'current'
                ? (el) => {
                    currentRef.current = el;
                  }
                : undefined
            }
          />
        );
      })}
    </div>
  );
}
