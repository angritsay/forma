import { useId } from 'react';
import { Chip } from '@/components/ui/Chip';
import { Glyph } from '@/components/ui/Icon';
import { Pill } from '@/components/ui/Pill';
import { RingProgress } from '@/components/ui/RingProgress';
import { formatNumber } from '@/i18n/index';
import { stepsPoints } from '@/lib/training/streak';
import { useT } from '@/app/hooks/useT';
import { addSteps, MAX_STEPS, parseSteps, QUICK_ADD_STEPS } from './model';

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
 * The ring with the field inside it, the goal as a pill under it, the quick adds.
 * Shared by today's editor and the history edit sheet.
 *
 * One figure and one pill, the way the owner's prototype counts everything: the number you type
 * *is* the big numeral, the ring around it fills as you type, and the goal is a fact — «Цель
 * 7 000» — not a sentence about how many steps are still missing and where the points begin.
 * Reaching it turns the pill white and puts the points on it; the check is what says "done",
 * not a green badge. The ring is white whatever the count: steps belong to no course.
 */
export function StepsEditor({ text, onText, goal, label, disabled, autoFocus }: StepsEditorProps) {
  const { t, locale } = useT();
  const id = useId();
  const parsed = parseSteps(text);
  const invalid = text.trim() !== '' && parsed === null;
  const value = parsed ?? 0;
  const points = stepsPoints(value, goal);
  const reached = value >= goal;
  /*
   * The numeral shrinks as the number grows. At one fixed size the ring either wastes half its
   * width on «0» or clips: «5 400» at 56px already ran past the input and lost its leading digit,
   * and the field accepts up to 100 000 (`MAX_STEPS`), which is seven characters with its
   * separator. Three steps rather than a continuous fit, so that typing a digit does not reflow
   * the figure on every keystroke.
   */
  const digits = text.replace(/\D/g, '').length;
  const numeralPx = digits >= 6 ? 38 : digits >= 5 ? 46 : 56;

  return (
    <div className="flex flex-col items-center gap-5">
      <RingProgress
        value={value / goal}
        size={228}
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
          style={{ fontSize: numeralPx }}
          className="display w-48 bg-transparent text-center leading-none outline-none placeholder:text-muted-2 disabled:opacity-40"
        />
      </RingProgress>
      {/*
       * Keyed on the state so the white pill lands on the spring the moment the goal is crossed —
       * the one small celebration this screen allows itself.
       */}
      {reached ? (
        <Pill key="reached" tone="paper" className="pop-in">
          <Glyph size={10}>✓</Glyph> {t('app.stepsPointsPreview', { n: points })}
        </Pill>
      ) : (
        <Pill key="goal">{t('app.stepsGoalPill', { goal: formatNumber(locale, goal) })}</Pill>
      )}
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
    </div>
  );
}
