import { useId } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Chip } from '@/components/ui/Chip';
import { RingProgress } from '@/components/ui/RingProgress';
import { formatNumber } from '@/i18n/index';
import { stepsPoints } from '@/lib/training/streak';
import { useT } from '@/app/hooks/useT';
import { addSteps, MAX_STEPS, parseSteps, QUICK_ADD_STEPS, stepsToGoal } from './model';

export interface StepsEditorProps {
  /** Raw field text (the parent owns it so it can tell "untouched" from "cleared"). */
  text: string;
  onText: (text: string) => void;
  goal: number;
  /** Accessible label of the field ("Steps today" / "Steps for 12 Sep"). */
  label: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

/**
 * Goal ring with the big numeric field inside, quick-add chips and the points preview.
 * Shared by today's editor and the history edit sheet.
 *
 * The ring is white whatever the count — steps belong to no course, and reaching the goal is
 * said by the badge under the ring, not by the ring turning green. The quick adds are the kit's
 * chips with the `+` glyph; the figure in the ring is set as a numeral in the display face.
 */
export function StepsEditor({ text, onText, goal, label, disabled, autoFocus }: StepsEditorProps) {
  const { t, locale } = useT();
  const id = useId();
  const parsed = parseSteps(text);
  const invalid = text.trim() !== '' && parsed === null;
  const value = parsed ?? 0;
  const points = stepsPoints(value, goal);
  const missing = stepsToGoal(value, goal);

  return (
    <div className="flex flex-col items-center gap-5">
      <RingProgress
        value={value / goal}
        size={200}
        stroke={8}
        tone="primary"
        label={t('app.stepsRingLabel')}
        valueText={`${formatNumber(locale, value)} / ${formatNumber(locale, goal)}`}
      >
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          enterKeyHint="done"
          autoFocus={autoFocus}
          disabled={disabled}
          value={text}
          onChange={(e) => onText(e.target.value)}
          placeholder="0"
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? `${id}-error` : undefined}
          className="numeral w-32 bg-transparent text-center text-5xl leading-none outline-none placeholder:text-muted-2 disabled:opacity-40"
        />
        <span className="eyebrow mt-2">
          {t('app.stepsOfGoal', { goal: formatNumber(locale, goal) })}
        </span>
      </RingProgress>
      {invalid ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-danger">
          {t('app.stepsInvalid', { max: formatNumber(locale, MAX_STEPS) })}
        </p>
      ) : null}
      <div className="flex flex-wrap justify-center gap-2">
        {QUICK_ADD_STEPS.map((delta) => (
          <Chip
            key={delta}
            icon="plus"
            disabled={disabled}
            aria-label={t('app.stepsAddLabel', { n: formatNumber(locale, delta) })}
            onClick={() => onText(String(addSteps(value, delta)))}
          >
            {formatNumber(locale, delta)}
          </Chip>
        ))}
      </div>
      {value >= goal ? (
        <Badge tone="success" icon="check" size="md">
          {t('app.stepsGoalReached')} · {t('app.stepsPointsPreview', { n: points })}
        </Badge>
      ) : (
        <p className="text-center text-sm text-muted">
          {t('app.stepsPointsBelow', { n: formatNumber(locale, missing) })}
        </p>
      )}
    </div>
  );
}
