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
 * **`compact`** — the homepage's version: no name field, the message drawn as an outgoing chat
 * bubble inside a phone (the date chip over it, the bubble clamped to five lines), then «Отправить»
 * and one row of four icon buttons — Telegram, WhatsApp, «Ссылка», «Календарь» (the short labels,
 * so none wraps under its 48 px icon) — then the referral row. No kicker and no small print: the
 * section's own title names it, and the reward's terms are `/together/`'s questions. Same state,
 * same links, same rules; only the drawing is shorter.
 *
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
  /** The compact row's one-word labels under the icons: «Ссылка», «Скопировано», «Календарь». */
  copyShort: string;
  copiedShort: string;
  calendarShort: string;
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
  /** The homepage's shorter drawing: phone with the message, one button, a row of icons. */
  compact?: boolean;
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
const iconButton =
  'flex size-12 items-center justify-center rounded-full border border-border-strong bg-surface-2 text-text transition-colors group-hover:bg-surface-3';
const iconLabel = 'text-[12px] leading-tight text-muted group-hover:text-text';

/** Stroke glyphs for the compact row, 24×24, drawn in `currentColor`; hidden from assistive tech. */
const GLYPHS = {
  telegram: 'M21 4 3 11.2l6.2 2.3M21 4l-3.4 16-8.4-6.5M21 4 9.2 13.5v5.6l3.1-3.4',
  whatsapp:
    'M4.2 20 5.5 16a8 8 0 1 1 3 3zM9.2 8.4c-.4 2.9 2.6 6 5.5 5.6l.9-1.5-1.9-1-1 .8c-.9-.4-1.6-1.1-2-2l.8-1-1-1.9z',
  copy: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  calendar: 'M4 6h16v14H4zM4 10.5h16M8 3v4M16 3v4',
} as const;

function Glyph({ d }: { d: string }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" className="size-5">
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
  compact = false,
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

  const copyLabel =
    state.copied === 'ok'
      ? labels.copied
      : state.copied === 'failed'
        ? labels.copyFailed
        : labels.copy;

  const calendarMenu = (menuId: string) =>
    state.calendarOpen && calendarEvent ? (
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
    ) : null;

  const referral = view.personal ? (
    <p className="text-[14px] leading-snug text-text">{labels.refOn}</p>
  ) : (
    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <p className="max-w-md text-[14px] leading-snug text-text">{labels.refOff}</p>
      <a href={inviteHref} className={plainSm} data-app-link data-goal="personal_link">
        {labels.refOffCta}
      </a>
    </div>
  );

  if (compact) {
    const compactMenuId = `${id}-calendar`;
    return (
      <div
        className={`club-aurora-host glass-card-2 relative overflow-hidden rounded-card border border-border-strong p-5 md:p-8 ${className}`}
      >
        <span className="club-aurora" aria-hidden="true" />
        <span className="bg-cross absolute inset-x-0 top-0 h-px" aria-hidden="true" />

        <div className="grid items-center gap-8 md:grid-cols-[280px_minmax(0,1fr)] md:gap-12">
          {/* The message as the friend gets it: an outgoing bubble on a phone. Plain text only. */}
          <figure className="glass-card relative mx-auto w-[280px] max-w-full rounded-card border border-border-strong p-2">
            <div className="flex min-h-[260px] flex-col gap-3 overflow-hidden rounded-inner border border-border bg-bg px-3 pt-2 pb-4">
              <div className="mx-auto h-1 w-16 rounded-full bg-surface-3" aria-hidden="true" />
              <figcaption className="self-center">
                <span className="glass-tag inline-flex min-h-7 items-center rounded-full px-3 text-[12px] text-text">
                  {fill(labels.chip, { date: view.label })}
                </span>
              </figcaption>
              {/* The clamp sits on an inner span: on the padded bubble the sixth line would show
                  through the bottom padding. */}
              <p className="mt-auto max-w-[92%] self-end rounded-tile rounded-br-md bg-accent px-3.5 py-2.5 text-[13px] leading-snug break-words whitespace-pre-line text-ink">
                <span className="line-clamp-5">{view.text}</span>
              </p>
            </div>
          </figure>

          <div className="flex flex-col gap-5">
            <button
              type="button"
              onClick={onSend}
              className={`${gradient} w-full sm:w-auto sm:self-start`}
              data-goal="share_open"
            >
              {labels.send}
              <span className="glyph" aria-hidden="true">
                ↗
              </span>
            </button>
            <ul className="grid max-w-md grid-cols-4 gap-2">
              <li>
                <a
                  href={telegramShareUrl(view.url, view.bare)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-1.5 text-center"
                  data-goal="share_telegram"
                >
                  <span className={iconButton}>
                    <Glyph d={GLYPHS.telegram} />
                  </span>
                  <span className={iconLabel}>Telegram</span>
                </a>
              </li>
              <li>
                <a
                  href={waUrl(view.text)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-1.5 text-center"
                  data-goal="share_whatsapp"
                >
                  <span className={iconButton}>
                    <Glyph d={GLYPHS.whatsapp} />
                  </span>
                  <span className={iconLabel}>WhatsApp</span>
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onCopy}
                  className="group flex w-full flex-col items-center gap-1.5 text-center"
                  data-goal="share_copy"
                >
                  <span className={iconButton}>
                    <Glyph d={GLYPHS.copy} />
                  </span>
                  <span className={iconLabel} aria-live="polite">
                    {state.copied === 'ok'
                      ? labels.copiedShort
                      : state.copied === 'failed'
                        ? labels.copyFailed
                        : labels.copyShort}
                  </span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'calendar' })}
                  className="group flex w-full flex-col items-center gap-1.5 text-center disabled:opacity-50"
                  aria-expanded={state.calendarOpen}
                  aria-controls={compactMenuId}
                  disabled={!calendarEvent}
                  data-goal="share_calendar"
                >
                  <span className={iconButton}>
                    <Glyph d={GLYPHS.calendar} />
                  </span>
                  <span className={iconLabel}>{labels.calendarShort}</span>
                </button>
              </li>
            </ul>
            {calendarMenu(compactMenuId)}
            <div className="border-t border-border pt-4">{referral}</div>
          </div>
        </div>
      </div>
    );
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
                <span aria-live="polite">{copyLabel}</span>
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
            {calendarMenu(menuId)}
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
        {referral}
        <p className="text-[13px] leading-snug text-muted">
          {labels.note} {labels.noDiscount}
        </p>
      </div>
    </div>
  );
}
