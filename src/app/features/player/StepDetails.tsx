/**
 * Everything about the current step that is words rather than numbers, for the part of the player
 * below the fold.
 *
 * The player's first screen is the coach's clip with the timer and the transport on it and nothing
 * else; this is what a scroll reveals. It is assembled here, from the step, rather than inside each
 * step component, because the two halves live at opposite ends of the page — the numbers are pinned
 * to the bottom of the viewport and these scroll — and one component cannot render into both.
 */
import type { ReactNode } from 'react';
import { useT } from '@/app/hooks/useT';
import type { PlayerStep, PrescribedWorkout } from '@/lib/training/types';
import { ExplainPanel } from './ExplainPanel';
import { ItemList } from './ItemList';
import { findBlock, findExercise } from './model';

export interface StepDetailsProps {
  step: PlayerStep;
  prescribed: PrescribedWorkout;
}

/** One quiet paragraph — a coach's note, a block's description. */
function Note({ children }: { children: ReactNode }) {
  return <p className="text-[15px] leading-relaxed text-muted">{children}</p>;
}

export function StepDetails({ step, prescribed }: StepDetailsProps) {
  const { t, l, locale } = useT();

  switch (step.kind) {
    case 'warmup_gate':
      return <Note>{t('app.playerGateBody')}</Note>;

    case 'block_intro': {
      const block = findBlock(prescribed, step.blockId);
      return (
        <>
          {step.description ? <Note>{l(step.description)}</Note> : null}
          {block ? (
            <ItemList items={block.items} className="border-t border-border-strong" />
          ) : null}
        </>
      );
    }

    case 'work': {
      const original = step.item.substituted
        ? findExercise(step.item.originalExerciseId)
        : undefined;
      return (
        <>
          {step.item.note ? <Note>{l(step.item.note)}</Note> : null}
          {original ? (
            <Note>{t('training.substitutedFrom', { name: original.name[locale] })}</Note>
          ) : null}
          <ExplainPanel exerciseId={step.exerciseId} item={step.item} />
        </>
      );
    }

    case 'rest': {
      // A rest previews what follows, so the words here belong to that movement, not the one just
      // finished.
      const nextId = step.nextExerciseId;
      const nextItem = nextId
        ? findBlock(prescribed, step.blockId)?.items.find((it) => it.exerciseId === nextId)
        : undefined;
      return nextId && nextItem ? <ExplainPanel exerciseId={nextId} item={nextItem} /> : null;
    }

    case 'amrap':
    case 'fortime':
      return <ItemList items={step.items} className="border-t border-border-strong" />;

    case 'done':
      return null;
  }
}
