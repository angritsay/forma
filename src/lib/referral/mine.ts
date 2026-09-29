/**
 * The signed-in person's own referral code, cached for the static site.
 *
 * The site's invite (`ShareInvite`) has no session and no Supabase: it cannot ask
 * `my_referral_code()`. What it can read is this origin's `localStorage`, which the app shares.
 * So the app leaves the code there the moment it has it — `ClubInviteScreen` and `ClubShare`
 * call {@link rememberMyRef} — and the site's link then carries `&ref=<code>&from=<name>`.
 *
 * - `forma.myRef` — the code, in the shape of `referral_codes.code` (0051) or not at all.
 * - `forma.myName` — the first word of the profile's display name, cleaned by the invite's own
 *   rule (`cleanName`), or removed. It is what the friend sees in «{Имя} зовёт тебя».
 *
 * Both belong to whoever is signed in, so both go with the session: the session store calls
 * {@link forgetMyRef} when it ends and when another account signs in on the same device. The
 * site also refuses to stash a `?ref=` equal to the cached code — «это твоя ссылка».
 *
 * Imports nothing from the app or the API: the site bundle reads it too.
 */
import { cleanName, firstName } from '@/lib/share/invite';
import { isReferralCode, localStore } from './pending';

export const MY_REF_KEY = 'forma.myRef';
export const MY_NAME_KEY = 'forma.myName';

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** Cache the caller's code and first name. A code not in our shape is not stored. */
export function rememberMyRef(
  code: string | null | undefined,
  displayName: string | null | undefined,
  store: StorageLike | null = localStore(),
): boolean {
  if (!store || !isReferralCode(code)) return false;
  try {
    store.setItem(MY_REF_KEY, code);
    const name = firstName(displayName);
    if (name) store.setItem(MY_NAME_KEY, name);
    else store.removeItem(MY_NAME_KEY);
    return true;
  } catch {
    return false;
  }
}

/** The cached code and name, each only in its valid shape. */
export function myRef(store: StorageLike | null = localStore()): {
  code: string | null;
  name: string | null;
} {
  if (!store) return { code: null, name: null };
  try {
    const code = store.getItem(MY_REF_KEY);
    return {
      code: isReferralCode(code) ? code : null,
      name: cleanName(store.getItem(MY_NAME_KEY)),
    };
  } catch {
    return { code: null, name: null };
  }
}

/** Drop both: the session they belonged to has ended. */
export function forgetMyRef(store: StorageLike | null = localStore()): void {
  try {
    store?.removeItem(MY_REF_KEY);
    store?.removeItem(MY_NAME_KEY);
  } catch {
    /* Private mode: nothing to remove. */
  }
}
