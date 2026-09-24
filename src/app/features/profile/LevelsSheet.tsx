/**
 * All ten levels, and how points are earned — opened by tapping the level card in the profile.
 *
 * The owner: «нужно добавить пояснение интерактивное наших уровней». The card says where you are
 * and how far the next level is; this says what the whole ladder looks like and what moves you up
 * it, which is the question the card raises and could not answer in two lines.
 *
 * The ladder is `LEVEL_THRESHOLDS` and `LEVEL_TITLES`, read here rather than restated, so the sheet
 * cannot drift from the rule that awards the level. The rule for points is the one in
 * docs/TRAINING_SCIENCE.md §9: a workout's base points × the option chosen (`CHOICE_POINTS`:
 * lighter 0.8, as written 1, harder 1.25), half for a workout already done.
 *
 * Each row carries its state three ways, not by colour alone: passed levels get a tick, the
 * current one a light-blue pill «вы здесь» and full-strength type, the ones ahead are muted.
 */
import { clsx } from 'clsx';
import { Glyph } from '@/components/ui/Icon';
import { Pill } from '@/components/ui/Pill';
import { Sheet } from '@/components/ui/Sheet';
import { formatNumber } from '@/i18n/index';
import { CHOICE_POINTS, LEVEL_THRESHOLDS } from '@/lib/training/constants';
import { levelForPoints } from '@/lib/training/levels';
import { LEVEL_TITLES } from '@/lib/training/messages';
import { useT } from '@/app/hooks/useT';

export interface LevelsSheetProps {
  open: boolean;
  onClose: () => void;
  points: number;
}

/** Multiplier as the sheet prints it: ×0.8, ×1, ×1.25. */
function times(n: number): string {
  return `×${String(n).replace('.', ',')}`;
}

export function LevelsSheet({ open, onClose, points }: LevelsSheetProps) {
  const { t, l, locale } = useT();
  const current = levelForPoints(points).level;

  return (
    <Sheet open={open} onClose={onClose} title={t('app.levelsTitle')}>
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-3">
          <p className="text-[15px] leading-relaxed">{t('app.levelsLead')}</p>
          <ul className="flex flex-wrap gap-2">
            <li>
              <Pill tone="paper">
                {t('app.levelsChoiceEasier', { x: times(CHOICE_POINTS.easier) })}
              </Pill>
            </li>
            <li>
              <Pill tone="paper">
                {t('app.levelsChoiceNormal', { x: times(CHOICE_POINTS.normal) })}
              </Pill>
            </li>
            <li>
              <Pill tone="paper">
                {t('app.levelsChoiceHarder', { x: times(CHOICE_POINTS.harder) })}
              </Pill>
            </li>
          </ul>
          <p className="text-[13px] text-muted">{t('app.levelsRepeatHalf')}</p>
        </section>

        <ol className="flex flex-col border-t border-border">
          {LEVEL_THRESHOLDS.map((from, i) => {
            const n = i + 1;
            const passed = n < current;
            const here = n === current;
            const title = LEVEL_TITLES[i];
            return (
              <li
                key={n}
                aria-current={here ? 'step' : undefined}
                className="flex items-center gap-3 border-b border-border py-3"
              >
                <span
                  className={clsx(
                    'numeral tabular w-6 shrink-0 text-sm',
                    here ? 'text-accent' : 'text-muted-2',
                  )}
                >
                  {String(n).padStart(2, '0')}
                </span>
                <span
                  className={clsx(
                    'min-w-0 flex-1 truncate text-[15px]',
                    here ? 'font-semibold text-text' : passed ? 'text-text' : 'text-muted',
                  )}
                >
                  {title ? l(title) : ''}
                </span>
                {here ? (
                  <Pill tone="sky" className="shrink-0">
                    {t('app.levelsYouAreHere')}
                  </Pill>
                ) : passed ? (
                  <Glyph size={14} className="shrink-0 text-accent">
                    ✓
                  </Glyph>
                ) : null}
                <span
                  className={clsx(
                    'tabular w-20 shrink-0 text-right text-[13px]',
                    here || passed ? 'text-muted' : 'text-muted-2',
                  )}
                >
                  {formatNumber(locale, from)}
                </span>
              </li>
            );
          })}
        </ol>
        <p className="text-[13px] text-muted">{t('app.levelsFootnote')}</p>
      </div>
    </Sheet>
  );
}
