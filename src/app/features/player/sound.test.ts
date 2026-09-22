/**
 * The audible part of the player, tested where it can be: the cue table and the countdown rule.
 *
 * `playCue` itself needs a WebAudio context and there is no jsdom here, so what is checked is the
 * data it reads — and that data is where the mistakes live. A note with no length is silence, a
 * gain of 1 is a phone speaker clipping in someone's ear at six in the morning, and a "short"
 * cue that turns out to be two seconds long would still be playing when the next exercise starts.
 */
import { describe, expect, it } from 'vitest';
import { countdownCue, cueDurationMs, CUES, type Cue } from './sound';

const ALL = Object.keys(CUES) as Cue[];

describe('the cue table', () => {
  it('gives every cue at least one note', () => {
    for (const cue of ALL) expect(CUES[cue].length, cue).toBeGreaterThan(0);
  });

  it('keeps every note audible and none of them loud enough to hurt', () => {
    for (const cue of ALL) {
      for (const note of CUES[cue]) {
        // Roughly the range of a glockenspiel: below this a phone speaker cannot reproduce it,
        // above it the tone stops being a note and becomes a whistle.
        expect(note.hz, cue).toBeGreaterThanOrEqual(200);
        expect(note.hz, cue).toBeLessThanOrEqual(2000);
        expect(note.ms, cue).toBeGreaterThan(0);
        const gain = note.gain ?? 0.22;
        expect(gain, cue).toBeGreaterThan(0);
        expect(gain, cue).toBeLessThanOrEqual(0.3);
      }
    }
  });

  /*
   * Два сигнала звучат десятки раз за тренировку, остальные — единицы. Это и есть правило
   * громкости: чем чаще, тем тише. Проверяется здесь, потому что при следующей правке таблицы
   * соблазн «сделать погромче, а то не слышно» будет ровно на этих двух строчках.
   */
  it('keeps the two cues that repeat all session quieter than the ones that do not', () => {
    const loudest = (cue: Cue) => Math.max(...CUES[cue].map((n) => n.gain ?? 0.22));
    for (const often of ['tick', 'next'] as const) {
      for (const rare of ['finish', 'award', 'end', 'horn'] as const) {
        expect(loudest(often), `${often} vs ${rare}`).toBeLessThan(loudest(rare));
      }
    }
  });

  it('makes the last second of a countdown higher than the ones before it', () => {
    // A rising row is heard as an approach; three identical beeps are heard as background.
    expect(CUES.tickLast[0]!.hz).toBeGreaterThan(CUES.tick[0]!.hz);
  });

  /*
   * Ничего из этого не должно перекрывать следующее событие. `next` звучит ровно в тот момент,
   * когда на экране появляется новое упражнение, и если он длиннее полусекунды, то человек
   * слушает предыдущий шаг, глядя на следующий.
   */
  it('keeps the in-workout cues short and lets only the celebration be long', () => {
    for (const cue of ['tick', 'tickLast', 'next', 'go', 'round'] as const) {
      expect(cueDurationMs(cue), cue).toBeLessThanOrEqual(300);
    }
    expect(cueDurationMs('finish')).toBeLessThanOrEqual(900);
    expect(cueDurationMs('award')).toBeLessThanOrEqual(400);
    // And the celebration is the longest thing in the set, other than the test's own horn.
    expect(cueDurationMs('finish')).toBeGreaterThan(cueDurationMs('next'));
  });

  it('measures a cue whose notes overlap by where the last one ends', () => {
    // `finish` is an arpeggio: the notes start before their neighbours have died away, so the
    // length is not the sum of them. Getting this wrong would over-state every cue with an `at`.
    const last = CUES.finish[CUES.finish.length - 1]!;
    expect(cueDurationMs('finish')).toBe((last.at ?? 0) + last.ms);
  });
});

describe('countdownCue', () => {
  it('counts the last three seconds and marks the last one differently', () => {
    expect(countdownCue(3)).toBe('tick');
    expect(countdownCue(2)).toBe('tick');
    expect(countdownCue(1)).toBe('tickLast');
  });

  /*
   * Ноль молчит здесь намеренно: ноль — это либо переход (и его объявляет тот, кто переключает
   * шаг), либо «время вышло» на шаге, который никуда не идёт (и тогда шаг говорит `end` сам).
   * Один переход — один звук.
   */
  it('says nothing at zero, and nothing while there is still time', () => {
    expect(countdownCue(0)).toBeNull();
    for (const sec of [4, 5, 10, 60, 600]) expect(countdownCue(sec), String(sec)).toBeNull();
  });

  it('survives a clock that went past zero', () => {
    expect(countdownCue(-1)).toBeNull();
  });
});
