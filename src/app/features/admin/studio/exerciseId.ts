/**
 * An id for an exercise created from the cutter, from its Russian name: «Выпад назад» →
 * `vypad_nazad`. The exercise editor asks for the id by hand; on a phone, labelling a dozen clips
 * in a row, typing a Latin slug for each is the step that would not happen, so the cutter makes one.
 *
 * The id has to pass the editor's own rule (`EXERCISE_ID_RE`: `[a-z0-9_]{2,60}`) and must not be
 * taken; a taken one gets `_2`, `_3`… Pure, so the transliteration is tested as a table.
 */
import { EXERCISE_ID_MAX, EXERCISE_ID_MIN } from './limits';

const TRANSLIT: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
};

/** The slug of a name: transliterated, lower case, words joined by `_`, at most the id's length. */
export function slugOfName(name: string): string {
  const latin = [...name.toLowerCase()].map((ch) => TRANSLIT[ch] ?? ch).join('');
  const slug = latin
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, EXERCISE_ID_MAX)
    .replace(/_+$/g, '');
  return slug;
}

/**
 * A free id for a new exercise called `name`. Null when the name gives nothing usable (only
 * punctuation, a single letter) — the screen then asks for a longer name.
 */
export function exerciseIdFromName(name: string, taken: ReadonlySet<string>): string | null {
  const base = slugOfName(name);
  if (base.length < EXERCISE_ID_MIN) return null;
  if (!taken.has(base)) return base;
  for (let n = 2; n < 1000; n++) {
    const suffix = `_${n}`;
    const id = base.slice(0, EXERCISE_ID_MAX - suffix.length).replace(/_+$/g, '') + suffix;
    if (!taken.has(id)) return id;
  }
  return null;
}
