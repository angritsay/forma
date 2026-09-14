/**
 * Owner-editable media that belongs to no course: the film the sign-in screen runs behind itself.
 *
 * The sign-in screen is the first thing anybody sees and it says one word. Everything else on it
 * is the coach's own footage — a black-and-white montage, cut to loop, no sound — so the product
 * introduces itself by showing the training rather than by describing it.
 *
 * `src` accepts the same three shapes as every other media reference in the product
 * (`src/lib/api/storage.ts`): a `storage:<bucket>/<path>` reference into Supabase Storage, an
 * absolute https URL, or a path under `public/`. Leave it empty until the montage is cut — the
 * screen then falls back to the coach's photograph, which is a still of the same idea.
 *
 * The file must be encoded like the movement clips (`scripts/media/prepare-videos.mjs`): H.264 in
 * MP4, no audio track, a few megabytes at most. It autoplays, and a browser refuses to autoplay
 * anything with sound in it.
 */
export interface BackgroundFilm {
  /** `storage:videos/shared/auth.mp4`, `https://…/auth.mp4`, `/video/auth.mp4`, or '' for none. */
  src: string;
  /** Poster frame shown while the film loads; a path under `public/`. Optional. */
  poster?: string;
}

export const AUTH_FILM: BackgroundFilm = {
  src: '',
};
