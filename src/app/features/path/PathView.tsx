/**
 * The course as a path: the days wind down the screen as circles, grouped under a band per week
 * in the programme colour («НЕДЕЛЯ 1 · 3/7»), with today filled in white so it is found without
 * reading anything — the owner's prototype (`design/ui_kits/app-v2`, «Путь по дням»).
 *
 * It was a ruled index — one row per day, thirty identical lines — which is the right shape for a
 * table of contents and the wrong one for a course somebody is walking through. A path says two
 * things a list cannot: how far along you are, at a glance, and that there is an order. The
 * winding comes from the stops taking one of four columns rather than from drawn connectors; the
 * day's name sits in the space the stop leaves beside it, so nothing has to be tapped to be read.
 */
import { useEffect, useMemo, useRef } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Pill } from '@/components/ui/Pill';
import type { Course, CourseNode } from '@/content/schema';
import { useT } from '@/app/hooks/useT';
import { groupNodesByWeek, nodeStatus, type NodeStatus, type PathState } from './nodeState';
import { PATH_COLUMNS, PathNode } from './PathNode';

export interface PathViewProps {
  course: Course;
  state: PathState | null | undefined;
  /** Best stars per node id, from `starsByNode`; absent while the sessions are still loading. */
  stars?: Readonly<Record<string, number>>;
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

export function PathView({ course, state, stars, onNodePress }: PathViewProps) {
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
             * The week's band, bleeding past both gutters, the week on the left and its score on
             * the right — «Неделя 1 · 3/7», plain figures, no zero-padding, as the prototype writes
             * it. It is the one horizontal thing in a screen of stops, which is what makes the
             * weeks readable as chapters rather than as more of the same column.
             *
             * It used to be a band of the programme colour. The third palette keeps a section's
             * colour to tags (global.css header), so the band is a charcoal surface and the week
             * is the tag — a pill of the programme colour with its measured ink.
             */}
            <div className="-mx-6 flex items-center justify-between gap-3 border-y border-border bg-surface px-6 py-2.5 md:-mx-10 md:px-10">
              <div className="flex items-center gap-2">
                <h2 className="flex">
                  <Pill tone="course-fill">{t('app.pathWeek', { n: g.week })}</Pill>
                </h2>
                {g.deload ? <Badge tone="neutral">{t('training.deloadBadge')}</Badge> : null}
              </div>
              <span className="numeral tabular text-[13px] text-muted">
                {done}/{g.nodes.length}
              </span>
            </div>
            <ul className="mt-6 flex flex-col gap-5">
              {g.nodes.map(({ node, index }) => {
                const status = statuses[index] ?? 'locked';
                return (
                  <PathNode
                    key={node.id}
                    node={node}
                    status={status}
                    n={index + 1}
                    column={pathColumn(index)}
                    stars={stars?.[node.id]}
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
