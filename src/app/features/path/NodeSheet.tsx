/**
 * Bottom sheet for non-workout nodes: a rest day (steps goal, today's steps, log / mark done /
 * skip) or a milestone (mark as reached).
 */
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Glyph } from '@/components/ui/Icon';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Sheet } from '@/components/ui/Sheet';
import type { CourseNode } from '@/content/schema';
import { formatNumber } from '@/i18n/index';
import { STEPS_GOAL } from '@/lib/training/constants';
import { useT } from '@/app/hooks/useT';
import type { NodeStatus } from './nodeState';

export interface NodeSheetProps {
  /** The rest / milestone node shown, or null when closed. */
  node: CourseNode | null;
  status: NodeStatus;
  stepsToday: number;
  busy: boolean;
  onClose: () => void;
  onLogSteps: () => void;
  /** Complete the node (rest day at goal, or "skip" when `skip` is true). */
  onComplete: (skip: boolean) => void;
}

export function NodeSheet({
  node,
  status,
  stepsToday,
  busy,
  onClose,
  onLogSteps,
  onComplete,
}: NodeSheetProps) {
  const { t, l, locale } = useT();
  const open = node !== null;
  const done = status === 'done';
  const isRest = node?.kind === 'rest';
  const goal = node?.stepsGoal ?? STEPS_GOAL;
  const reached = stepsToday >= goal;
  const pct = goal > 0 ? Math.min(1, stepsToday / goal) : 0;

  let hint: string;
  if (done) hint = isRest ? t('app.pathRestAlreadyDone') : t('app.pathMilestoneDone');
  else if (!isRest) hint = t('app.pathMilestoneBody');
  else if (reached) hint = t('app.pathRestDoneHint');
  else hint = t('app.pathRestNeedMore', { n: formatNumber(locale, goal - stepsToday) });

  const footer = isRest ? (
    <div className="flex flex-col gap-2">
      {!done && reached ? (
        <Button size="lg" fullWidth loading={busy} onClick={() => onComplete(false)}>
          {t('app.pathRestMarkDone')}
        </Button>
      ) : null}
      <Button
        size="lg"
        fullWidth
        variant={!done && reached ? 'secondary' : 'primary'}
        disabled={busy}
        onClick={onLogSteps}
      >
        {t('app.pathRestLogSteps')}
      </Button>
      {!done && !reached ? (
        <Button variant="ghost" fullWidth disabled={busy} onClick={() => onComplete(true)}>
          {t('app.pathRestSkip')}
        </Button>
      ) : null}
    </div>
  ) : (
    <Button size="lg" fullWidth loading={busy} disabled={done} onClick={() => onComplete(false)}>
      {done ? t('app.pathMilestoneDone') : t('app.pathMilestoneMark')}
    </Button>
  );

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isRest ? t('app.pathRestTitle') : t('app.pathMilestoneTitle')}
      footer={footer}
    >
      {node ? (
        <div className="flex flex-col gap-4 py-2">
          <div>
            <p className="font-display text-xl">{l(node.title)}</p>
            {node.subtitle ? <p className="mt-1 text-sm text-muted">{l(node.subtitle)}</p> : null}
          </div>
          {isRest ? (
            /*
             * The goal, today's count and the bar on a hairline rather than in a filled box. The
             * bar takes the programme colour — the sheet opens over the course screen, which has
             * set it — and goes green only once the goal is reached.
             */
            <div className="flex flex-col gap-3 border-t border-border pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <Chip size="sm" tone="accent">
                  {t('app.pathRestGoal', { goal: formatNumber(locale, goal) })}
                </Chip>
                <span className="tabular text-sm text-muted">
                  {t('app.pathRestToday', { steps: formatNumber(locale, stepsToday) })}
                </span>
              </div>
              <ProgressBar
                value={pct}
                tone={reached ? 'success' : 'course'}
                label={t('app.pathRestTitle')}
                valueText={`${Math.round(pct * 100)}%`}
              />
            </div>
          ) : null}
          <p className="flex gap-2 text-sm text-muted">
            <Glyph size={12} className="mt-1 shrink-0 text-muted-2">
              //
            </Glyph>
            <span>{hint}</span>
          </p>
        </div>
      ) : null}
    </Sheet>
  );
}
