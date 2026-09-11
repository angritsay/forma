/**
 * TEMPORARY PLACEHOLDER PHOTOGRAPHY — REPLACE BEFORE LAUNCH.
 *
 * The brand's main visual surface is full-bleed photographs of people, shown monochrome with
 * grain over them. The product has no photo library yet beyond `public/coach/sergey.jpg` and the
 * ten result photos, so every photo-led block below points at a free Unsplash frame instead.
 *
 * Two things are deliberately wrong with these and must be fixed by a human:
 *
 *  1. They are *remote* URLs, not files in `public/`. They should be vendored — a static site
 *     should not depend on someone else's CDN at runtime. Run `npm run media:placeholders` to
 *     download the current set into `public/photos/` and set `local` on each entry; the session
 *     that wrote this file could not, because its network policy blocks images.unsplash.com.
 *  2. The content is wrong for the product. Most of these are gym frames and Forma is about
 *     training at home, and the athlete standing in for Sergey is not Sergey. They set the right
 *     tone and the right crop; they are not the right pictures.
 *
 * Unsplash's licence permits commercial use without permission, so nothing here is blocking —
 * but `credit` is carried on every entry so attribution is possible while they are still up.
 *
 * To swap one photo: change `url` (or set `local`) and `credit`. Nothing else references the CDN.
 */

export interface Photo {
  /** Remote placeholder. Ignored once `local` is set. */
  url: string;
  /** Path under `public/` once the photo has been vendored, e.g. `/photos/home-today.jpg`. */
  local?: string;
  /** Photographer credit, shown where a caption is available. */
  credit: string;
  /** Intrinsic aspect ratio, so the layout reserves the right box before the image loads. */
  width: number;
  height: number;
}

const unsplash = (id: string, w: number, h: number, credit: string): Photo => ({
  // `sat=-100` asks the CDN for a desaturated frame. `.photo-mono` also desaturates in CSS, so a
  // colour replacement photo still renders monochrome once these URLs are gone.
  url: `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=72&sat=-100`,
  credit,
  width: w,
  height: h,
});

/** Resolved src for a photo: the vendored file when there is one, else the CDN placeholder. */
export function photoSrc(photo: Photo): string {
  return photo.local ?? photo.url;
}

/** True while a photo is still an un-vendored placeholder — used to surface it in dev warnings. */
export function isPlaceholder(photo: Photo): boolean {
  return photo.local === undefined;
}

export const PHOTOS = {
  /** Landing hero. The coach's own photograph wins over this wherever it is available. */
  landingHero: unsplash('1583454110551-21f2fa2afe61', 1400, 1750, 'Jonathan Borba / Unsplash'),
  /** The coach block on the landing, when `public/coach/sergey.jpg` is not used. */
  coach: unsplash('1534438327276-14e5300c3a48', 1200, 1500, 'Sven Mieke / Unsplash'),
  /**
   * App home, the "today" block — the screen an athlete opens every day.
   *
   * The coach's own photograph, vendored. It replaces a stock frame of a stranger in a gym, and
   * being a local file it also drops the runtime dependency on someone else's CDN for the single
   * most-seen surface in the product. Same frame as the sign-in screen below: there is one
   * photograph of him, and showing him twice beats showing someone else once.
   */
  homeToday: {
    local: '/coach/sergey-hero.jpg',
    url: '',
    credit: 'Сергей Титов',
    width: 1200,
    height: 1600,
  } satisfies Photo,
  /** Course path header. */
  coursePath: unsplash('1517836357463-d25dfeac3438', 1400, 1050, 'Victor Freitas / Unsplash'),
  /** Player / exercise still, behind the video frame. */
  exercise: unsplash('1518611012118-696072aa579a', 1200, 1500, 'Meghan Holmes / Unsplash'),
  /** Sign-in screen. The coach's own photograph — see `homeToday`. */
  auth: {
    local: '/coach/sergey-hero.jpg',
    url: '',
    credit: 'Сергей Титов',
    width: 1200,
    height: 1600,
  } satisfies Photo,
  /** Statistics header. */
  stats: unsplash('1605296867304-46d5465a13f1', 1400, 1050, 'Jonathan Borba / Unsplash'),
  /** Profile header. */
  profile: unsplash('1526506118085-60ce8714f8c5', 1200, 1500, 'Sushil Ghimire / Unsplash'),
} as const satisfies Record<string, Photo>;

export type PhotoName = keyof typeof PHOTOS;
