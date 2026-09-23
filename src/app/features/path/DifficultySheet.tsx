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
 * *work* — measured on «Форма с нуля» workout 2, «Полегче» is 102 reps where «Посложнее» is 160 —
 * so that is what each row says, over a bar drawn to the same scale for all three.
 *
 * **The skin is the app's current one, not app-v2's.** The owner's verdict on the previous version
 * was «Старый стиль», and what made it old was three grey boxes with a hairline round them, a grey
 * bar and a line of grey 12px type — no colour, no display face, no pills, on a screen next to
 * tabs that now have all three. So:
 *
 *   • the boxes are gone. Rows sit on hairlines, the way every list in the app does now — the
 *     club's board, the task card, the achievements;
 *   • the bars carry the **difficulty scale** of the semantic colour map (global.css header,
 *     design/CHANGELOG.md §15): «Полегче» the light blue, «Как обычно» plain white, «Посложнее» the
 *     orange of effort. It used to be the programme colour on the recommended row, which on
 *     «Форма с нуля» made «recommended» orange — the colour that means «harder» everywhere else;
 *   • **each choice wears an emoji** — «вот тут можно добавить эмодзи». 🌿 / 👟 / 🔥 read at a
 *     glance, and they are the one thing on the row that needs no reading at all. All three sit
 *     on the same neutral `--surface-2` disc: an emoji on a saturated fill is unreadable (🌿 in
 *     an orange disc was the screenshot that started the colour map). They are not the count pill's 💪 in any sense the eye can confuse: different screen,
 *     different size, different neighbours;
 *   • the calories went. «~31 ккал» barely moved between the three (31 / 31 / 34), so it was a
 *     third figure that decided nothing — and the reps beside it are the one that does.
 *
 * **The minutes lead, and there are no points.** A course is time you are about to spend, and that
 * is the number somebody standing on a mat is deciding about: «восемнадцать минут» is an answer,
 * «140 очков» is a score for something that has not happened yet. Points belong to the club, where
 * they are the whole point; a workout is not a thing you win.
 *
 * **The minutes are the whole session and the reps are only the training**, which looks like an
 * inconsistency and is the honest pair. «13 мин» is how long you will be busy, warm-up and
 * cool-down included, and it is what the site promises («15–20 минут вместе с разминкой и
 * заминкой»). «102 повтора» is the work, because the warm-up's ten squats are the same ten
 * whatever you pick — «не надо считать разминку и заминку в плане тренировки и в количестве
 * повторений» (`workoutVolume`).
 *
 * **The recommended row is marked, not fenced.** A neon «Рекомендуем» pill beside its name — the
 * neon is the map's «do this now», which is exactly what a recommendation says. The other two are
 * one tap away, at the same size, because the recommendation is advice and not a gate.
 */
import { clsx } from 'clsx';
import { Glyph } from '@/components/ui/Icon';
import { Pill } from '@/components/ui/Pill';
import { Sheet } from '@/components/ui/Sheet';
import { Spinner } from '@/components/ui/Spinner';
import { useT } from '@/app/hooks/useT';
import { DIFFICULTY_BAR_CLASS } from '@/lib/ui/semantic';
import type { DifficultyChoice, Recommendation } from '@/lib/training/types';
import { workLabel } from '@/app/features/courses/sessionEstimate';
import { DisplayText } from '@/app/features/home/DisplayTitle';
import { DIFFICULTY_LABEL } from './plan';

/**
 * One glyph per choice, and they are doing the job the words do — «вот тут можно добавить эмодзи».
 *
 * 🌿 is lighter, 👟 is the ordinary day you just put your shoes on, 🔥 is more. All three carry
 * their own colour, so they sit on a neutral disc and never on a saturated fill, and none of them
 * is a face — a face on a difficulty is a judgement about the person.
 */
const DIFFICULTY_EMOJI: Record<DifficultyChoice, string> = {
  easier: '🌿',
  normal: '👟',
  harder: '🔥',
};

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
  /**
   * The programme's colour. Kept for callers; the sheet no longer paints with it — the difficulty
   * scale has its own colours (`DIFFICULTY_BAR_CLASS`).
   */
  tile?: string | undefined;
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
        <div className="flex flex-col">
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
                  /* A hairline, not a box. Every list in the app reads this way now. */
                  'flex w-full items-center gap-4 border-t border-border py-4 text-left first:border-t-0',
                  'transition-opacity duration-150 ease-(--ease-out)',
                  busy && !starting && 'opacity-40',
                )}
              >
                {/*
                 * The emoji in a circle, the club's `BoardRow` geometry, on the same neutral
                 * `--surface-2` for all three rows: an emoji is never laid on a saturated fill.
                 */}
                <span
                  aria-hidden="true"
                  className="flex size-12 shrink-0 items-center justify-center rounded-pill bg-surface-2"
                >
                  {/* `.emoji` on the glyph, never on the circle: it sizes itself to 1em and the
                      circle is a 48px plate, exactly as `Badges` and `CoursesHead` do it. */}
                  <span className="emoji" style={{ fontSize: 22 }}>
                    {DIFFICULTY_EMOJI[o.choice]}
                  </span>
                </span>

                <span className="flex min-w-0 flex-1 flex-col gap-2">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-display text-[17px]">
                        {t(DIFFICULTY_LABEL[o.choice])}
                      </span>
                      {/* The recommendation: the neon's «do this now», as a marker and not a fill. */}
                      {isRecommended ? <Pill tone="neon">{t('training.recommended')}</Pill> : null}
                    </span>
                    <span className="flex shrink-0 items-baseline gap-1">
                      <span className="numeral tabular text-2xl leading-none">
                        {Math.max(1, Math.round(o.durationSec / 60))}
                      </span>
                      <span className="eyebrow text-muted-2">{t('common.minutesUnit')}</span>
                    </span>
                  </span>

                  {/*
                   * How much work, as a length, drawn to the same scale on all three rows: two
                   * choices that really are close draw as two bars that really are close. Rounded
                   * ends, because a figure in this brand is a pill or a ring.
                   */}
                  <span
                    aria-hidden="true"
                    className="block h-1 w-full overflow-hidden rounded-pill bg-surface-3"
                  >
                    <span
                      className={clsx(
                        'block h-full rounded-pill transition-[width] duration-300 ease-(--ease-out)',
                        DIFFICULTY_BAR_CLASS[o.choice],
                      )}
                      style={{ width: `${Math.round(share(o) * 100)}%` }}
                    />
                  </span>

                  {/* The work itself — warm-up and cool-down excluded (`workoutVolume`). */}
                  <span className="tabular text-[13px] text-muted">{workLabel(tr, o)}</span>
                </span>

                {/* The arrow says this row *is* the start button; a spinner replaces it while it is. */}
                {starting ? (
                  <Spinner size={16} />
                ) : (
                  <Glyph size={16} className="shrink-0 text-muted-2">
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
