/**
 * Приглашение в пару: ссылка `#/duo/<token>` от подруги.
 *
 * Ссылку открывает человек, который, скорее всего, ещё не вошёл и не прошёл анкету. Поэтому
 * токен сначала **откладывается** в sessionStorage (маршрут `/duo/:token` без охраны), а
 * принимается уже на экране `/duo` за входом и анкетой. Пока он лежит, любой экран в оболочке
 * возвращает человека на `/duo` — после входа, после анкеты, после перезагрузки вкладки.
 *
 * Токен снимается, как только экран попробовал его принять — при успехе, отказе и сбое сети.
 * Лежащий токен, который никогда не примут, возвращал бы человека на один и тот же экран с
 * каждого перехода; «повторить» после сбоя берёт токен из состояния экрана.
 *
 * Чистый модуль, без React: проверяется в node.
 */
import type { TKey } from '@/i18n';
import { isAppError, isNetworkError } from '@/lib/api/errors';

export const DUO_INVITE_KEY = 'forma.duoInvite';
/** The last `startapp` invite already stashed in this session; see `stashStartParam`. */
export const DUO_START_SEEN_KEY = 'forma.duoInviteStartSeen';
/** `t.me/<bot>/<app>?startapp=duo_<token>` — the prefix says what the parameter carries. */
export const DUO_START_PREFIX = 'duo_';
/**
 * Реферальный код (0051): `?startapp=ref_<код>` или `#/ref/<код>`. Живёт в localStorage, а не в
 * сессии: подруга открывает ссылку сегодня, а регистрируется и платит через несколько дней, и
 * код должен дождаться первого входа. Снимается сразу после первой попытки привязки.
 */
export const REFERRAL_KEY = 'forma.referral';
export const REF_START_PREFIX = 'ref_';

/** Тот же шаблон, что `check` на `club_duo_invites.token` (0034): всё прочее не наше. */
const TOKEN_RE = /^[A-Za-z0-9_-]{16,64}$/;
/** Тот же шаблон, что `check` на `referral_codes.code` (0051). */
const CODE_RE = /^[a-z0-9]{8}$/;

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function storage(): StorageLike | null {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage;
  } catch {
    return null;
  }
}

function localStore(): StorageLike | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function isInviteToken(token: string | null | undefined): token is string {
  return typeof token === 'string' && TOKEN_RE.test(token);
}

/** Отложить токен до входа и анкеты. Чужое и пустое не кладётся. */
export function stashDuoInvite(token: string | undefined, store = storage()): boolean {
  if (!store || !isInviteToken(token)) return false;
  try {
    store.setItem(DUO_INVITE_KEY, token);
    return true;
  } catch {
    return false;
  }
}

export function pendingDuoInvite(store = storage()): string | null {
  if (!store) return null;
  try {
    const token = store.getItem(DUO_INVITE_KEY);
    return isInviteToken(token) ? token : null;
  } catch {
    return null;
  }
}

export function clearDuoInvite(store = storage()): void {
  try {
    store?.removeItem(DUO_INVITE_KEY);
  } catch {
    /* приватный режим: снимать нечего */
  }
}

/**
 * Приглашение, пришедшее через ссылку Mini App (`?startapp=duo_<token>`), — в ту же отложенную
 * ячейку, что и `#/duo/<token>`; дальше его ведёт обычный путь `/duo`.
 *
 * Параметр запуска живёт, пока открыт Mini App, и перезагрузка вебвью отдаёт его снова. Уже
 * принятый токен второй раз не кладётся — иначе каждая перезагрузка возвращала бы человека на
 * экран «приглашение уже приняли».
 */
export function stashStartParam(
  param: string | null | undefined,
  store = storage(),
  refStore = localStore(),
): boolean {
  if (!param) return false;
  // Реферальный код (0051) — в свою, долгую ячейку. Повтор при перезагрузке безвреден: код
  // тот же, а снимается он только после попытки привязки.
  if (param.startsWith(REF_START_PREFIX)) {
    return stashReferral(param.slice(REF_START_PREFIX.length), refStore);
  }
  if (!store || !param.startsWith(DUO_START_PREFIX)) return false;
  const token = param.slice(DUO_START_PREFIX.length);
  if (!isInviteToken(token)) return false;
  try {
    if (store.getItem(DUO_START_SEEN_KEY) === token) return false;
    store.setItem(DUO_START_SEEN_KEY, token);
  } catch {
    return false;
  }
  return stashDuoInvite(token, store);
}

/** Реферальный код (0051) — форма `referral_codes.code`, и ничего больше. */
export function isReferralCode(code: string | null | undefined): code is string {
  return typeof code === 'string' && CODE_RE.test(code);
}

/** Отложить код до входа и анкеты. Уже лежащий не перезаписывается: первый код побеждает. */
export function stashReferral(code: string | undefined, store = localStore()): boolean {
  if (!store || !isReferralCode(code)) return false;
  try {
    if (isReferralCode(store.getItem(REFERRAL_KEY))) return false;
    store.setItem(REFERRAL_KEY, code);
    return true;
  } catch {
    return false;
  }
}

export function pendingReferral(store = localStore()): string | null {
  if (!store) return null;
  try {
    const code = store.getItem(REFERRAL_KEY);
    return isReferralCode(code) ? code : null;
  } catch {
    return null;
  }
}

export function clearReferral(store = localStore()): void {
  try {
    store?.removeItem(REFERRAL_KEY);
  } catch {
    /* приватный режим: снимать нечего */
  }
}

/** `https://t.me/<bot>/<app>`, без хвостовых слэшей — или '' для всего, что на неё не похоже. */
function miniAppBase(miniApp?: string): string {
  const app = (miniApp ?? '').trim().replace(/\/+$/, '');
  return /^https:\/\/t\.me\/[A-Za-z0-9_]{5,32}\/[A-Za-z0-9_]{3,30}$/.test(app) ? app : '';
}

/**
 * Адрес приглашения — то, что уедет в переписку.
 *
 * С настроенной ссылкой Mini App (`LINKS.telegramMiniApp`) — `t.me/<bot>/<app>?startapp=duo_…`:
 * в телеграме она открывает приложение внутри него, а не браузер. Без неё — веб-адрес `#/duo/…`.
 */
export function inviteLink(token: string, webUrl: string, miniApp?: string): string {
  const app = miniAppBase(miniApp);
  return app ? `${app}?startapp=${DUO_START_PREFIX}${encodeURIComponent(token)}` : webUrl;
}

/** Реферальная ссылка (0051) — то же правило: `?startapp=ref_<код>` в телеграме, `#/ref/<код>` без него. */
export function referralLink(code: string, webUrl: string, miniApp?: string): string {
  const app = miniAppBase(miniApp);
  return app ? `${app}?startapp=${REF_START_PREFIX}${encodeURIComponent(code)}` : webUrl;
}

/**
 * Что сказать, когда «позвать подругу» не удалось. `null` — промолчать: закрытая шторка
 * «поделиться» приходит ошибкой `AbortError`, но это решение человека, а не сбой.
 */
export function shareFailure(e: unknown): TKey | null {
  if (e instanceof Error && e.name === 'AbortError') return null;
  if (typeof e === 'object' && e !== null && (e as { name?: unknown }).name === 'AbortError') {
    return null;
  }
  if (isNetworkError(e)) return 'common.errorOffline';
  if (isAppError(e) && e.message === 'no_club_access') return 'app.duoInviteNoAccess';
  return 'common.errorGeneric';
}

/** Отказы `club_invite_redeem` (0034), которые человек может понять. */
const REASONS: Record<string, TKey> = {
  no_subscription: 'app.duoRedeemNoSubscription',
  no_club: 'app.duoRedeemNoClub',
  invite_not_found: 'app.duoRedeemNotFound',
  invite_used: 'app.duoRedeemUsed',
  invite_expired: 'app.duoRedeemExpired',
  invite_own: 'app.duoRedeemOwn',
  inviter_not_in_club: 'app.duoRedeemInviterGone',
};

export interface RedeemFailure {
  /** Фраза для человека. */
  message: TKey;
  /** Сбой сети: кнопка — «повторить», а не «в клуб». */
  retry: boolean;
}

export function redeemFailure(e: unknown): RedeemFailure {
  if (isNetworkError(e)) {
    return { message: 'common.errorOffline', retry: true };
  }
  const reason = isAppError(e) ? e.message : '';
  return { message: REASONS[reason] ?? 'app.duoRedeemFailed', retry: false };
}
