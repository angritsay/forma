/**
 * One frame from an exercise's clip — the picture that stands in for the movement wherever the
 * clip itself is not playing: catalogue tiles, the workout preview, the cover of a session, the
 * exercise page on the site.
 *
 *   <ExerciseStill exerciseId="air_squat" />
 *
 * There used to be a drawn stick figure here. Every movement in the library is now filmed by the
 * coach, so a drawing of a movement we have on video is a worse picture of it, and a drawing of a
 * movement we do not have on video is a promise the app cannot keep.
 *
 * The frame lives at `images/exercises/<id>.jpg` in the public bucket (see `exerciseStillUrl`),
 * which is a stable path and needs no signature — that is what lets a built landing page carry one
 * in a plain `<img src>` with no JavaScript at all.
 *
 * `alt` is empty on purpose: the movement's name is always set beside the picture, so the frame is
 * decorative, and a decorative image that fails to load renders as nothing rather than as a broken
 * icon. That is the whole fallback — the flat tile behind shows through, which is the brand's
 * answer for a picture that is not there yet.
 */
import { exerciseStillUrl } from '@/lib/api/storage';

export interface ExerciseStillProps {
  /** Exercise id, or undefined when nothing is in scope — then nothing is drawn. */
  exerciseId?: string | undefined;
  className?: string;
  /** `eager` for the one still above the fold; everything else waits. */
  loading?: 'lazy' | 'eager';
}

export function ExerciseStill({
  exerciseId,
  className = 'size-full object-cover',
  loading = 'lazy',
}: ExerciseStillProps) {
  const src = exerciseId ? exerciseStillUrl(exerciseId) : undefined;
  if (!src) return null;
  return <img src={src} alt="" className={className} loading={loading} decoding="async" />;
}

export default ExerciseStill;
