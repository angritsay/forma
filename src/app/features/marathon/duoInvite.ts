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
import { isAppError } from '@/lib/api/errors';

export const DUO_INVITE_KEY = 'forma.duoInvite';

/** Тот же шаблон, что `check` на `club_duo_invites.token` (0034): всё прочее не наше. */
const TOKEN_RE = /^[A-Za-z0-9_-]{16,64}$/;

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function storage(): StorageLike | null {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage;
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
  if (isAppError(e) && e.code === 'network') {
    return { message: 'common.errorOffline', retry: true };
  }
  const reason = isAppError(e) ? e.message : '';
  return { message: REASONS[reason] ?? 'app.duoRedeemFailed', retry: false };
}
