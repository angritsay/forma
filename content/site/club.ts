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
   * shown through a slice of itself and this is which slice. Computed by `panelFocus()`; see the
   * note there before writing one by hand.
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

/**
 * How wide one cell of the row is, divided by how tall it is.
 *
 * It follows from `CLUB_PITCH_ROW_ASPECT` and the 6px gaps: a row `W` wide is `W · 348/343` tall
 * and holds three cells of `(W − 12)/3`. Measured off the rendered row rather than trusted to that
 * arithmetic — at a 390px viewport the cells come out 115.3 × 363.2 and at 402px 119.3 × 375.4,
 * 0.3175 and 0.3178, near enough the same at every width because both terms scale with it. Both
 * constants live here so a change to the row's shape is made next to the crops it invalidates.
 *
 * A square file shown through a cell this shape keeps its **whole height** and about **32% of its
 * width**. Everything below is about choosing which 32%.
 */
export const CLUB_PITCH_CELL_RATIO = 0.3177;

/** The row's own box, as the mockup draws it: `aspect-[343/348]` across all three cells. */
export const CLUB_PITCH_ROW_ASPECT = '343/348';

/**
 * `object-position`'s horizontal percentage for a square file, so that `center` — the subject's
 * own middle, as a fraction of the **file's** width — lands in the middle of the visible slice.
 *
 * **This is the arithmetic the old fixed `74%` got wrong, and it is worth stating once.** A
 * percentage in `object-position` does not name the middle of the crop; it aligns the point `p` of
 * the image with the point `p` of the box. On a square file in a cell `ratio` wide that selects
 * the slice `[p·(1 − ratio), p·(1 − ratio) + ratio]`, whose middle is `p·(1 − ratio) + ratio/2`.
 * So `74%` centred the crop on 0.664 of the file — eight points to the left of every subject in
 * the row, which is why one frame came out on a hip and the next on an elbow.
 *
 * Inverting that: `p = (center − ratio/2) / (1 − ratio)`, clamped, because a slice cannot hang
 * off the edge of its file.
 */
export function panelFocus(center: number, ratio: number = CLUB_PITCH_CELL_RATIO): number {
  const p = (center - ratio / 2) / (1 - ratio);
  return Math.min(1, Math.max(0, p));
}

/** `panelFocus` as the CSS value the row sets, e.g. «84.2% 50%». Vertically the file is uncropped. */
export function panelFocusCss(center: number, ratio: number = CLUB_PITCH_CELL_RATIO): string {
  return `${(panelFocus(center, ratio) * 100).toFixed(1)}% 50%`;
}

/**
 * The middle of the right-hand panel of a two-panel composite, when nobody has measured the
 * particular file: half of the right half.
 */
const COMPOSITE_PANEL_CENTER = 0.75;

/**
 * Where the person actually stands inside the right-hand panel of each composite, as a fraction of
 * the whole file's width. Measured on the files with a per-cent ruler, not chosen by eye — the
 * subject's outermost edge on each side, then the middle of the two:
 *
 * | file | left edge | right edge | centre | subject's own width |
 * | --- | --- | --- | --- | --- |
 * | result-01 | 0.605 | 0.860 | **0.733** | 0.255 |
 * | result-02 | 0.605 | 0.915 | **0.760** | 0.310 |
 * | result-03 | 0.625 | 0.890 | **0.758** | 0.265 |
 *
 * The slice is 0.318 of the file wide, so all three fit inside it once they are centred — r02 only
 * just, with about half a per cent of air at each elbow. That is the constraint on this row: the
 * cell cannot be made much narrower without cutting somebody's arm off, and it is why r02 still
 * reads a size larger than its neighbours. Re-measure if a file is replaced.
 */
const COMPOSITE_SUBJECT_CENTER: Readonly<Record<string, number>> = {
  r01: 0.733,
  r02: 0.76,
  r03: 0.758,
};

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
 * **Each file gets its own focus**, computed from where that person actually stands inside her
 * panel (`COMPOSITE_SUBJECT_CENTER`) by `panelFocus`. One number for all three put a different
 * part of a different body in each cell, which is what three unrelated snapshots look like next to
 * a drawing of a triptych.
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
      /* A composite is cropped to the person in its right-hand panel; a whole file (a separate
         `after` shot) is centred as usual. */
      focus: r.composite
        ? panelFocusCss(COMPOSITE_SUBJECT_CENTER[r.id] ?? COMPOSITE_PANEL_CENTER)
        : '50% 50%',
      consent: r.consent,
    }))
    .filter((p) => p.src !== '');
  return { photos, source: 'coachClients' };
}
