import { useId } from 'react';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Slider } from '@/components/ui/Slider';
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

/** RPE slider with Borg CR10 descriptors, feeling chips and a free note. */
export function FeedbackForm({ value, onChange, disabled }: FeedbackFormProps) {
  const { t } = useT();
  const noteId = useId();
  const feelingLabelId = useId();
  return (
    <Card className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-3xl">{t('app.summaryFeedbackTitle')}</h2>
        <p className="text-[15px] text-muted">{t('app.summaryFeedbackLead')}</p>
      </div>

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
        <span id={feelingLabelId} className="text-sm font-medium text-muted">
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

      <div className="flex flex-col gap-1.5">
        <label htmlFor={noteId} className="text-sm font-medium text-muted">
          {t('app.summaryNoteLabel')}
        </label>
        <textarea
          id={noteId}
          value={value.note}
          maxLength={NOTE_MAX}
          rows={3}
          disabled={disabled}
          placeholder={t('app.summaryNotePlaceholder')}
          onChange={(e) => onChange({ ...value, note: e.target.value })}
          className="min-h-24 w-full resize-y rounded-inner border border-border bg-surface-2 px-4 py-3 text-base text-text outline-none transition-colors placeholder:text-muted-2 focus:border-border-strong disabled:opacity-50"
        />
      </div>
    </Card>
  );
}
