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
import { useEffect, useState, type ReactNode } from 'react';
import { exerciseStillUrl } from '@/lib/api/storage';

export interface ExerciseStillProps {
  /** Exercise id, or undefined when nothing is in scope — then nothing is drawn. */
  exerciseId?: string | undefined;
  className?: string;
  /** `eager` for the one still above the fold; everything else waits. */
  loading?: 'lazy' | 'eager';
  /**
   * What to draw when there is no frame. Nothing by default — a tile's own flat colour is the
   * answer there. The player passes the movement's name: its picture is the whole screen, and
   * nothing at all there is a black rectangle that looks like a broken workout.
   */
  fallback?: ReactNode;
}

export function ExerciseStill({
  exerciseId,
  className = 'size-full object-cover',
  loading = 'lazy',
  fallback = null,
}: ExerciseStillProps) {
  const src = exerciseId ? exerciseStillUrl(exerciseId) : undefined;
  /*
   * Кадра может не быть, и это обычное дело: движение снято не всё, а файл живёт в бакете, а не в
   * сборке. Выше написано, что тогда не рисуется ничего и сквозь просвечивает плитка, — но
   * написано это было про `<img>` без обработки ошибки, а такой `<img>` показывает битую иконку.
   * Владелец её и прислала: пять кадров в ряд и серый квадратик с вопросительным знаком пятым.
   *
   * Состояние сбрасывается при смене `src`: один и тот же компонент переиспользуется под разные
   * движения, и «не загрузилось» от прошлого не должно прятать кадр следующего.
   */
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (!src || failed) return <>{fallback}</>;
  return (
    <img
      src={src}
      alt=""
      className={className}
      loading={loading}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

export default ExerciseStill;
