/**
 * The brand's display device — two weights in one line: «ПРИСЕД без боли», «БАЗА без оборудования»,
 * «28 дней». The first word carries the weight (800) and the rest goes light (200).
 *
 * Content stores a title as one string, so the split has to be decided here, once, the same way
 * for every screen: the first whitespace-separated word is the heavy half. A one-word title is all
 * heavy — there is nothing to contrast it with — and a title that is only whitespace splits to two
 * empty halves so the caller renders nothing rather than a stray space.
 */
export interface DisplaySplit {
  /** The heavy half — the first word. */
  head: string;
  /** The light half — everything after the first word; empty when there is nothing. */
  tail: string;
}

export function splitDisplay(title: string): DisplaySplit {
  const clean = title.trim().replace(/\s+/g, ' ');
  if (!clean) return { head: '', tail: '' };
  const space = clean.indexOf(' ');
  if (space === -1) return { head: clean, tail: '' };
  return { head: clean.slice(0, space), tail: clean.slice(space + 1) };
}
