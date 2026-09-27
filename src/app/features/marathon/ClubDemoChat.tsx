/**
 * A day in the club, playing itself: the coach's morning task, your «done», the points, the prize.
 *
 * It is drawn as a messenger thread because that is what the club *is* to a member — a chat with
 * Sergey in Telegram — and a stranger on the selling screen sees the real thing rather than a
 * description of it. The script and its clock are in `clubDemo.ts`.
 *
 * ## Nothing moves on the page
 *
 * Every bubble is in the DOM from the first paint, hidden, and is revealed in its place when its
 * moment comes. The thread is therefore exactly as tall at rest as it will be at the end, and the
 * name, the features and the button under it never shift while the messages arrive. The typing
 * dots sit inside the slot of the message they precede, for the same reason.
 *
 * Under `prefers-reduced-motion` the whole exchange is shown at once: somebody who asked for less
 * motion did not ask to wait four seconds for a paragraph.
 *
 * ## Colour
 *
 * The coach's bubbles are the surface; yours are the brand's light blue with ink, the colour of
 * «where you are» on the tab and the pill the points sit in. The club has no neon (global.css
 * header, `club-no-neon.test.ts`), and the gradient stays on the one button below.
 */
import { clsx } from 'clsx';
import { useEffect, useState } from 'react';
import { Pill } from '@/components/ui/Pill';
import { useT } from '@/app/hooks/useT';
import { withBase } from '@/lib/util/paths';
import { COACH } from '@content/site/coach';
import { clubPrizeMidSentence } from './prize';
import { CLUB_DEMO, DEMO_TASK_POINTS, demoTimeline, type DemoMessage } from './clubDemo';

/** How far the script has played: messages on screen, and whether the dots are up. */
function useDemoClock(count: number): { shown: number; typing: boolean } {
  const [state, setState] = useState({ shown: 0, typing: false });
  useEffect(() => {
    const still =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (still) {
      setState({ shown: count, typing: false });
      return;
    }
    const timers = demoTimeline(CLUB_DEMO).map((m) =>
      window.setTimeout(() => setState({ shown: m.shown, typing: m.typing }), m.at),
    );
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [count]);
  return state;
}

function TypingDots() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-10 items-center gap-1 rounded-card rounded-bl-md bg-surface-2 px-4"
    >
      {[0, 1, 2].map((i) => (
        <span key={i} className="typing-dot block size-1.5 rounded-full bg-muted" />
      ))}
    </span>
  );
}

function Bubble({ message, visible }: { message: DemoMessage; visible: boolean }) {
  const tr = useT();
  const { t } = tr;
  const mine = message.from === 'me';
  const text =
    message.text === 'clubDemoWin'
      ? t('app.clubDemoWin', { prize: clubPrizeMidSentence(tr) })
      : message.text === 'clubDemoAccepted'
        ? t('app.clubDemoAccepted', { n: DEMO_TASK_POINTS })
        : t(`app.${message.text}`);
  return (
    <div
      className={clsx(
        'flex max-w-[86%] flex-col gap-1',
        mine ? 'items-end self-end' : 'items-start self-start',
        visible ? 'pop-in' : 'invisible',
      )}
    >
      <div
        className={clsx(
          'flex flex-col gap-2 rounded-card px-4 py-3 text-[15px] leading-snug',
          mine ? 'rounded-br-md bg-accent text-ink' : 'rounded-bl-md bg-surface-2 text-text',
        )}
      >
        {message.title ? <p className="font-semibold">{t(`app.${message.title}`)}</p> : null}
        <p>{text}</p>
        {message.points !== undefined ? (
          <div className="flex">
            <Pill tone="sky">{t('app.clubDemoPoints', { n: message.points })}</Pill>
          </div>
        ) : null}
      </div>
      {message.time ? (
        <span className="px-1 text-[11px] text-muted-2">{t(`app.${message.time}`)}</span>
      ) : null}
    </div>
  );
}

export function ClubDemoChat() {
  const { t, l } = useT();
  const { shown, typing } = useDemoClock(CLUB_DEMO.length);

  return (
    <section aria-label={t('app.clubDemoEyebrow')} className="flex flex-col gap-3">
      <p className="eyebrow px-3">{t('app.clubDemoEyebrow')}</p>
      <div className="glass-card flex flex-col gap-4 rounded-card p-4">
        <header className="flex items-center gap-3">
          <img
            src={withBase(COACH.photo)}
            alt=""
            width={40}
            height={40}
            className="photo-mono size-10 shrink-0 rounded-full object-cover"
          />
          <div className="flex min-w-0 flex-col">
            <p className="truncate text-[15px] leading-tight font-semibold">{l(COACH.name)}</p>
            <p className="text-[13px] leading-tight text-muted">{t('app.clubDemoCoachRole')}</p>
          </div>
        </header>
        {/* `aria-live` so a screen reader hears the lines arrive in order, once each. */}
        <ol aria-live="polite" className="flex flex-col gap-2.5">
          {CLUB_DEMO.map((message, i) => (
            <li key={i} className="relative flex flex-col">
              {typing && i === shown && message.from === 'coach' ? (
                <span className="absolute top-0 left-0">
                  <TypingDots />
                </span>
              ) : null}
              <Bubble message={message} visible={i < shown} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
