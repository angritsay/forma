/**
 * The exchange the selling screen plays: one day in the club, as messages.
 *
 * The owner: «Он абсолютно не продаёт клуб маленьких шагов». The screen used to describe the
 * club; now it shows a day of it — the task arriving in the morning, the answer, the points, and
 * on Sunday the prize. This file is the script and the clock; `ClubDemoChat.tsx` draws it.
 *
 * ## What is allowed in the script
 *
 * The same rule as the rest of the selling screen (`ClubPitch.tsx`): nothing invented. The task
 * is a real one from the club's first weeks (`supabase/migrations/0017_club_first_weeks.sql`,
 * «Стакан воды до кофе», 8 points), the points are its points, the streak line says what the
 * streak does, and the last message is the bot's own winner line. There is no second member, no
 * name, no position in a table — a reader could take any of those for a real person or a real
 * number, and this screen asks for money.
 *
 * ## The clock
 *
 * `demoTimeline` turns the script into moments: before each of the coach's messages the typing
 * dots show for a while, then the message lands; a reply from «you» lands after a shorter pause
 * with no dots. It is a pure function so the pacing is testable and the component only has to
 * fire timeouts.
 */
export type DemoFrom = 'coach' | 'me';

export interface DemoMessage {
  from: DemoFrom;
  /** The i18n key of the line (`app.*`, without the prefix). */
  text: 'clubDemoTaskBody' | 'clubDemoDone' | 'clubDemoAccepted' | 'clubDemoWin';
  /** A bold first line — the task's name. */
  title?: 'clubDemoTaskTitle';
  /** A pill under the text: the task's points. */
  points?: number;
  /** The small time under the bubble; omitted for a message that follows straight on. */
  time?: 'clubDemoTime1' | 'clubDemoTime2' | 'clubDemoTime3';
}

/** «Стакан воды до кофе» is worth 8 in 0017; the accepted line quotes the same number. */
export const DEMO_TASK_POINTS = 8;

export const CLUB_DEMO: readonly DemoMessage[] = [
  {
    from: 'coach',
    title: 'clubDemoTaskTitle',
    text: 'clubDemoTaskBody',
    points: DEMO_TASK_POINTS,
    time: 'clubDemoTime1',
  },
  { from: 'me', text: 'clubDemoDone', time: 'clubDemoTime2' },
  { from: 'coach', text: 'clubDemoAccepted' },
  { from: 'coach', text: 'clubDemoWin', time: 'clubDemoTime3' },
];

export interface DemoMoment {
  /** Milliseconds after the chat is mounted. */
  at: number;
  /** How many messages are on screen from this moment. */
  shown: number;
  /** Whether the coach's dots are showing. */
  typing: boolean;
}

export const DEMO_PACE = {
  /** A beat before anything happens, so the card is seen empty first. */
  lead: 500,
  /** How long the dots show before a coach message. */
  typing: 1000,
  /** The pause after a coach message before the next thing. */
  afterCoach: 700,
  /** How long «you» take to answer. */
  reply: 900,
  /** The pause after your reply. */
  afterMe: 500,
} as const;

export function demoTimeline(script: readonly DemoMessage[], pace = DEMO_PACE): DemoMoment[] {
  const out: DemoMoment[] = [];
  let t = pace.lead;
  script.forEach((m, i) => {
    if (m.from === 'coach') {
      out.push({ at: t, shown: i, typing: true });
      t += pace.typing;
      out.push({ at: t, shown: i + 1, typing: false });
      t += pace.afterCoach;
    } else {
      t += pace.reply;
      out.push({ at: t, shown: i + 1, typing: false });
      t += pace.afterMe;
    }
  });
  return out;
}
