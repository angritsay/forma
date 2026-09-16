import { describe, expect, it } from 'vitest';
import { resumeCard, type ResumeSlice } from './resumeModel';

/*
 * The rule under test is the owner's: «на главном экране всегда должна быть только одна кнопка
 * тренировки». This module decides whether today's card is the unfinished session or today's
 * session, and returning null is how it says "today's session" — so a null that should have been a
 * card puts two buttons back on the screen, and a card that should have been null replaces today's
 * workout with a session the player would refuse to open.
 */
const t = ((key: string) => key) as never;

function slice(over: Partial<ResumeSlice> = {}): ResumeSlice {
  return {
    session: {
      sessionId: 's1',
      courseId: 'start',
      nodeId: 'n1',
      workoutId: 'w1',
      prescribed: { blocks: [] } as never,
      startedAt: '2026-01-01T10:00:00.000Z',
    },
    finishedAt: null,
    steps: [],
    stepIndex: 0,
    ...over,
  } as ResumeSlice;
}

describe('resumeCard', () => {
  it('is null when nothing is running, so the card is today’s session', () => {
    expect(resumeCard(slice({ session: null }), t, 'ru')).toBeNull();
  });

  it('offers the running session, with the course it belongs to', () => {
    const card = resumeCard(slice(), t, 'ru');
    expect(card?.courseId).toBe('start');
    expect(card?.finished).toBe(false);
    expect(card?.ctaKey).toBe('app.homeResumeCta');
    expect(card?.eyebrowKey).toBe('app.homeResumeEyebrow');
  });

  it('asks for a save, not a resume, once the session has finished', () => {
    // A finished session is not resumed — it is saved — and the verb on the one button has to say
    // which of the two it is.
    const card = resumeCard(slice({ finishedAt: '2026-01-01T10:30:00.000Z' }), t, 'ru');
    expect(card?.finished).toBe(true);
    expect(card?.ctaKey).toBe('app.homeResumeSave');
    expect(card?.eyebrowKey).toBe('app.homeResumeFinishedEyebrow');
  });

  it('names no movement for a finished session', () => {
    // There is nothing left to stop on; «Остановились на: …» would be describing a step already done.
    const card = resumeCard(slice({ finishedAt: '2026-01-01T10:30:00.000Z' }), t, 'ru');
    expect(card?.stoppedOn).toBe('');
  });
});
