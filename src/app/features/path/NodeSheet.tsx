/**
 * Bottom sheet for non-workout nodes: a rest day, or a milestone (mark as reached).
 *
 * A rest day used to be a target — «Цель: 7 000 шагов», today's count, a progress bar and a
 * «Записать шаги» button — and it could only be ticked off once the goal was reached. That is
 * gone with the step feature: a Mini App cannot read a phone's step counter, so the number was
 * typed in by hand, and a rest day gated behind a hand-typed number is a rest day that mostly
 * stays unfinished.
 *
 * What is left is what a rest day always was. It is part of the plan, it needs nothing done to it,
 * and the one control marks it as passed so the path can move on. The two buttons that remain are
 * therefore the same button with two meanings — «отдохнул» and «пропускаю» — which is exactly the
 * pair a milestone node already had.
 */
import { Button } from '@/components/ui/Button';
import { Glyph } from '@/components/ui/Icon';
import { Sheet } from '@/components/ui/Sheet';
import type { CourseNode } from '@/content/schema';
import { useT } from '@/app/hooks/useT';
import type { NodeStatus } from './nodeState';

export interface NodeSheetProps {
  /** The rest / milestone node shown, or null when closed. */
  node: CourseNode | null;
  status: NodeStatus;
  busy: boolean;
  onClose: () => void;
  /** Complete the node (rest day taken, or "skip" when `skip` is true). */
  onComplete: (skip: boolean) => void;
}

export function NodeSheet({ node, status, busy, onClose, onComplete }: NodeSheetProps) {
  const { t, l } = useT();
  const open = node !== null;
  const done = status === 'done';
  const isRest = node?.kind === 'rest';

  let hint: string;
  if (done) hint = isRest ? t('app.pathRestAlreadyDone') : t('app.pathMilestoneDone');
  else if (!isRest) hint = t('app.pathMilestoneBody');
  else hint = t('app.pathRestDoneHint');

  const footer = isRest ? (
    <div className="flex flex-col gap-2">
      <Button
        variant="action"
        size="lg"
        fullWidth
        loading={busy}
        disabled={done}
        onClick={() => onComplete(false)}
      >
        {done ? t('app.pathRestMarked') : t('app.pathRestMarkDone')}
      </Button>
      {!done ? (
        <Button variant="ghost" fullWidth disabled={busy} onClick={() => onComplete(true)}>
          {t('app.pathRestSkip')}
        </Button>
      ) : null}
    </div>
  ) : (
    <Button
      variant="action"
      size="lg"
      fullWidth
      loading={busy}
      disabled={done}
      onClick={() => onComplete(false)}
    >
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
