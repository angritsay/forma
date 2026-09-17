/**
 * «Клуб маленьких шагов» — the public facts of the club: the people in it, and the photographs the
 * selling screen is built on.
 *
 * ## Why the quotes are still empty
 *
 * `docs/SPEC.md` forbids invented reviews, testimonials, statistics and before/after claims, and
 * the rule has already been enforced twice on this project. A placeholder testimonial — even an
 * obviously fake one, even one marked TODO — is a sentence that gets forgotten and shipped, and a
 * fabricated result on a page that takes money is the one mistake this product cannot recover
 * from. So `CLUB_RESULTS` is empty, and the screen is built to look finished without it.
 *
 * ## The photographs, and the label over them
 *
 * The owner's mockup makes the photo row the hero: the club's name is composited over it, so an
 * empty row takes the whole top of the screen with it. Her mockup labels that row «Результаты
 * участников» — and the photographs she pasted into it are the ones in `content/site/results.ts`,
 * whose own header says what they are: **Sergey's one-to-one clients**, photographed at home,
 * consented on 2026-09-07. They are not club participants. Printing them under «Результаты
 * участников» beside a price claims the club produced them, which nothing supports.
 *
 * So the row renders from data and **the label follows the data**: «Результаты участников» when
 * `CLUB_PHOTOS` has real club members in it, «Результаты учеников Сергея» while it is falling back
 * to the coach's own clients. The layout is exactly as drawn either way — only the sentence over it
 * changes, and it changes by itself the day the first club photograph lands here.
 *
 * ## Adding a photograph or a quote
 *
 * Same discipline as `results.ts`:
 *  - ask the person, in writing, for permission to publish this specific text (and photo) on a
 *    public commercial page;
 *  - set `consent` to the date they agreed. Without it the entry does not render, so nothing can
 *    reach the screen by accident;
 *  - quote them. Do not write the sentence for them and do not tidy it into marketing;
 *  - `fact` is optional and must be checkable from the club's own data — «7 дней из 7», «второе
 *    место на неделе». Never a body claim, never a number nobody counted;
 *  - write `alt` saying what is in the frame. Someone using a screen reader is here for the same
 *    reason as everyone else.
 */
import type { L10n } from '@/content/schema';
import { publishableResults } from './results';

export interface ClubResult {
  /** Stable id, used as the React key. */
  id: string;
  /** Who this is, as they agreed to be named — a first name is fine. */
  name: L10n;
  /** Their own sentence about the round, in their own words. */
  quote: L10n;
  /** One checkable fact from the club's data, shown as a pill. Optional. */
  fact?: L10n;
  /** ISO date the person agreed to this being published. Required to render. */
  consent?: string;
}

export interface ClubPhoto {
  /** Stable id, used as the React key. */
  id: string;
  /** Site-root path to the file, e.g. '/results/result-01.jpg'. */
  src: string;
  /**
   * CSS `object-position` for the crop. The row's cells are tall and narrow, so a square file is
   * shown through a slice of itself and this is which slice.
   */
  focus?: string;
  /** What is in this frame, per locale. Absent → the image is labelled by the row instead. */
  alt?: L10n;
  /** ISO date the person agreed to this photograph being published. Required to render. */
  consent?: string;
}

/**
 * Real people who have played a round of the club. Empty until there are some — see the note
 * above before adding anything at all.
 */
export const CLUB_RESULTS: readonly ClubResult[] = [];

/**
 * Photographs of club members, for the row at the top of the selling screen. Empty until somebody
 * in the club is photographed and agrees to it; until then the screen falls back to the coach's
 * own consented photographs and says so in the label. See `clubPitchPhotos()`.
 */
export const CLUB_PHOTOS: readonly ClubPhoto[] = [];

/** The entries that may actually be shown: a quote, a name and consent on record. */
export function publishableClubResults(): readonly ClubResult[] {
  return CLUB_RESULTS.filter(
    (r) => Boolean(r.consent) && Boolean(r.quote.ru) && Boolean(r.name.ru),
  );
}

/** Club photographs with a file and consent on record. */
export function publishableClubPhotos(): readonly ClubPhoto[] {
  return CLUB_PHOTOS.filter((p) => Boolean(p.consent) && Boolean(p.src));
}

/** How many frames the row draws. Three, as the mockup does. */
export const CLUB_PITCH_PHOTO_COUNT = 3;

/** Whose photographs the row ended up with — the label on the row is chosen from this. */
export type ClubPhotoSource = 'members' | 'coachClients';

/**
 * The row at the top of the selling screen, and whose photographs it is showing.
 *
 * Club members when there are any. Otherwise the coach's own clients from `results.ts`, one frame
 * each from three different people, because the alternative is a hero-sized hole on the screen that
 * asks for money. Those files are before/after composites — two panels joined side by side — so a
 * tall narrow cell is focused on the right-hand panel rather than on the seam down the middle.
 *
 * Their `compositeAlt` describes the pair, left to right, and a single panel is not the pair, so it
 * is deliberately **not** reused as this image's alt: an inaccurate description is a lie told to
 * the one reader who cannot check it. The frames go out unlabelled and the row itself carries one
 * true sentence about what they are. A `CLUB_PHOTOS` entry brings its own `alt` and uses it.
 */
export function clubPitchPhotos(): { photos: readonly ClubPhoto[]; source: ClubPhotoSource } {
  const own = publishableClubPhotos();
  if (own.length > 0) {
    return { photos: own.slice(0, CLUB_PITCH_PHOTO_COUNT), source: 'members' };
  }
  const photos = publishableResults()
    .slice(0, CLUB_PITCH_PHOTO_COUNT)
    .map((r) => ({
      id: r.id,
      src: r.composite ?? r.after ?? '',
      /* 74%: the middle of the right-hand panel of a two-panel composite. A whole file (a separate
         `after` shot) is centred as usual. */
      focus: r.composite ? '74% 50%' : '50% 50%',
      consent: r.consent,
    }))
    .filter((p) => p.src !== '');
  return { photos, source: 'coachClients' };
}
