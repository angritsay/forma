/**
 * `ShareInvite`'s state, as a reducer the island only dispatches to — so every rule about what
 * the card shows is a pure function with a test (`shareInviteState.test.ts`).
 *
 * The card is rendered twice: once at build time, where there is no today and no browser storage,
 * and once in the browser. React requires the first client render to match the HTML, so the state
 * starts in the build's shape (`now: null`, nobody's code) and the browser's facts arrive in one
 * `hydrate` after mount: today's date, the origin, and the sender's cached code and name
 * (`myRef()`, read in a try/catch — private mode and blocked storage simply mean «no code»).
 *
 * - **The name field** starts empty; `hydrate` fills it with the cached first name only if the
 *   person has not typed yet, so a slow mount never overwrites what they wrote.
 * - **Copy** flips to «Ссылка скопирована» (or, when the clipboard refuses, to a line pointing at
 *   the link in the message) and back after a timeout the island owns.
 * - **`hydrate`** runs again on every tap that sends or copies and whenever the tab comes back, so
 *   the date and the sender's code are never those of a stale mount.
 * - **The calendar** is a small disclosure of two links (Google, `.ics`), open or closed.
 *
 * {@link inviteView} turns the state into what is drawn: the composed message (`compose.ts`), which
 * referral row to show (A: no cached code — «Сделать ссылку личной»; B: the link is personal), and
 * whether the typed name is being dropped.
 */
import type { Locale } from '@/content/schema';
import { cleanName } from '@/lib/share/invite';
import { composeInvite, type ComposeCopy, type InviteMessage } from '@/lib/share/compose';

export interface Mine {
  code: string | null;
  name: string | null;
}

export interface InviteState {
  now: Date | null;
  origin: string;
  mine: Mine;
  name: string;
  /** The person has typed into the name field; `hydrate` leaves it alone from then on. */
  touched: boolean;
  /** The copy button's feedback: idle, «Ссылка скопирована», or the clipboard refused. */
  copied: 'idle' | 'ok' | 'failed';
  calendarOpen: boolean;
}

export type InviteAction =
  | { type: 'hydrate'; now: Date; origin: string; mine: Mine }
  | { type: 'name'; value: string }
  | { type: 'copied' }
  | { type: 'copyFailed' }
  | { type: 'copyReset' }
  | { type: 'calendar'; open?: boolean };

/** The name field's limit, the same 16 as `NAME_RE`. */
export const NAME_MAX = 16;

export function initialInviteState(origin: string): InviteState {
  return {
    now: null,
    origin,
    mine: { code: null, name: null },
    name: '',
    touched: false,
    copied: 'idle',
    calendarOpen: false,
  };
}

export function inviteReducer(state: InviteState, action: InviteAction): InviteState {
  switch (action.type) {
    case 'hydrate':
      return {
        ...state,
        now: action.now,
        origin: action.origin,
        mine: action.mine,
        name: state.touched ? state.name : (action.mine.name ?? ''),
      };
    case 'name':
      return { ...state, name: action.value.slice(0, NAME_MAX), touched: true };
    case 'copied':
      return { ...state, copied: 'ok' };
    case 'copyFailed':
      return { ...state, copied: 'failed' };
    case 'copyReset':
      return { ...state, copied: 'idle' };
    case 'calendar':
      return { ...state, calendarOpen: action.open ?? !state.calendarOpen };
  }
}

export interface InviteView extends InviteMessage {
  /** Row B («ссылка личная») instead of row A («сделать ссылку личной»). */
  personal: boolean;
  /** Something is typed in the name field that will not be used. */
  nameRejected: boolean;
}

export function inviteView(state: InviteState, locale: Locale, copy: ComposeCopy): InviteView {
  const message = composeInvite({
    locale,
    copy,
    origin: state.origin,
    now: state.now,
    mine: state.mine,
    typedName: state.name,
  });
  return {
    ...message,
    personal: message.withRef,
    nameRejected: state.name.trim() !== '' && cleanName(state.name) === null,
  };
}
