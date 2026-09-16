import { describe, expect, it } from 'vitest';
import { homeLead } from './HomeScreen';

/*
 * The contradiction this guards is the one the owner found on a live phone: «ТРЕНИРОВКА НЕ
 * ЗАКОНЧЕНА … ПРОДОЛЖИТЬ» printed directly above «ВЫБЕРИ КУРС — и первая тренировка появится
 * здесь». Both halves were true to their own source and the screen was false as a whole.
 *
 * It is worth a test rather than a comment because the two sources cannot be made to agree: one is
 * persisted in the browser and the other comes from the server, and any release can part them
 * again.
 */
describe('homeLead', () => {
  it('leads with the course when there is one', () => {
    expect(homeLead(true, false)).toBe('course');
  });

  it('leads with the unfinished session even when a course is owned', () => {
    // «На главном экране всегда должна быть только одна кнопка тренировки». The two used to be
    // rendered together — a «ПРОДОЛЖИТЬ» strip over a «НАЧАТЬ» card — and then the screen offered
    // two workouts without saying which one was today. The one already running wins.
    expect(homeLead(true, true)).toBe('resume');
    expect(homeLead(true, true)).not.toBe('course');
  });

  it('never offers to pick a course while a workout is unfinished', () => {
    // The bug. An unfinished workout is today's training whatever the entitlement list says, and
    // «первая тренировка появится здесь» is false while one is already running.
    expect(homeLead(false, true)).toBe('resume');
    expect(homeLead(false, true)).not.toBe('choose');
  });

  it('offers to pick a course only when there is genuinely nothing', () => {
    expect(homeLead(false, false)).toBe('choose');
  });
});
