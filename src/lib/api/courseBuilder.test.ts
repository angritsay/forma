import { describe, expect, it } from 'vitest';
import { coursePatchToDb, dayPatchToDb } from './courseBuilder';

describe('coursePatchToDb', () => {
  it('sends only the fields the caller set', () => {
    expect(coursePatchToDb({})).toEqual({});
    expect(coursePatchToDb({ weeks: 6 })).toEqual({ weeks: 6 });
  });

  it('maps every editable field to its column', () => {
    const content = { longDescription: [], forWhom: [], outcomes: [], faq: [] };
    expect(
      coursePatchToDb({
        slugId: 'yoga',
        sortOrder: 6,
        level: 2,
        weeks: 8,
        sessionsPerWeek: 4,
        avgSessionMin: 40,
        equipment: ['mat'],
        tile: '#1A2634',
        priceRub: 4900,
        priceUsd: 59,
        content,
      }),
    ).toEqual({
      slug_id: 'yoga',
      sort_order: 6,
      level: 2,
      weeks: 8,
      sessions_per_week: 4,
      avg_session_min: 40,
      equipment: ['mat'],
      tile: '#1A2634',
      price_rub: 4900,
      price_usd: 59,
      content,
    });
  });

  it('keeps a zero, which is a value and not an absence', () => {
    expect(coursePatchToDb({ priceRub: 0, sortOrder: 0 })).toEqual({
      price_rub: 0,
      sort_order: 0,
    });
  });
});

describe('dayPatchToDb', () => {
  it('distinguishes "leave alone" from "clear"', () => {
    // Turning a workout day into a rest day has to send null, or the old reference survives and
    // the table's check constraint rejects the write.
    expect(dayPatchToDb({ kind: 'rest', customWorkoutId: null })).toEqual({
      kind: 'rest',
      custom_workout_id: null,
    });
    expect(dayPatchToDb({ kind: 'rest' })).toEqual({ kind: 'rest' });
    expect('custom_workout_id' in dayPatchToDb({ kind: 'rest' })).toBe(false);
  });

  it('maps every editable field to its column', () => {
    const content = { body: [] };
    expect(
      dayPatchToDb({
        nodeId: 'd1',
        week: 2,
        day: 3,
        kind: 'workout',
        customWorkoutId: 'uuid-1',
        content,
        deload: true,
        stepsGoal: 8000,
        sortOrder: 4,
      }),
    ).toEqual({
      node_id: 'd1',
      week: 2,
      day: 3,
      kind: 'workout',
      custom_workout_id: 'uuid-1',
      content,
      deload: true,
      steps_goal: 8000,
      sort_order: 4,
    });
  });

  it('keeps deload: false rather than dropping it', () => {
    expect(dayPatchToDb({ deload: false })).toEqual({ deload: false });
  });
});
