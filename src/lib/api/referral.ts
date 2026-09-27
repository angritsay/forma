/**
 * «Позови друга» (0051): свой код, привязка к чужому, три числа для экрана, и «подтолкнуть
 * напарника» по дуо.
 *
 * Всё — RPC. Таблицы `referral_codes` и `referrals` закрыты наглухо: в них чужие адреса, и наружу
 * они не выходят ни в одном ответе — `my_referrals()` возвращает счётчики, а не людей.
 *
 * `attachReferral` зовётся один раз после входа и анкеты, с кодом, который приехал со ссылкой
 * (`duoInvite.ts`). База молчит, если человек уже привязан или уже был в клубе; ошибками отвечает
 * только на кривой код и на свой собственный — и то, и другое приложение не показывает: человек
 * ничего не нажимал.
 */
import { supabase } from './client';
import { demo } from './demo/load';
import { guard, requireUser, unwrap, unwrapVoid } from './internal';
import { isDemo } from './mode';
import type { ReferralStats } from './types';

/** Тот же шаблон, что `check` на `referral_codes.code` (0051). */
export const REFERRAL_CODE_RE = /^[a-z0-9]{8}$/;

/** Свой код: заводится при первом вызове, дальше тот же самый. */
export async function getMyReferralCode(): Promise<string> {
  if (isDemo()) return (await demo()).getMyReferralCode();
  return guard(async () => {
    await requireUser();
    return unwrap<string>(await supabase().rpc('my_referral_code'));
  });
}

/** Привязаться к коду подруги. Молчит, если поздно или незачем; `invalid_code` / `own_code`. */
export async function attachReferral(code: string): Promise<void> {
  if (isDemo()) return (await demo()).attachReferral(code);
  return guard(async () => {
    await requireUser();
    unwrapVoid(await supabase().rpc('referral_attach', { p_code: code }));
  });
}

interface DbReferralStats {
  attached: number | null;
  rewarded: number | null;
  days_earned: number | null;
}

export async function getMyReferrals(): Promise<ReferralStats> {
  if (isDemo()) return (await demo()).getMyReferrals();
  return guard(async () => {
    await requireUser();
    const rows = unwrap<DbReferralStats[]>(await supabase().rpc('my_referrals'));
    const r = rows[0];
    return {
      attached: r?.attached ?? 0,
      rewarded: r?.rewarded ?? 0,
      daysEarned: r?.days_earned ?? 0,
    };
  });
}

/**
 * «{имя} уже сделал(а) задание — твоя очередь» напарнику по дуо. Раз в день в каждую сторону —
 * повтор в тот же день база молча склеивает. `no_pair`, если пары нет.
 */
export async function nudgePartner(): Promise<void> {
  if (isDemo()) return (await demo()).nudgePartner();
  return guard(async () => {
    await requireUser();
    unwrapVoid(await supabase().rpc('club_duo_nudge'));
  });
}
