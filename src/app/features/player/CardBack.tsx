/**
 * The back of the card: everything the coach wrote about the movement being demonstrated.
 *
 * The front of a step is the clip and two numbers. Every word — how the movement goes, what to
 * watch for, who should not do it — is here instead, on the reverse, reached by turning the card
 * over. That is the whole arrangement: an athlete mid-set never has text in front of them, and an
 * athlete who wants the text gets all of it at once rather than a paragraph squeezed under a video.
 *
 * The tabs are the coach's own headings. `Техника` is the numbered how-to and the breathing note;
 * `Рекомендации` is his cues and the mistakes he keeps correcting; `Осторожно` is the
 * contraindications for this movement at this load, plus what it works and what it needs.
 */
import { useState } from 'react';
import { Chip } from '@/components/ui/Chip';
import { Glyph } from '@/components/ui/Icon';
import { Tabs, tabPanelId } from '@/components/ui/Tabs';
import { useT } from '@/app/hooks/useT';
import type { TKey } from '@/i18n/index';
import type { PlayerStep, PrescribedItem, PrescribedWorkout } from '@/lib/training/types';
import { ItemList } from './ItemList';
import { contraindicationsFor, findBlock, findExercise, limitationLabel } from './model';

type Tab = 'technique' | 'cues' | 'cautions';

const TABS: { id: Tab; key: TKey }[] = [
  { id: 'technique', key: 'app.playerTabTechnique' },
  { id: 'cues', key: 'app.playerTabCues' },
  { id: 'cautions', key: 'app.playerTabCautions' },
];

/** Which movement this step is about — for a rest, the one it is resting *for*. */
export function stepExerciseId(
  step: PlayerStep,
  prescribed: PrescribedWorkout,
): { exerciseId: string; item: PrescribedItem } | null {
  if (step.kind === 'work') return { exerciseId: step.exerciseId, item: step.item };
  if (step.kind === 'rest' && step.nextExerciseId) {
    const item = findBlock(prescribed, step.blockId)?.items.find(
      (it) => it.exerciseId === step.nextExerciseId,
    );
    if (item) return { exerciseId: step.nextExerciseId, item };
  }
  return null;
}

/** A heading over a group inside a tab, so two lists under one tab do not run together. */
function GroupHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="eyebrow text-muted-2">{children}</h3>;
}

/** «01 — держи спину прямой» down a ruled column: the shape every instruction list uses here. */
function NumberedList({ lines }: { lines: readonly string[] }) {
  return (
    <ol className="flex flex-col">
      {lines.map((line, i) => (
        <li key={i} className="flex gap-3.5 border-t border-border py-3 first:border-t-0">
          <span className="numeral tabular w-6 shrink-0 text-sm text-muted">
            {String(i + 1).padStart(2, '0')}
          </span>
          <span className="text-[15px] leading-relaxed">{line}</span>
        </li>
      ))}
    </ol>
  );
}

/** A bulleted aside — a cue, a mistake. The glyph is the brandbook's, never a •. */
function CueList({ lines, glyph }: { lines: readonly string[]; glyph: string }) {
  return (
    <ul className="flex flex-col gap-2 text-[15px] leading-relaxed text-muted">
      {lines.map((line, i) => (
        <li key={i} className="flex gap-2.5">
          <Glyph size={12} className="mt-1.5 shrink-0 text-muted-2">
            {glyph}
          </Glyph>
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
}

interface ExerciseBackProps {
  exerciseId: string;
  item: PrescribedItem;
}

function ExerciseBack({ exerciseId, item }: ExerciseBackProps) {
  const { t, l } = useT();
  const [tab, setTab] = useState<Tab>('technique');
  const exercise = findExercise(exerciseId);
  if (!exercise) return null;

  const cautions = contraindicationsFor(exercise, item.loadLabel);

  return (
    <div className="flex flex-col gap-5">
      <Tabs
        variant="fill"
        label={t('app.playerCardBackLabel')}
        tabs={TABS.map((x) => ({ id: x.id, label: t(x.key) }))}
        value={tab}
        onChange={setTab}
      />

      <div id={tabPanelId(tab)} role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'technique' ? (
          <div className="flex flex-col gap-5">
            <NumberedList lines={exercise.howTo.map((line) => l(line))} />
            {exercise.breathing ? (
              <div className="flex flex-col gap-2 border-t border-border pt-4">
                <GroupHeading>{t('app.playerBreathing')}</GroupHeading>
                <p className="text-[15px] leading-relaxed text-muted">{l(exercise.breathing)}</p>
              </div>
            ) : null}
          </div>
        ) : null}

        {tab === 'cues' ? (
          <div className="flex flex-col gap-5">
            {exercise.cues.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                <GroupHeading>{t('app.playerCuesTitle')}</GroupHeading>
                <CueList lines={exercise.cues.map((c) => l(c))} glyph="›" />
              </div>
            ) : null}
            {exercise.mistakes.length > 0 ? (
              <div className="flex flex-col gap-2.5 border-t border-border pt-4">
                <GroupHeading>{t('app.playerMistakesTitle')}</GroupHeading>
                <CueList lines={exercise.mistakes.map((m) => l(m))} glyph="×" />
              </div>
            ) : null}
          </div>
        ) : null}

        {tab === 'cautions' ? (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2.5">
              <GroupHeading>{t('app.playerCautionsTitle')}</GroupHeading>
              {cautions.length > 0 ? (
                <>
                  <p className="text-sm text-muted">{t('app.playerCautionsLead')}</p>
                  <div className="flex flex-wrap gap-2">
                    {cautions.map((lim) => (
                      <Chip key={lim} tone="warning">
                        {limitationLabel(t, lim)}
                      </Chip>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted">{t('app.playerCautionsNone')}</p>
              )}
            </div>
            <div className="flex flex-col gap-2.5 border-t border-border pt-4">
              <GroupHeading>{t('app.playerTabMuscles')}</GroupHeading>
              <div className="flex flex-wrap gap-2">
                {exercise.muscles.map((m) => (
                  <Chip key={m}>{t(`seo.muscle_${m}` as TKey)}</Chip>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export interface CardBackProps {
  step: PlayerStep;
  prescribed: PrescribedWorkout;
}

/**
 * What the reverse shows for the step the athlete is on: the movement's own pages where there is a
 * movement, and the block's running order where the step *is* the block (an AMRAP, a for-time).
 */
export function CardBack({ step, prescribed }: CardBackProps) {
  const { t, l, locale } = useT();
  const about = stepExerciseId(step, prescribed);

  if (about) {
    const original =
      step.kind === 'work' && step.item.substituted
        ? findExercise(step.item.originalExerciseId)
        : undefined;
    return (
      <div className="flex flex-col gap-5">
        {step.kind === 'work' && step.item.note ? (
          <p className="text-[15px] leading-relaxed text-muted">{l(step.item.note)}</p>
        ) : null}
        {original ? (
          <p className="text-[15px] leading-relaxed text-muted">
            {t('training.substitutedFrom', { name: original.name[locale] })}
          </p>
        ) : null}
        <ExerciseBack exerciseId={about.exerciseId} item={about.item} />
      </div>
    );
  }

  switch (step.kind) {
    case 'block_intro': {
      const block = findBlock(prescribed, step.blockId);
      return (
        <div className="flex flex-col gap-4">
          {step.description ? (
            <p className="text-[15px] leading-relaxed text-muted">{l(step.description)}</p>
          ) : null}
          {block ? <ItemList items={block.items} /> : null}
        </div>
      );
    }
    case 'amrap':
    case 'fortime':
      return <ItemList items={step.items} />;
    default:
      return null;
  }
}
