import { describe, expect, it } from 'vitest';
import type { CustomWorkoutStructure } from '@/lib/training/customWorkout';
import { buildPrescribedFromCustom } from '@/lib/training/customWorkout';
import { buildPlayerSteps } from '@/lib/training/player';
import { draftToStructure, emptySections } from './draft';

const emom = (restBetweenRoundsSec?: number): CustomWorkoutStructure => ({
  sections: [
    {
      kind: 'main',
      format: 'emom',
      sets: 12,
      setsField: 'rounds',
      ...(restBetweenRoundsSec !== undefined ? { restBetweenRoundsSec } : {}),
      items: [
        { exerciseId: 'air_squat', unit: 'reps', target: 10, restAfterSec: 0 },
        { exerciseId: 'knee_push_up', unit: 'reps', target: 8, restAfterSec: 0 },
        { exerciseId: 'dead_bug', unit: 'reps', target: 12, restAfterSec: 0 },
      ],
    },
  ],
});

const resave = (structure: CustomWorkoutStructure, edit?: (target: number) => number) => {
  const drafts = emptySections(structure);
  const main = drafts.find((s) => s.kind === 'main')!;
  if (edit) main.items[0]!.target = edit(main.items[0]!.target);
  return draftToStructure(drafts);
};

describe('workout builder draft round trip', () => {
  it('re-saves an imported EMOM with no rest and gets back no rest', () => {
    const saved = resave(emom(), (n) => n + 1);
    const main = saved.sections[0]!;
    expect(main.format).toBe('emom');
    expect(main.sets).toBe(12);
    expect(main.restBetweenRoundsSec ?? 0).toBe(0);
    expect(main.items[0]!.target).toBe(11);

    // Twelve working minutes and not one rest minute added.
    const steps = buildPlayerSteps(buildPrescribedFromCustom('w', saved));
    expect(steps.filter((s) => s.kind === 'work')).toHaveLength(12);
    expect(steps.some((s) => s.kind === 'rest')).toBe(false);
  });

  it('keeps an EMOM rest the source was written with', () => {
    expect(resave(emom(60)).sections[0]!.restBetweenRoundsSec).toBe(60);
  });

  it('still gives a new circuit a minute between rounds', () => {
    const drafts = emptySections();
    expect(drafts.find((s) => s.kind === 'main')!.restBetweenRoundsSec).toBe(60);
  });
});
