import { describe, expect, it } from 'vitest';
import { buildPlayerSteps } from './player';
import {
  buildPrescribedFromCustom,
  customWorkoutPoints,
  isPlayableStructure,
  type CustomWorkoutStructure,
} from './customWorkout';

const structure: CustomWorkoutStructure = {
  sections: [
    {
      kind: 'warmup',
      format: 'circuit',
      sets: 1,
      items: [{ exerciseId: 'cat_cow', unit: 'reps', target: 8, restAfterSec: 0 }],
    },
    {
      kind: 'main',
      format: 'circuit',
      sets: 2,
      restBetweenRoundsSec: 60,
      items: [
        { exerciseId: 'knee_push_up', unit: 'reps', target: 8, restAfterSec: 60, note: 'Спокойно' },
        { exerciseId: 'plank', unit: 'seconds', target: 30, restAfterSec: 60 },
      ],
    },
    {
      kind: 'cooldown',
      format: 'circuit',
      sets: 1,
      items: [
        {
          exerciseId: 'hamstring_stretch',
          unit: 'seconds',
          target: 30,
          perSide: true,
          restAfterSec: 0,
        },
      ],
    },
  ],
};

describe('buildPrescribedFromCustom', () => {
  it('maps sections to blocks with the right types and no scaling', () => {
    const p = buildPrescribedFromCustom('cw_test', structure);
    expect(p.workoutId).toBe('cw_test');
    expect(p.scale).toBe(1);
    expect(p.effectiveScale).toBe(1);
    expect(p.blocks.map((b) => b.type)).toEqual(['warmup', 'strength', 'cooldown']);
    expect(p.blocks[1]?.sets).toBe(2);
    // The coach's numbers are preserved verbatim.
    expect(p.blocks[1]?.items[0]?.target).toBe(8);
    expect(p.blocks[1]?.items[0]?.note).toEqual({ ru: 'Спокойно', en: 'Спокойно' });
    expect(p.blocks[2]?.items[0]?.perSide).toBe(true);
    expect(p.estimatedSec).toBeGreaterThan(0);
  });

  it('awards points within the server ceiling', () => {
    const p = buildPrescribedFromCustom('cw_test', structure);
    expect(p.points).toBeGreaterThanOrEqual(40);
    expect(p.points).toBeLessThanOrEqual(72);
  });

  it('opens with the warm-up gate when the first section is a warm-up', () => {
    const steps = buildPlayerSteps(buildPrescribedFromCustom('cw_test', structure));
    expect(steps[0]?.kind).toBe('warmup_gate');
    expect(steps[steps.length - 1]?.kind).toBe('done');
  });

  it('customWorkoutPoints clamps to [40, 72]', () => {
    expect(customWorkoutPoints(0)).toBe(40);
    expect(customWorkoutPoints(60 * 60)).toBe(72);
  });

  it('isPlayableStructure rejects empty structures', () => {
    expect(isPlayableStructure(undefined)).toBe(false);
    expect(isPlayableStructure({ sections: [] })).toBe(false);
    expect(
      isPlayableStructure({
        sections: [{ kind: 'main', format: 'circuit', sets: 1, items: [] }],
      }),
    ).toBe(false);
    expect(isPlayableStructure(structure)).toBe(true);
  });
});
