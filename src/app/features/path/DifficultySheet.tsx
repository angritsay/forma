/**
 * «Насколько тяжело сегодня?» — the one question between pressing Start and warming up.
 *
 * It used to be a section halfway down the preview screen: three radio rows you set, and then
 * scrolled past, and then pressed a button that was somewhere else entirely. Nobody chooses a
 * difficulty and then reads a plan — they press Start, and *then* the question is worth asking,
 * because it is the last thing standing between them and the first movement.
 *
 * So there is no confirm button here. Each row is the action: tapping «Полегче» starts the session
 * at «Полегче». One decision, one tap, and the warm-up is already playing.
 *
 * **The three rows have to look different, and for a while they did not.** They were described by
 * minutes and calories, and those barely move: easier drops a whole set but shortens the rest to
 * match, so a third less work still came out at thirteen minutes and thirty-one kcal. Three
 * identical-looking rows are not a choice, they are a coin toss with extra steps. What moves is the
 * *work* — «Полегче» is ninety squats where «Посложнее» is a hundred and forty — so that is what
 * each row says, over a bar drawn to the same scale for all three.
 *
 * **The minutes lead, and there are no points.** A course is time you are about to spend, and that
 * is the number somebody standing on a mat is deciding about: «восемнадцать минут» is an answer,
 * «140 очков» is a score for something that has not happened yet. Points belong to the club, where
 * they are the whole point; a workout is not a thing you win.
 *
 * **The recommended row is filled, not badged.** White on ink among two outlined rows: the eye
 * lands on it before a word is read, and tapping the obvious one is the right move on the day you
 * have no opinion — which is most days. The other two are still one tap away, at the same size,
 * because the recommendation is advice and not a gate.
 *
 * The sheet is the owner's prototype's «Насколько тяжело сегодня?» almost line for line, and the
 * title is set in its two weights — «НАСКОЛЬКО тяжело сегодня?» — because it is the one question
 * the screen asks. The prototype's line under the title («Выбери — и разминка начнётся сразу»)
 * is left out: the arrow on each row already says the row starts the session.
 */
import { clsx } from 'clsx';
import { Glyph } from '@/components/ui/Icon';
import { Sheet } from '@/components/ui/Sheet';
import { Spinner } from '@/components/ui/Spinner';
import { useT } from '@/app/hooks/useT';
import type { DifficultyChoice, Recommendation } from '@/lib/training/types';
import { workLabel } from '@/app/features/courses/sessionEstimate';
import { DisplayText } from '@/app/features/home/DisplayTitle';
import { DIFFICULTY_LABEL } from './plan';

/** One difficulty and what choosing it asks for: how much work, and how long it takes. */
export interface DifficultyOption {
  choice: DifficultyChoice;
  durationSec: number;
  calories: number;
  /** Repetitions prescribed across the session; 0 for a workout made only of timed work. */
  reps: number;
  /** Seconds of prescribed work, rest excluded — what the bar is drawn from. */
  workSec: number;
}

export interface DifficultySheetProps {
  open: boolean;
  onClose: () => void;
  options: readonly DifficultyOption[];
  recommended: Recommendation;
  /** The choice being started, while the session is being opened on the server. */
  pending: DifficultyChoice | null;
  onPick: (choice: DifficultyChoice) => void;
}

export function DifficultySheet({
  open,
  onClose,
  options,
  recommended,
  pending,
  onPick,
}: DifficultySheetProps) {
  const tr = useT();
  const { t, l } = tr;
  const busy = pending !== null;

  /*
   * The bar measures the same thing the line under it states — reps where there are reps, working
   * seconds for a session made only of timed work — so the picture and the number can never
   * disagree. It runs from zero against the heaviest option, which means two choices that really
   * are close draw as two bars that really are close. That is the answer to "what is the
   * difference", including the days when the honest answer is "not much".
   */
  const byReps = options.every((o) => o.reps > 0);
  const amount = (o: DifficultyOption) => (byReps ? o.reps : o.workSec);
  const heaviest = Math.max(1, ...options.map(amount));
  const share = (o: DifficultyOption) => amount(o) / heaviest;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={<DisplayText text={t('app.nodeDifficultyTitle')} />}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2.5">
          {options.map((o) => {
            const isRecommended = o.choice === recommended.choice;
            const starting = pending === o.choice;
            return (
              <button
                key={o.choice}
                type="button"
                disabled={busy}
                onClick={() => onPick(o.choice)}
                className={clsx(
                  /* Three controls on the sheet's flat ground, so the corner is `--r-control` and
                     not a square edge — `design/CHANGELOG.md` §13. The rows were drawn before the
                     rule existed and were the last square-shouldered control in this flow. */
                  'flex w-full items-center gap-5 rounded-control px-4 py-5 text-left',
                  'transition-colors duration-150 ease-(--ease-out)',
                  isRecommended
                    ? 'bg-primary text-on-primary'
                    : 'border border-border hover:bg-surface-2 active:bg-surface-3',
                  busy && !starting && 'opacity-40',
                )}
              >
                {/* The minutes, at the size of the decision they are. */}
                <span className="flex shrink-0 flex-col items-center">
                  <span className="numeral tabular text-4xl leading-none">
                    {Math.max(1, Math.round(o.durationSec / 60))}
                  </span>
                  <span className="eyebrow mt-1.5 text-current opacity-60">
                    {t('common.minutesUnit')}
                  </span>
                </span>

                <span className="flex min-w-0 flex-1 flex-col gap-2.5">
                  <span className="font-display text-[17px]">{t(DIFFICULTY_LABEL[o.choice])}</span>

                  {/*
                   * How much work, as a length, drawn to the same scale on all three rows: two
                   * choices that really are close draw as two bars that really are close.
                   */}
                  {/* Rounded ends, like the prototype's bar: it is a figure, and figures here are pills and rings. */}
                  <span
                    aria-hidden="true"
                    className={clsx(
                      'block h-1 w-full overflow-hidden rounded-pill',
                      isRecommended ? 'bg-on-primary/25' : 'bg-surface-3',
                    )}
                  >
                    <span
                      className={clsx(
                        'block h-full rounded-pill transition-[width] duration-300 ease-(--ease-out)',
                        isRecommended ? 'bg-on-primary' : 'bg-muted-2',
                      )}
                      style={{ width: `${Math.round(share(o) * 100)}%` }}
                    />
                  </span>

                  <span className="tabular text-xs text-current opacity-70">
                    {workLabel(tr, o)} · {t('app.nodeKcal', { n: o.calories })}
                  </span>
                </span>

                {/* The arrow says this row *is* the start button; a spinner replaces it while it is. */}
                {starting ? (
                  <Spinner size={16} />
                ) : (
                  <Glyph size={16} className="shrink-0 opacity-60">
                    →
                  </Glyph>
                )}
              </button>
            );
          })}
        </div>
        <p className="flex gap-2 border-t border-border pt-3 text-sm text-muted">
          <Glyph size={12} className="mt-1 shrink-0 text-muted-2">
            //
          </Glyph>
          <span>{l(recommended.reason)}</span>
        </p>
      </div>
    </Sheet>
  );
}
