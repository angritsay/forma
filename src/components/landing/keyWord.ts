/**
 * Where a headline's key word is — the one word a hero field sets in the brand's light blue and
 * underlines with the swoosh (Style A, global.css header).
 *
 * The key word is the last `count` words of the line: every headline on the site ends on what it
 * is about («…для кроссфита дома», «Одна подписка.», «…под тебя»), so no copy needs a marker and no
 * translation can lose one. Closing punctuation stays outside the key, so the swoosh underlines
 * the word and not its full stop.
 */
export interface KeyWordSplit {
  /** Everything before the key word, with its trailing space. Empty for a one-word headline. */
  head: string;
  key: string;
  /** Punctuation after the key word. */
  tail: string;
}

export function splitKeyWord(text: string, count = 1): KeyWordSplit {
  const words = text.trim().split(/\s+/);
  const n = Math.max(1, Math.min(count, words.length));
  const head = words.slice(0, words.length - n).join(' ');
  const last = words.slice(words.length - n).join(' ');
  const m = /^(.*?)([.,:;!?…»"]*)$/u.exec(last);
  const key = m?.[1] || last;
  const tail = m?.[1] ? (m[2] ?? '') : '';
  return { head: head ? `${head} ` : '', key, tail };
}
