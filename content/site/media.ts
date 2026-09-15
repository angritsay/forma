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
 * **If it is a storage reference it must be the public `images` bucket, not `videos`.** The
 * movement clips live in `videos` because they are the paid content, and that bucket's policy
 * grants `select` to `authenticated` only — 0003_storage.sql says so in as many words ("No anon
 * policies"). Nobody on the sign-in screen is authenticated yet, so a `storage:videos/…` film
 * would fail to sign for the one audience it exists for and the screen would quietly fall back to
 * the photograph. `images` is public and readable by `anon` (0008_course_builder.sql), and
 * `publicMediaUrl()` resolves it to a stable URL with no signature to expire.
 *
 * The file must be encoded like the movement clips (`scripts/media/prepare-videos.mjs`): H.264 in
 * MP4, no audio track, a few megabytes at most. It autoplays, and a browser refuses to autoplay
 * anything with sound in it.
 */
export interface BackgroundFilm {
  /** `storage:images/site/auth.mp4`, `https://…/auth.mp4`, `/video/auth.mp4`, or '' for none. */
  src: string;
  /** Poster frame shown while the film loads; a path under `public/`. Optional. */
  poster?: string;
}

export const AUTH_FILM: BackgroundFilm = {
  /*
   * The owner's montage, cut to loop: 1080×1920, H.264, 5.8s, no audio track, 1.6 MB.
   *
   * It is uploaded to the public bucket rather than committed here because the repository is
   * public and a megabyte and a half of video is not a thing to put in its history for a file
   * that is going to be recut. Upload target: bucket `images`, path `site/auth.mp4`.
   */
  src: 'storage:images/site/auth.mp4',
  /*
   * The film's own first frame, which is also its last — it is cut to loop. Committed here rather
   * than left out because this is a 1.6 MB file fetched over whatever connection a phone has, and
   * the alternative to a poster is the `bg-ink` black the backdrop sits on. It is also what the
   * screen shows if the upload above has not happened yet, or fails.
   */
  poster: '/video/auth-poster.jpg',
};
