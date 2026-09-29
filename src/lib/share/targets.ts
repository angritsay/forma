/**
 * Links into the messengers' own «send to a chat» screens, for the app and the static site alike.
 *
 * Pure strings and nothing imported, so a site island can use them without pulling in the app.
 * Both halves of each link are encoded: a title with «&» or «#» in it would otherwise cut the
 * link short, and a Cyrillic text would reach the messenger as mojibake.
 */

/** `t.me/share/url` — Telegram's picker, opened with the link and a line of text already in it. */
export function telegramShareUrl(url: string, text: string): string {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

/**
 * `wa.me/?text=` — WhatsApp's picker. It has no separate link field: the link goes inside the text,
 * where WhatsApp makes it clickable and builds the preview from it.
 */
export function waUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
