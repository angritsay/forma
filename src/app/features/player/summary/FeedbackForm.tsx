import { useId } from 'react';
import { clsx } from 'clsx';
import { Chip } from '@/components/ui/Chip';
import { Textarea } from '@/components/ui/Textarea';
import { useT } from '@/app/hooks/useT';
import type { TKey } from '@/i18n/index';
import type { Feeling } from '@/lib/training/types';

export interface FeedbackValue {
  rpe: number;
  feeling: Feeling | null;
  note: string;
}

export interface FeedbackFormProps {
  value: FeedbackValue;
  onChange: (value: FeedbackValue) => void;
  disabled?: boolean;
}

const FEELINGS: readonly Feeling[] = ['great', 'ok', 'hard', 'pain'];
const RPE: readonly number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const NOTE_MAX = 500;

function rpeKey(rpe: number): TKey {
  const n = Math.max(1, Math.min(10, Math.round(rpe)));
  return `training.rpe${n}` as TKey;
}

/**
 * «Как зашло?» — the effort as one row of ten circles, the feeling as chips, and a free note.
 *
 * The effort was a slider: a track, a thumb, «очень легко» under one end and «предел» under the
 * other, and the Borg descriptor under that — five pieces of type for one number between 1 and 10.
 * The owner's prototype counts everything this app counts in circles, and ten of them is a scale
 * you can read and hit in one motion: the circles up to the choice are filled, so the row reads as
 * a level, and the chosen one is white. The two end captions are gone with the track — the row runs
 * left to right, and the descriptor under it says what the chosen number means, which is the part
 * that carried the information.
 *
 * The circles are 28px with a 44px tap target above and below them (`tap-target-y`): ten controls
 * across a 390px screen cannot each be 44px wide, and the vertical reach is what a thumb misses.
 */
export function FeedbackForm({ value, onChange, disabled }: FeedbackFormProps) {
  const { t } = useT();
  const feelingLabelId = useId();
  const rpeLabelId = useId();
  const chosen = Math.max(1, Math.min(10, Math.round(value.rpe)));

  return (
    <section className="flex flex-col gap-6 border-t border-border-strong pt-6">
      <h2 className="display text-[22px]">{t('app.summaryFeedbackTitle')}</h2>

      <div className="flex flex-col gap-3">
        <span id={rpeLabelId} className="eyebrow">
          {t('app.summaryRpeLabel')}
        </span>
        <div
          role="radiogroup"
          aria-labelledby={rpeLabelId}
          className="flex items-center justify-between"
        >
          {RPE.map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={chosen === n}
              aria-label={`${n} — ${t(rpeKey(n))}`}
              disabled={disabled}
              onClick={() => onChange({ ...value, rpe: n })}
              className={clsx(
                'tap-target-y numeral tabular flex size-7 items-center justify-center rounded-pill border text-[11px] transition-[background-color,border-color,color,transform] duration-150 ease-(--ease-out) active:scale-[0.92] disabled:opacity-40',
                /*
                 * The filled ones keep their numeral rather than hiding it: a scale you can still
                 * read is one you can jump about in, and a row of blank grey discs would be a
                 * meter, which is not what this is.
                 */
                n === chosen
                  ? 'border-paper bg-paper text-ink'
                  : n < chosen
                    ? 'border-transparent bg-text/30 text-text'
                    : 'border-border text-muted-2',
              )}
            >
              {n}
            </button>
          ))}
        </div>
        <p aria-live="polite" className="text-[13px] text-muted">
          {chosen} · {t(rpeKey(chosen))}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <span id={feelingLabelId} className="eyebrow">
          {t('app.summaryFeelingLabel')}
        </span>
        <div role="group" aria-labelledby={feelingLabelId} className="flex flex-wrap gap-2">
          {FEELINGS.map((f) => (
            <Chip
              key={f}
              selected={value.feeling === f}
              tone={f === 'pain' ? 'danger' : 'default'}
              onClick={() => onChange({ ...value, feeling: f })}
              disabled={disabled}
            >
              {t(`training.feeling_${f}`)}
            </Chip>
          ))}
        </div>
      </div>

      <Textarea
        label={t('app.summaryNoteLabel')}
        value={value.note}
        maxLength={NOTE_MAX}
        rows={3}
        disabled={disabled}
        placeholder={t('app.summaryNotePlaceholder')}
        onChange={(e) => onChange({ ...value, note: e.target.value })}
      />
    </section>
  );
}
