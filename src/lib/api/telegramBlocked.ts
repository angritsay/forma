/**
 * Which people have blocked the bot (0059), for the admin.
 *
 * The sender remembers a 403 on `profiles.telegram_blocked_at` and stops writing to that chat;
 * the admin needs to know it too, because «придёт сообщение в бота» is then not true — the person
 * page and the booking rows say so. `admin_telegram_blocked(p_emails)` answers only for the
 * addresses asked about, and only to an admin.
 *
 * A courtesy, never a blocker: the callers treat a failure as «nobody», because the screens work
 * the same without it.
 */
import { supabase } from './client';
import { guard, unwrapMaybe } from './internal';
import { isDemo } from './mode';

/** The lower-cased addresses among `emails` whose owner has blocked the bot. */
export async function listTelegramBlocked(emails: readonly string[]): Promise<Set<string>> {
  const asked = [...new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean))];
  if (asked.length === 0 || isDemo()) return new Set();
  return guard(async () => {
    const rows = unwrapMaybe<{ email: string }[]>(
      await supabase().rpc('admin_telegram_blocked', { p_emails: asked.slice(0, 500) }),
    );
    return new Set((rows ?? []).map((r) => r.email.toLowerCase()));
  });
}
