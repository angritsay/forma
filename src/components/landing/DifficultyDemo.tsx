/**
 * Live "adaptive load" demo on the home page. All numbers are computed at build time by the real
 * training engine (see demo.ts); this island only lets the visitor switch between the three
 * difficulty versions and the four post-workout scenarios.
 *
 * The three versions are drawn as the owner's prototype draws them (`design/ui_kits/app-v2`,
 * «Насколько тяжело сегодня?»): a row per version with the minutes as the big figure, the name,
 * a bar for how much work it is, and one quiet line of what it is worth — the chosen row in the
 * white fill. They used to be three boxes of labelled text («Время: 13 мин», «Очки: 72»); the
 * label was saying what the unit already says. The scenario side keeps its four chips (those are
 * pressed, so they stay on the control radius) and answers with one figure: «+5 %» at display size.
 */
import { useState } from 'react';
import type { DifficultyChoice } from '@/lib/training/types';

export interface DemoItem {
  name: string;
  target: number;
  unit: string;
  /** Localized "per side" or empty. */
  perSide: string;
  /** Localized load label or empty. */
  load: string;
  substituted: boolean;
}

export interface DemoBlock {
  id: string;
  title: string;
  meta: string;
  items: DemoItem[];
}

export interface DemoChoice {
  choice: DifficultyChoice;
  label: string;
  /** Estimated length, whole minutes — the row's figure. */
  durationMin: number;
  /** What the version is worth, for the bar that compares the three. */
  points: number;
  /** «72 очка», already pluralised at build time. */
  pointsLabel: string;
  blocks: DemoBlock[];
}

export interface DemoScenario {
  id: string;
  label: string;
  deltaPercent: number;
  scale: number;
  reason: string;
  safetyNote: string;
}

export interface DifficultyDemoProps {
  workoutLabel: string;
  choices: DemoChoice[];
  recommended: DifficultyChoice;
  recommendedReason: string;
  scenarios: DemoScenario[];
  labels: {
    /** The unit under the row's figure: «мин». */
    minutes: string;
    recommended: string;
    planTitle: string;
    rpeTitle: string;
    rpeIntro: string;
    nextTime: string;
    /** Template with {scale}. */
    scaleNow: string;
  };
}

function fmtDelta(deltaPercent: number): string {
  if (deltaPercent === 0) return '0 %';
  return `${deltaPercent > 0 ? '+' : '−'}${Math.abs(deltaPercent)} %`;
}

export default function DifficultyDemo({
  workoutLabel,
  choices,
  recommended,
  recommendedReason,
  scenarios,
  labels,
}: DifficultyDemoProps) {
  const [choice, setChoice] = useState<DifficultyChoice>(recommended);
  const [scenarioId, setScenarioId] = useState<string | null>(null);

  const selected = choices.find((c) => c.choice === choice) ?? choices[0];
  const scenario = scenarios.find((s) => s.id === scenarioId) ?? null;
  /*
   * The bar compares the three by what they are worth, not by how long they run. Scaling a workout
   * moves reps and rest far more than the clock — «полегче» and «как обычно» here are both 13
   * minutes, so a bar drawn on the minutes gave three lengths within 7 % of each other and said
   * nothing. The points spread 72 / 90 / 113, which is the difference a person is choosing between.
   */
  const most = Math.max(1, ...choices.map((c) => c.points));

  if (!selected) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div className="rounded-card border border-border bg-surface p-5 md:p-7">
        {/* Two lines rather than one clipped one: «Тренировка из курса «Форма с нуля: кроссфит
            дома без оборудования»: Отжимания…» is a sentence carrying a course name, and at 390px
            `truncate` cut it inside a word. */}
        <p className="eyebrow line-clamp-2">{workoutLabel}</p>

        <div className="mt-5 flex flex-col gap-2" role="group" aria-label={labels.planTitle}>
          {choices.map((c) => {
            const active = c.choice === choice;
            const isRec = c.choice === recommended;
            return (
              <button
                key={c.choice}
                type="button"
                aria-pressed={active}
                onClick={() => setChoice(c.choice)}
                className={`grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-4 rounded-tile border p-4 text-left transition-[background-color,color,border-color,transform] duration-150 ease-(--ease-out) active:scale-[0.99] ${
                  active
                    ? 'border-primary bg-primary text-on-primary'
                    : 'border-border bg-surface-2 text-text hover:border-border-strong'
                }`}
              >
                <span className="flex flex-col items-center">
                  <span className="numeral tabular text-4xl leading-none">{c.durationMin}</span>
                  <span
                    className={`control-label mt-1 text-[13px] ${active ? 'text-on-primary/70' : 'text-muted'}`}
                  >
                    {labels.minutes}
                  </span>
                </span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-sm">{c.label}</span>
                    {isRec && (
                      <span
                        className={`control-label inline-flex h-8 items-center rounded-pill border px-2.5 text-[13px] ${
                          active
                            ? 'border-on-primary/40 text-on-primary'
                            : 'border-border-strong text-muted'
                        }`}
                      >
                        {labels.recommended}
                      </span>
                    )}
                  </span>
                  {/* How much work this version is against the heaviest of the three. */}
                  <span
                    className={`mt-2 block h-1 w-full overflow-hidden rounded-pill ${active ? 'bg-on-primary/20' : 'bg-surface-3'}`}
                    aria-hidden="true"
                  >
                    <span
                      className={`block h-full ${active ? 'bg-on-primary' : 'bg-border-strong'}`}
                      style={{ width: `${Math.round((c.points / most) * 100)}%` }}
                    />
                  </span>
                  <span
                    className={`tabular mt-2 block text-xs ${active ? 'text-on-primary/70' : 'text-muted'}`}
                  >
                    {c.pointsLabel}
                  </span>
                </span>
                <span className="glyph text-lg" aria-hidden="true">
                  →
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-sm text-muted">
          <span className="glyph mr-2" aria-hidden="true">
            //
          </span>
          {recommendedReason}
        </p>

        {/*
          The plan opens on request. Printing every exercise of the chosen version put forty lines
          of dose under a picker — a third of the home page — to prove something the three rows
          above already prove with their own figures, and the same workout is printed in full on
          the course page under «Пример тренировки». A <details> keeps the lines in the HTML — this
          island is server-rendered as well as hydrated — and out of the way, and the toggle is the
          same + glyph the FAQ and «Подробнее о курсе» use, so a disclosure looks like a disclosure
          everywhere on the site.
        */}
        <details className="group mt-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 border-t border-border pt-4 [&::-webkit-details-marker]:hidden">
            <span className="eyebrow">{labels.planTitle}</span>
            <span
              className="glyph flex size-8 shrink-0 items-center justify-center text-lg text-text transition-transform duration-150 ease-(--ease-out) group-open:rotate-45"
              aria-hidden="true"
            >
              +
            </span>
          </summary>
          <ol className="mt-3 flex flex-col gap-3">
            {selected.blocks.map((b) => (
              <li key={b.id} className="border-t border-border pt-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">{b.title}</span>
                  <span className="control-label inline-flex h-8 items-center rounded-pill border border-border-strong px-2.5 text-[13px] text-muted">
                    {b.meta}
                  </span>
                </div>
                <ul className="mt-2 flex flex-col gap-1 text-sm">
                  {b.items.map((it, i) => (
                    <li key={`${b.id}-${i}`} className="flex items-baseline justify-between gap-3">
                      <span
                        className={`min-w-0 ${it.substituted ? 'underline decoration-border-strong underline-offset-4' : ''}`}
                      >
                        {it.name}
                      </span>
                      {/* Doses run from "3 × 12" to "30 сек на каждую сторону". Forcing one line
                        pushed the row past a 320px viewport; right-aligned wrapping keeps the
                        short ones intact and lets the long ones break. */}
                      <span className="tabular text-right text-muted">
                        {it.target} {it.unit}
                        {it.perSide ? ` ${it.perSide}` : ''}
                        {it.load ? ` · ${it.load}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </details>
      </div>

      <div className="rounded-card border border-border bg-surface p-5 md:p-7">
        <h3 className="font-display text-xl">{labels.rpeTitle}</h3>
        <p className="mt-2 text-sm text-muted">{labels.rpeIntro}</p>
        <div className="mt-5 grid grid-cols-2 gap-2" role="group" aria-label={labels.rpeTitle}>
          {scenarios.map((s) => {
            const active = s.id === scenarioId;
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={active}
                onClick={() => setScenarioId(s.id)}
                className={`control-label rounded-control border px-3 py-3 text-[12px] transition-[background-color,color,border-color,transform] duration-150 ease-(--ease-out) active:scale-[0.98] ${
                  active
                    ? 'border-primary bg-primary text-on-primary'
                    : 'border-border bg-surface-2 text-muted hover:border-border-strong hover:text-text'
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        <div className="mt-6 min-h-36 border-t border-border pt-5" aria-live="polite">
          {scenario ? (
            <>
              <p className="eyebrow">{labels.nextTime}</p>
              {/* The answer is one figure at display size, in the state colour. */}
              <p
                className={`numeral tabular mt-2 text-6xl leading-none ${
                  scenario.deltaPercent > 0
                    ? 'text-success'
                    : scenario.deltaPercent < 0
                      ? 'text-warning'
                      : ''
                }`}
              >
                {fmtDelta(scenario.deltaPercent)}
              </p>
              <p className="tabular mt-3 text-xs text-muted">
                {labels.scaleNow.replace('{scale}', String(scenario.scale))}
              </p>
              <p className="mt-3 text-sm">{scenario.reason}</p>
              {scenario.safetyNote && (
                <p className="mt-3 border-l-2 border-danger pl-3 text-sm text-danger">
                  {scenario.safetyNote}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="eyebrow">{labels.nextTime}</p>
              <p className="numeral tabular mt-2 text-6xl leading-none text-muted-2">?</p>
              <p className="tabular mt-3 text-xs text-muted">
                {labels.scaleNow.replace('{scale}', '1.0')}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
