/**
 * `t.me/share/url` — Telegram's own «send to a chat» sheet. It lives in `src/lib/share/targets.ts`
 * now, next to WhatsApp's, where the static site can reach it too; re-exported for the admin.
 */
export { telegramShareUrl } from '@/lib/share/targets';
