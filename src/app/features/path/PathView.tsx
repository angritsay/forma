/**
 * The course as a path: the days wind down the screen as square stops, grouped under a banner per
 * week, with today filled in white so it is found without reading anything.
 *
 * It was a ruled index — one row per day, thirty identical lines — which is the right shape for a
 * table of contents and the wrong one for a course somebody is walking through. A path says two
 * things a list cannot: how far along you are, at a glance, and that there is an order. The
 * winding comes from the stops taking one of four columns rather than from drawn connectors; the
 * day's name sits in the space the stop leaves beside it, so nothing has to be tapped to be read.
 */
import { useEffect, useMemo, useRef } from 'react';
import { Badge } from '@/components/ui/Badge';
import type { Course, CourseNode } from '@/content/schema';
import { useT } from '@/app/hooks/useT';
import { groupNodesByWeek, nodeStatus, type NodeStatus, type PathState } from './nodeState';
import { PATH_COLUMNS, PathNode } from './PathNode';

export interface PathViewProps {
  course: Course;
  state: PathState | null | undefined;
  onNodePress: (node: CourseNode, index: number, status: NodeStatus) => void;
}

/**
 * The column a stop stands in: 1, 2, 3, 4, 3, 2 and round again.
 *
 * A wave rather than a zig-zag between two edges — six steps to a period, so a week of three or
 * four days never repeats the same two positions, and the turn happens at the edges where it
 * reads as a bend rather than as a mistake.
 */
const WAVE = [1, 2, 3, 4, 3, 2] as const;

export function pathColumn(index: number): number {
  return WAVE[((index % WAVE.length) + WAVE.length) % WAVE.length] ?? 1;
}

export function PathView({ course, state, onNodePress }: PathViewProps) {
  const { t } = useT();
  const currentRef = useRef<HTMLButtonElement | null>(null);

  const groups = useMemo(() => groupNodesByWeek(course), [course]);
  const statuses = useMemo(
    () => course.nodes.map((_, i) => nodeStatus(i, course.nodes, state)),
    [course, state],
  );

  // Bring the current day into view once, when the course opens.
  const scrolledFor = useRef<string | null>(null);
  useEffect(() => {
    if (scrolledFor.current === course.id) return;
    const el = currentRef.current;
    if (!el) return;
    scrolledFor.current = course.id;
    const id = requestAnimationFrame(() => el.scrollIntoView({ block: 'center' }));
    return () => cancelAnimationFrame(id);
  }, [course.id]);

  return (
    <div className="flex flex-col gap-8">
      {groups.map((g) => {
        const done = g.nodes.filter(({ index }) => statuses[index] === 'done').length;
        return (
          <section key={g.week}>
            {/*
             * The week's banner: the programme colour, bleeding past both gutters. It is the one
             * horizontal thing in a screen of stops, which is what makes the weeks readable as
             * chapters rather than as more of the same column.
             */}
            <div className="hero-art -mx-5 flex items-baseline justify-between gap-3 px-5 py-3 lg:-mx-8 lg:px-8">
              <div className="flex items-baseline gap-2">
                <h2 className="eyebrow text-current">{t('app.pathWeek', { n: g.week })}</h2>
                {g.deload ? <Badge tone="neutral">{t('training.deloadBadge')}</Badge> : null}
              </div>
              <span className="numeral tabular text-xs text-current opacity-70">
                {String(done).padStart(2, '0')}/{String(g.nodes.length).padStart(2, '0')}
              </span>
            </div>
            <ul className="mt-5 flex flex-col gap-4">
              {g.nodes.map(({ node, index }) => {
                const status = statuses[index] ?? 'locked';
                return (
                  <PathNode
                    key={node.id}
                    node={node}
                    status={status}
                    n={index + 1}
                    column={pathColumn(index)}
                    onPress={() => onNodePress(node, index, status)}
                    buttonRef={
                      status === 'current'
                        ? (el) => {
                            currentRef.current = el;
                          }
                        : undefined
                    }
                  />
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

export { PATH_COLUMNS };
