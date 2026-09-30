/**
 * The session already booked, on top of the «Тренер» tab — and what stands there instead when the
 * news is bad (0058): a session the coach cancelled, or a list that could not be read.
 *
 * Moved out of `BookScreen` so every state renders on the server in a test (`SessionCard.test.ts`);
 * the screen keeps the fetching and the clock.
 */
import { Button } from '@/components/ui/Button';
import { plural, type Locale } from '@/i18n/index';
import type { CoachBooking } from '@/lib/api/types';
import { describeCountdown, deviceTimeZone, type Countdown } from '@/lib/coach/booking';
import { canSelfMove, JOIN_OPENS_MINUTES, joinOpen } from '@/lib/coach/slots';
import { LinkButton } from '@/app/features/courses/LinkButton';
import { useT, type Translator } from '@/app/hooks/useT';
import { LINKS } from '@content/site/links';

/*
 * --- the session already booked ---------------------------------------------------------------
 *
 * Three rules this card is written around, and all three are about what is *missing* rather than
 * about what is shown.
 *
 * 1. The times are stored in UTC and shown in the **device's** zone. `booking.timezone` is the zone
 *    the booking was made in — the coach's for one made here (0055) — and it is only the fallback
 *    for a browser that will not name its own. Somebody who booked from a laptop abroad and opens
 *    the Mini App at home wants their kitchen clock, not the one in the hotel.
 * 2. **The join link is often absent.** A historical Google Calendar booking (read in by a sync
 *    that is gone since the cutover) may carry none, a session booked here before the coach's room
 *    was set carries none, and a session with a physical location carries an address instead.
 *    Every control here is drawn from the field that would make it work, so a missing field
 *    removes the control rather than disabling it — and a missing link says who sends it (0058).
 * 3. **Nothing is booked, for almost everybody**, and that is not an empty state to design — the
 *    card simply is not rendered. `BookScreen` holds that: `booking === null` draws nothing.
 */

/** `Intl` throws on a zone name it does not know; the device's own zone is the fallback. */
function formatIn(
  locale: Locale,
  ms: number,
  options: Intl.DateTimeFormatOptions,
  timeZone: string | undefined,
): string {
  const tag = locale === 'ru' ? 'ru-RU' : 'en-GB';
  try {
    return new Intl.DateTimeFormat(tag, { ...options, timeZone }).format(ms);
  } catch {
    return new Intl.DateTimeFormat(tag, options).format(ms);
  }
}

/* h23 so a Russian clock reads «9:00» and never «9:00 AM»; `numeric` so it is not «09:00». */
const CLOCK: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hourCycle: 'h23' };

/** «6 октября · 10:00 – 11:00 · 60 мин» — a session's date, hours and length, in `zone`. */
export function whenLine(
  { t, locale }: Translator,
  startsAt: string,
  endsAt: string,
  zone: string | undefined,
): string {
  const starts = Date.parse(startsAt);
  const ends = Date.parse(endsAt);
  return t('app.bookWhen', {
    date: formatIn(locale, starts, { day: 'numeric', month: 'long' }, zone),
    from: formatIn(locale, starts, CLOCK, zone),
    to: formatIn(locale, ends, CLOCK, zone),
    dur: t('app.bookDuration', { n: Math.round((ends - starts) / 60_000) }),
  });
}

/**
 * The countdown, said out loud.
 *
 * `describeCountdown` returns `{ kind: 'tomorrow', hour: 9, minute: 0 }` and refuses to build the
 * sentence itself, which is what lets the Russian be Russian: three plural forms for минуты, часы
 * and дни, and a «завтра в 9:00» that is a calendar fact rather than an arithmetic one.
 */
function countdownLine(countdown: Countdown, { t, locale }: Translator): string {
  switch (countdown.kind) {
    case 'live':
      return t('app.bookLive');
    case 'minutes':
      return plural(locale, countdown.minutes, {
        one: t('app.bookInMinutesOne', { n: countdown.minutes }),
        few: t('app.bookInMinutesFew', { n: countdown.minutes }),
        many: t('app.bookInMinutesMany', { n: countdown.minutes }),
      });
    case 'hours':
      return plural(locale, countdown.hours, {
        one: t('app.bookInHoursOne', { n: countdown.hours }),
        few: t('app.bookInHoursFew', { n: countdown.hours }),
        many: t('app.bookInHoursMany', { n: countdown.hours }),
      });
    case 'tomorrow':
      // Built from the shape rather than from the instant: these two numbers are already the
      // wall-clock reading in the zone the day boundary was decided in.
      return t('app.bookTomorrowAt', {
        time: `${countdown.hour}:${String(countdown.minute).padStart(2, '0')}`,
      });
    case 'later':
      return plural(locale, countdown.days, {
        one: t('app.bookInDaysOne', { n: countdown.days }),
        few: t('app.bookInDaysFew', { n: countdown.days }),
        many: t('app.bookInDaysMany', { n: countdown.days }),
      });
    default:
      return '';
  }
}

/**
 * The booked session, as the owner listed it: «вот ссылка на вход, через столько то начнется,
 * дата, время» — in that order of loudness, the countdown as the figure and the date under it.
 *
 * No glass and no photograph: a hairline card on the flat ground, so the buttons in it are
 * rectangles at `--r-control` and not pills (design/CHANGELOG.md §13).
 *
 * Two additions (0058). A session with no link says who sends it and offers the coach, rather
 * than a bare «ссылки нет». And every message about the session — the confirmation, both
 * reminders, the link — goes through the bot, which reaches only people with Telegram linked:
 * `telegram === false` outside Telegram says so and points at the bot. Inside the Mini App the
 * link is made on launch, so the line would be telling them to open what they have open.
 */
export function UpcomingSession({
  booking,
  now,
  telegram,
  inTelegram,
  onMove,
  onContact,
}: {
  booking: CoachBooking;
  now: number;
  /** Whether the bot can reach them (`my_telegram_linked`); null when it could not be asked. */
  telegram: boolean | null;
  /** The app is open inside Telegram. */
  inTelegram: boolean;
  onMove: () => void;
  onContact: () => void;
}) {
  const tr = useT();
  const { t } = tr;
  const zone = deviceTimeZone() ?? booking.timezone ?? undefined;
  const countdown = describeCountdown(booking.startsAt, booking.endsAt, now, zone);

  // The session ended while the tab sat open; the screen asks for the next one (`BookScreen`).
  if (countdown.kind === 'past') return null;

  const when = whenLine(tr, booking.startsAt, booking.endsAt, zone);

  return (
    <section className="glass-card flex flex-col gap-4 rounded-card p-5">
      <div className="flex flex-col gap-2">
        <span className="eyebrow">{t('app.bookUpcoming')}</span>
        {/* 1.2, as the lockup above: «идёт сейчас» and «через 2 часа» both drop a descender. */}
        <p className="display text-[clamp(26px,7.5vw,34px)] leading-[1.2] text-balance">
          {countdownLine(countdown, tr)}
        </p>
        <p className="tabular text-[13px] leading-snug text-muted">{when}</p>
      </div>

      {/* The room opens fifteen minutes before (0055): until then the button would only take
          somebody into an empty call, so its place says when it will be there. */}
      {booking.joinUrl && joinOpen(booking.startsAt, booking.endsAt, now) ? (
        <LinkButton href={booking.joinUrl} size="lg" fullWidth external>
          {t('app.bookJoin')}
        </LinkButton>
      ) : booking.joinUrl ? (
        <p className="text-[13px] leading-snug text-muted">
          {t('app.bookJoinSoon', { n: JOIN_OPENS_MINUTES })}
        </p>
      ) : booking.locationText ? (
        <p className="text-[15px] leading-snug">
          {t('app.bookPlace', { place: booking.locationText })}
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          <p className="text-[13px] leading-snug text-muted">{t('app.bookNoLink')}</p>
          <div className="-mb-2 -ml-4.5 flex">
            <Button variant="ghost" size="sm" onClick={onContact}>
              {t('app.bookContact')}
            </Button>
          </div>
        </div>
      )}

      {telegram === false && !inTelegram ? (
        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <p className="text-[13px] leading-snug text-muted">{t('app.bookTelegramPrompt')}</p>
          <LinkButton
            href={LINKS.telegramBot}
            variant="secondary"
            size="sm"
            external
            className="self-start"
          >
            {t('app.bookTelegramOpen')}
          </LinkButton>
        </div>
      ) : null}

      {/*
       * A session booked in the app (it has a coach, 0055) moves here, by the owner's rule: the
       * client moves it themselves 24 hours or more ahead, into a free slot; later than that only
       * the coach can, so the action becomes a message to him. There is no cancel — no
       * self-cancel and no refund. `-ml-4.5` pulls the ghost label back onto the card's edge.
       */}
      {booking.coachId ? (
        canSelfMove(booking.startsAt, now) ? (
          <div className="-mb-2 -ml-4.5 flex">
            <Button variant="ghost" size="sm" onClick={onMove}>
              {t('app.bookMove')}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <p className="text-xs leading-snug text-muted-2">{t('app.bookMoveLate')}</p>
            <div className="-mb-2 -ml-4.5 flex">
              <Button variant="ghost" size="sm" onClick={onContact}>
                {t('app.bookContact')}
              </Button>
            </div>
          </div>
        )
      ) : null}
    </section>
  );
}

/**
 * A session the coach cancelled that has not happened yet (0058). The client cannot cancel, so
 * this is news to them, and the bot that would have said it reaches only people with Telegram.
 * Shown in the booked card's place when nothing else is booked: what happened, when it was, and
 * the one way forward.
 */
export function CancelledSession({
  booking,
  onContact,
}: {
  booking: CoachBooking;
  onContact: () => void;
}) {
  const tr = useT();
  const { t } = tr;
  const zone = deviceTimeZone() ?? booking.timezone ?? undefined;
  return (
    <section role="status" className="glass-card flex flex-col gap-3 rounded-card p-5">
      <span className="font-display text-[17px] leading-snug">{t('app.bookCancelled')}</span>
      <p className="text-[13px] leading-snug text-muted">
        {t('app.bookCancelledNote', {
          when: whenLine(tr, booking.startsAt, booking.endsAt, zone),
        })}
      </p>
      <div className="-mb-2 -ml-4.5 flex">
        <Button variant="ghost" size="sm" onClick={onContact}>
          {t('app.bookContact')}
        </Button>
      </div>
    </section>
  );
}

/**
 * The person's sessions could not be read (0058). It used to be silent — «nothing booked» and
 * «could not ask» looked the same — and somebody who has paid saw only the offer to pay. The
 * offer still renders below; this says the list is unknown and asks again.
 */
export function BookingsReadError({ onRetry }: { onRetry: () => void }) {
  const { t } = useT();
  return (
    <div role="alert" className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <p className="text-sm text-muted">{t('app.bookReadError')}</p>
      <Button variant="secondary" size="sm" onClick={onRetry}>
        {t('app.bookReadRetry')}
      </Button>
    </div>
  );
}
