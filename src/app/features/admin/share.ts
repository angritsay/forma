/**
 * `t.me/share/url` — Telegram's own «send to a chat» sheet, opened with the link and a line of
 * text already in it. Both halves are encoded: a workout title with «&» or «#» in it would
 * otherwise cut the link short.
 */
export function telegramShareUrl(url: string, text: string): string {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}
