import { describe, expect, it } from 'vitest';
import { app as en } from '@/i18n/en/app';
import { app as ru } from '@/i18n/ru/app';
import { CLUB_DEMO, DEMO_PACE, DEMO_TASK_POINTS, demoTimeline } from './clubDemo';

describe('the club’s demo chat', () => {
  it('names only lines both languages have', () => {
    for (const m of CLUB_DEMO) {
      for (const key of [m.text, m.title, m.time]) {
        if (!key) continue;
        expect(ru).toHaveProperty(key);
        expect(en).toHaveProperty(key);
      }
    }
  });

  it('is the club’s day: a task from the coach, your answer, the points, the prize', () => {
    expect(CLUB_DEMO[0]?.from).toBe('coach');
    expect(CLUB_DEMO[0]?.points).toBe(DEMO_TASK_POINTS);
    expect(CLUB_DEMO.filter((m) => m.from === 'me')).toHaveLength(1);
    expect(CLUB_DEMO.at(-1)?.text).toBe('clubDemoWin');
    // The accepted line quotes the task's own points, never another number.
    expect(ru.clubDemoAccepted).toContain('{n}');
    expect(en.clubDemoAccepted).toContain('{n}');
  });

  it('shows the dots before every coach message and lands each message later than the last', () => {
    const moments = demoTimeline(CLUB_DEMO);
    let last = -1;
    for (const m of moments) {
      expect(m.at).toBeGreaterThan(last);
      last = m.at;
    }
    const landings = moments.filter((m) => !m.typing);
    expect(landings.map((m) => m.shown)).toEqual(CLUB_DEMO.map((_, i) => i + 1));
    const dots = moments.filter((m) => m.typing);
    expect(dots).toHaveLength(CLUB_DEMO.filter((m) => m.from === 'coach').length);
    expect(landings.at(-1)?.at).toBeLessThan(10_000);
    expect(DEMO_PACE.typing).toBeGreaterThan(0);
  });
});
