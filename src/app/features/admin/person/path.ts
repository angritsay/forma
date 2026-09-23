/**
 * The person page's address: `/admin/people/<email>`.
 *
 * The address is `encodeURIComponent`'d on the way in, so a `+` or a `#` in somebody's email
 * cannot end the path early or turn into a space. On the way out the router has usually decoded it
 * already; {@link emailFromParam} decodes only what is still encoded, so a second pass cannot eat a
 * literal `%` — and it never throws on a malformed escape, because a hand-edited URL is a normal
 * thing for the owner to paste.
 */
import { EMAIL_RE } from '@/lib/api/internal';

export const PERSON_ROUTE = '/admin/people/:email';

/** The page for one address. */
export function personPath(email: string): string {
  return `/admin/people/${encodeURIComponent(email.trim().toLowerCase())}`;
}

/** The address a route parameter names, normalised; null when it is not an address at all. */
export function emailFromParam(param: string | undefined): string | null {
  if (!param) return null;
  let value = param;
  if (/%[0-9a-f]{2}/i.test(value)) {
    try {
      value = decodeURIComponent(value);
    } catch {
      return null;
    }
  }
  const clean = value.trim().toLowerCase();
  return EMAIL_RE.test(clean) ? clean : null;
}
