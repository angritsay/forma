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

  it('opens inside the warm-up when the first section is a warm-up', () => {
    const prescribed = buildPrescribedFromCustom('cw_test', structure);
    const steps = buildPlayerSteps(prescribed);
    // No gate, no intro — the first step is already the first movement of the warm-up.
    expect(steps[0]?.kind).toBe('work');
    expect('blockId' in steps[0]! ? steps[0]!.blockId : null).toBe(prescribed.blocks[0]?.blockId);
    expect(steps[steps.length - 1]?.kind).toBe('done');
  });

  /*
   * Ноль по решению владельца: доска считает неделю по всем сессиям, а приз недели — час с
   * тренером. Очки за выданную тренировку превращали покупку персональной работы в фору в гонке
   * за бесплатную персональную работу.
   */
  it('customWorkoutPoints is zero, so an assigned workout cannot move the board', () => {
    expect(customWorkoutPoints()).toBe(0);
  });

  it('builds a workout worth no points at all', () => {
    const prescribed = buildPrescribedFromCustom('cw_test', structure);
    expect(prescribed.points).toBe(0);
    // Но сама работа никуда не делась: тренировка по-прежнему играется целиком.
    expect(prescribed.estimatedSec).toBeGreaterThan(0);
    expect(prescribed.blocks.length).toBeGreaterThan(0);
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
