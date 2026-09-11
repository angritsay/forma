import { useId } from 'react';
import { Chip } from '@/components/ui/Chip';
import { Slider } from '@/components/ui/Slider';
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
const NOTE_MAX = 500;

function rpeKey(rpe: number): TKey {
  const n = Math.max(1, Math.min(10, Math.round(rpe)));
  return `training.rpe${n}` as TKey;
}

/** RPE slider with Borg CR10 descriptors, feeling chips and a free note — one ruled section. */
export function FeedbackForm({ value, onChange, disabled }: FeedbackFormProps) {
  const { t } = useT();
  const feelingLabelId = useId();
  return (
    <section className="flex flex-col gap-6 border-t border-border-strong pt-5">
      <h2 className="font-display text-2xl">{t('app.summaryFeedbackTitle')}</h2>

      <Slider
        value={value.rpe}
        onChange={(rpe) => onChange({ ...value, rpe })}
        min={1}
        max={10}
        label={t('app.summaryRpeLabel')}
        descriptor={t(rpeKey(value.rpe))}
        minLabel={t('app.summaryRpeMin')}
        maxLabel={t('app.summaryRpeMax')}
        disabled={disabled}
      />

      <div className="flex flex-col gap-3">
        <span id={feelingLabelId} className="text-[13px] font-semibold text-muted">
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
