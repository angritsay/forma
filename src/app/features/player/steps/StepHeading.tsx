/**
 * The two lines every step opens with: which set this is, and what the movement is called.
 *
 * The name used to live in the top bar at 13px, next to a sound toggle and a menu — the answer to
 * "what am I doing" set smaller than anything else on the screen. Here it is the first thing the
 * eye lands on, and the set counter is the quiet line above it, because "приседания" is the
 * question and "подход 2 из 3" is the footnote.
 */
import { DisplayTitle } from '@/app/features/home/DisplayTitle';

export interface StepHeadingProps {
  /** «Подход 2 из 3», «Минута 4 из 10» — omitted when a step has only one of itself. */
  eyebrow?: string | undefined;
  title: string;
}

export function StepHeading({ eyebrow, title }: StepHeadingProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      {eyebrow ? <span className="eyebrow text-paper/60">{eyebrow}</span> : null}
      <DisplayTitle as="h2" text={title} className="text-3xl text-paper" />
    </div>
  );
}
