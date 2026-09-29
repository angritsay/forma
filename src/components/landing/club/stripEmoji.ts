/**
 * The app's club copy, without its emoji — for the site, which quotes that copy verbatim.
 *
 * The app ends a few club lines on an emoji («Сделано ☕», «…Третий день подряд 🔥»), and on a
 * phone in the hand that is the voice of a chat. The site sets the same lines as a still picture
 * of that chat inside `ClubDay.astro`, and there the emoji is the one thing the brand keeps off
 * the page: glyphs instead of icons (CLAUDE.md), and never a colour pictograph beside the warm
 * gradient (`contrast-usage.test.ts`). So the words are the app's, taken from `app.*` keys rather
 * than retyped, and only the pictographs come off.
 *
 * What goes: every Extended_Pictographic code point, the variation selector that forces one to
 * colour (U+FE0F), the zero-width joiner that glues a sequence («👩‍💻»), skin-tone modifiers and
 * the keycap combiner. What stays: letters, digits, punctuation and the typographic glyphs the
 * site does use (→, ·, ✓ is not a pictograph). The space an emoji leaves is closed up, so «подряд
 * 🔥» ends on «подряд», and a space left before punctuation («Сделано ☕.») is removed too.
 */
// An alternation, not a character class: a class holding the joiner and the selector reads as one
// «combined character» to a linter and to anyone skimming it.
const PICTOGRAPH = /\p{Extended_Pictographic}|\p{Emoji_Modifier}|\u{FE0F}|\u{200D}|\u{20E3}/gu;

export function stripEmoji(text: string): string {
  return text
    .replace(PICTOGRAPH, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/ +([.,:;!?…])/g, '$1')
    .trim();
}
