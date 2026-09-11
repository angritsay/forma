/**
 * The course as a ruled index: one kicker per week, one row per day. Rows are lines, not stops
 * on a curve — the winding path with its dashed connectors is gone with the previous brandbook.
 */
import { useEffect, useMemo, useRef } from 'react';
import { Badge } from '@/components/ui/Badge';
import type { Course, CourseNode } from '@/content/schema';
import { useT } from '@/app/hooks/useT';
import { groupNodesByWeek, nodeStatus, type NodeStatus, type PathState } from './nodeState';
import { PathNode } from './PathNode';

export interface PathViewProps {
  course: Course;
  state: PathState | null | undefined;
  onNodePress: (node: CourseNode, index: number, status: NodeStatus) => void;
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
    <div className="flex flex-col gap-7">
      {groups.map((g) => {
        const done = g.nodes.filter(({ index }) => statuses[index] === 'done').length;
        return (
          <section key={g.week}>
            <div className="flex items-baseline justify-between gap-3">
              <div className="flex items-baseline gap-2">
                <h2 className="eyebrow">{t('app.pathWeek', { n: g.week })}</h2>
                {g.deload ? <Badge tone="neutral">{t('training.deloadBadge')}</Badge> : null}
              </div>
              <span className="numeral tabular text-xs text-muted">
                {String(done).padStart(2, '0')}/{String(g.nodes.length).padStart(2, '0')}
              </span>
            </div>
            <ul className="mt-1">
              {g.nodes.map(({ node, index }) => {
                const status = statuses[index] ?? 'locked';
                return (
                  <PathNode
                    key={node.id}
                    node={node}
                    status={status}
                    n={index + 1}
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
