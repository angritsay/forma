/**
 * «Позвать с собой» (client:visible): the card that sends a friend a link to start on Monday
 * together (site synthesis §4). It sits in the homepage's `#together` block and at the foot of
 * `/together/` («Позвать ещё кого-то»).
 *
 * What it draws, top to bottom:
 * - **The date chip** — «Старт — понедельник, 5 октября» / «завтра, …» / «сегодня», Monday in
 *   Moscow. The static HTML cannot know today, so it says «в ближайший понедельник» until the
 *   browser has mounted.
 * - **«Как тебя подписать»** — optional, up to 16 letters. The name rides in the link as `from`
 *   only if `cleanName` keeps it; a signed-in sender's first name (`forma.myName`) is prefilled.
 * - **«Что придёт в сообщении»** — the message itself, as the friend will get it. Plain text in a
 *   bubble: nothing here is ever set as HTML.
 * - **The buttons.** «Отправить» (the club's warm gradient under ink — this card has no neon; the
 *   page's neon is workout 1) opens the system share sheet *inside the tap* — iOS refuses a share
 *   that is not the direct result of a gesture, so nothing is awaited before `navigator.share` —
 *   and falls back to Telegram's picker where there is no sheet. Then Telegram, WhatsApp, «Скопировать
 *   ссылку» → «Ссылка скопирована», and «В календарь» with a Google template or an `.ics` file,
 *   both all-day events on that Monday.
 * - **The referral row.** Without a cached code (`forma.myRef`): «+30 дней клуба вам двоим — если
 *   ссылка личная…» and «Сделать ссылку личной», which opens the app's invite screen; the app then
 *   caches the code and this row turns into B, «Ссылка личная…», and the link carries `ref`.
 * - **Small print** — the app's own `app.inviteNote`, quoted, and «Скидки нет — есть дни и пара».
 *
 * The plain link promises nothing: the +30 line enters the message only with the sender's code.
 * Every rule lives in pure modules with tests — the composition in `@/lib/share/compose`, the
 * state in `shareInviteState.ts` — and the island imports neither the app nor the dictionaries:
 * the words arrive as props, built by Astro (`inviteCopy`), so the page ships only these strings.
 */
import { useEffect, useId, useReducer, useRef } from 'react';
import type { Locale } from '@/content/schema';
import type { ComposeCopy } from '@/lib/share/compose';
import { gcalUrl, icsBlob, telegramShareUrl, waUrl } from '@/lib/share/invite';
import type { InviteCalendarCopy } from '@/lib/share/inviteCopy';
import { myRef } from '@/lib/referral/mine';
import { copyText } from './shareHome';
import {
  initialInviteState,
  inviteReducer,
  inviteView,
  NAME_MAX,
  type InviteAction,
} from './shareInviteState';

export interface ShareInviteLabels {
  /** The card's kicker. */
  eyebrow: string;
  /** «Старт — {date}». */
  chip: string;
  nameLabel: string;
  namePlaceholder: string;
  nameHint: string;
  previewLabel: string;
  send: string;
  copy: string;
  copied: string;
  /** The clipboard refused: the link is in the message above. */
  copyFailed: string;
  calendar: string;
  calendarGoogle: string;
  calendarFile: string;
  /** Row A: no personal link yet. */
  refOff: string;
  refOffCta: string;
  /** Row B: the link is personal. */
  refOn: string;
  /** `app.inviteNote`, verbatim. */
  note: string;
  noDiscount: string;
}

export interface ShareInviteProps {
  locale: Locale;
  /** `inviteCopy(locale)`: the message's templates and the calendar's. */
  copy: ComposeCopy & { calendar: InviteCalendarCopy };
  /** The site's canonical origin, for the build's HTML; the browser's own replaces it on mount. */
  origin: string;
  /** The share sheet's title. */
  shareTitle: string;
  /** `appHref('/invite', { locale })` — where a personal link is made. */
  inviteHref: string;
  /** `appHref('/start', { locale })` — what the calendar event opens. */
  startHref: string;
  labels: ShareInviteLabels;
  class?: string;
}

/** Today, the origin and the sender's cached code, as the browser knows them right now. */
function browserFacts(): InviteAction {
  return { type: 'hydrate', now: new Date(), origin: window.location.origin, mine: myRef() };
}

function fill(template: string, params: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (all, k: string) => params[k] ?? all);
}

const base =
  'control-label inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control transition-[background-color,color,opacity,transform] duration-150 ease-(--ease-out) active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
const gradient = `${base} h-14 px-8 text-[15px] bg-warm text-ink hover:opacity-90`;
const plain = `${base} h-12 px-6 text-[15px] bg-primary text-on-primary hover:opacity-85`;
const plainSm = `${base} tap-target-y h-10 px-4.5 text-[14px] bg-primary text-on-primary hover:opacity-85`;
const ghost = `${base} h-12 px-4 text-[15px] bg-transparent text-muted hover:text-text`;
const menuLink =
  'flex min-h-11 items-center text-[14px] text-text underline decoration-border-strong underline-offset-4 hover:decoration-text';

export default function ShareInvite({
  locale,
  copy,
  origin,
  shareTitle,
  inviteHref,
  startHref,
  labels,
  class: className = '',
}: ShareInviteProps) {
  const id = useId();
  const [state, dispatch] = useReducer(inviteReducer, origin, initialInviteState);
  const timer = useRef(0);
  const view = inviteView(state, locale, copy);

  // The browser's facts after the first render has matched the static HTML — and again whenever
  // the tab comes back (back-forward cache, a tab left open over midnight, a code cached by the
  // app in the meantime), so the chip, the preview and the links never go stale.
  useEffect(() => {
    const hydrate = () => dispatch(browserFacts());
    hydrate();
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) hydrate();
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') hydrate();
    };
    window.addEventListener('pageshow', onShow);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearTimeout(timer.current);
      window.removeEventListener('pageshow', onShow);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  /**
   * The message as of this very tap: today and the cached code are read again, synchronously, so
   * a send is never composed from a stale mount (and the share still happens inside the gesture).
   */
  function freshView() {
    const facts = browserFacts();
    dispatch(facts);
    return inviteView(inviteReducer(state, facts), locale, copy);
  }

  function onSend() {
    const now = freshView();
    if (typeof navigator.share === 'function') {
      // Inside the tap, nothing awaited first; a dismissed sheet rejects with AbortError.
      navigator.share({ title: shareTitle, text: now.text }).catch(() => undefined);
      return;
    }
    window.open(telegramShareUrl(now.url, now.bare), '_blank', 'noopener,noreferrer');
  }

  function onCopy() {
    const now = freshView();
    void copyText(now.url).then((ok) => {
      dispatch({ type: ok ? 'copied' : 'copyFailed' });
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => dispatch({ type: 'copyReset' }), ok ? 2000 : 4000);
    });
  }

  const calendarEvent = view.date
    ? {
        date: view.date,
        title: copy.calendar.title,
        details: fill(copy.calendar.details, {
          url: `${state.origin.replace(/\/+$/, '')}${startHref}`,
        }),
      }
    : null;

  function onIcs() {
    if (!calendarEvent) return;
    const url = URL.createObjectURL(
      icsBlob({ ...calendarEvent, host: new URL(state.origin).host }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `forma-${calendarEvent.date}.ics`;
    document.body.append(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    dispatch({ type: 'calendar', open: false });
  }

  const nameId = `${id}-name`;
  const hintId = `${id}-hint`;
  const menuId = `${id}-calendar`;

  return (
    <div
      className={`club-aurora-host glass-card-2 relative overflow-hidden rounded-card border border-border-strong p-6 md:p-8 ${className}`}
    >
      <span className="club-aurora" aria-hidden="true" />
      <span className="bg-cross absolute inset-x-0 top-0 h-px" aria-hidden="true" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="eyebrow">{labels.eyebrow}</p>
        <span className="glass-tag inline-flex min-h-8 items-center rounded-full px-3 text-[13px] text-text">
          {fill(labels.chip, { date: view.label })}
        </span>
      </div>

      <div className="mt-6 grid gap-8 md:grid-cols-2 md:gap-10">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor={nameId} className="text-[14px] text-text">
              {labels.nameLabel}
            </label>
            <input
              id={nameId}
              type="text"
              autoComplete="given-name"
              maxLength={NAME_MAX}
              value={state.name}
              placeholder={labels.namePlaceholder}
              aria-describedby={hintId}
              aria-invalid={view.nameRejected || undefined}
              onChange={(e) => dispatch({ type: 'name', value: e.target.value })}
              className={`h-12 w-full rounded-control border bg-surface-2 px-4 text-base text-text placeholder:text-muted-2 focus:border-accent focus:outline-none ${
                view.nameRejected ? 'border-danger' : 'border-border'
              }`}
            />
            <p
              id={hintId}
              className={`text-[12px] leading-snug ${view.nameRejected ? 'text-danger' : 'text-muted-2'}`}
            >
              {labels.nameHint}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={onSend}
              className={`${gradient} w-full`}
              data-goal="share_open"
            >
              {labels.send}
              <span className="glyph" aria-hidden="true">
                ↗
              </span>
            </button>
            <div className="grid grid-cols-2 gap-2">
              <a
                href={telegramShareUrl(view.url, view.bare)}
                target="_blank"
                rel="noopener noreferrer"
                className={plain}
                data-goal="share_telegram"
              >
                Telegram
              </a>
              <a
                href={waUrl(view.text)}
                target="_blank"
                rel="noopener noreferrer"
                className={plain}
                data-goal="share_whatsapp"
              >
                WhatsApp
              </a>
            </div>
            <div className="flex flex-wrap gap-x-2">
              <button type="button" onClick={onCopy} className={ghost} data-goal="share_copy">
                <span aria-live="polite">
                  {state.copied === 'ok'
                    ? labels.copied
                    : state.copied === 'failed'
                      ? labels.copyFailed
                      : labels.copy}
                </span>
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: 'calendar' })}
                className={ghost}
                aria-expanded={state.calendarOpen}
                aria-controls={menuId}
                disabled={!calendarEvent}
                data-goal="share_calendar"
              >
                {labels.calendar}
                <span className="glyph" aria-hidden="true">
                  {state.calendarOpen ? '−' : '+'}
                </span>
              </button>
            </div>
            {state.calendarOpen && calendarEvent && (
              <ul id={menuId} className="flex flex-col border-t border-border pt-2">
                <li>
                  <a
                    href={gcalUrl(calendarEvent)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={menuLink}
                  >
                    {labels.calendarGoogle}
                  </a>
                </li>
                <li>
                  <button type="button" onClick={onIcs} className={menuLink}>
                    {labels.calendarFile}
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <p className="eyebrow">{labels.previewLabel}</p>
          <p className="rounded-card rounded-bl-md border border-border bg-surface-2 p-4 text-[14px] leading-relaxed break-words whitespace-pre-line text-text">
            {view.text}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5">
        {view.personal ? (
          <p className="text-[14px] leading-snug text-text">{labels.refOn}</p>
        ) : (
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <p className="max-w-md text-[14px] leading-snug text-text">{labels.refOff}</p>
            <a href={inviteHref} className={plainSm} data-app-link data-goal="personal_link">
              {labels.refOffCta}
            </a>
          </div>
        )}
        <p className="text-[13px] leading-snug text-muted">
          {labels.note} {labels.noDiscount}
        </p>
      </div>
    </div>
  );
}
