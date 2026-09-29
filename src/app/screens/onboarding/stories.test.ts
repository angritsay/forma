import { describe, expect, it } from 'vitest';
import { DraftSchema, emptyDraft, STEP_IDS } from './draft';
import {
  AUTO_MS,
  hasSeen,
  markSeen,
  nextIndex,
  seenKey,
  STORY_IDS,
  STORY_SETS,
  storiesFor,
  tapZone,
} from './stories';

describe('STORY_SETS', () => {
  it('follows two of the five questions, and only those', () => {
    expect(Object.keys(STORY_SETS).sort()).toEqual(['level', 'limitations']);
    for (const step of Object.keys(STORY_SETS)) expect(STEP_IDS).toContain(step);
  });

  it('shows the care slide after the limitations and the tour after the level', () => {
    expect(storiesFor('limitations')).toEqual(['care']);
    expect(storiesFor('level')).toEqual(['adapt', 'path', 'player', 'club', 'coach']);
    expect(storiesFor('name')).toBeNull();
    expect(storiesFor('age')).toBeNull();
    expect(storiesFor('sex')).toBeNull();
  });

  /* The replay at /intro shows every slide once, in the order the wizard would have. */
  it('covers every slide exactly once between the two sets, in the replay order', () => {
    const inOrder = STEP_IDS.flatMap((s) => storiesFor(s) ?? []);
    expect(inOrder).toEqual([...STORY_IDS]);
    expect(new Set(inOrder).size).toBe(STORY_IDS.length);
  });

  it('auto-advances at seven seconds', () => {
    expect(AUTO_MS).toBe(7000);
  });
});

describe('tapZone', () => {
  it('sends the left third back and the rest forward', () => {
    expect(tapZone(0, 390)).toBe('back');
    expect(tapZone(129, 390)).toBe('back');
    expect(tapZone(130, 390)).toBe('next');
    expect(tapZone(389, 390)).toBe('next');
  });

  it('reads a failed measurement as forward', () => {
    expect(tapZone(10, 0)).toBe('next');
    expect(tapZone(10, Number.NaN)).toBe('next');
  });
});

describe('nextIndex', () => {
  it('steps one slide either way', () => {
    expect(nextIndex(1, 'next', 5)).toBe(2);
    expect(nextIndex(1, 'back', 5)).toBe(0);
  });

  /* The two ends are the player's signals: -1 leaves backwards, count means done. */
  it('runs off both ends by exactly one', () => {
    expect(nextIndex(0, 'back', 5)).toBe(-1);
    expect(nextIndex(4, 'next', 5)).toBe(5);
    expect(nextIndex(-1, 'back', 5)).toBe(-1);
    expect(nextIndex(5, 'next', 5)).toBe(5);
  });
});

describe('seen marking', () => {
  it('marks a step once and reads it back', () => {
    expect(hasSeen([], 'limitations')).toBe(false);
    const once = markSeen([], 'limitations');
    expect(once).toEqual([seenKey('limitations')]);
    expect(hasSeen(once, 'limitations')).toBe(true);
    expect(hasSeen(once, 'level')).toBe(false);
    expect(markSeen(once, 'limitations')).toEqual(once);
  });

  it('does not mutate the list it is given', () => {
    const seen = ['limitations'];
    markSeen(seen, 'level');
    expect(seen).toEqual(['limitations']);
  });

  /*
   * The draft persists the list. A draft written before the stories existed has no such field and
   * must still parse — someone mid-wizard when the release lands should not be sent back to the
   * first question — and it then shows every story, which is the right default for them.
   */
  it('lives on the draft and defaults to empty for old drafts', () => {
    expect(emptyDraft().seenStories).toEqual([]);
    const old = DraftSchema.safeParse({ step: 3, displayName: 'Аня' });
    expect(old.success).toBe(true);
    expect(old.data?.seenStories).toEqual([]);
    const kept = DraftSchema.safeParse({ seenStories: ['limitations'] });
    expect(kept.data?.seenStories).toEqual(['limitations']);
  });
});
