/**
 * Live "adaptive load" demo on the home page. All numbers are computed at build time by the real
 * training engine (see demo.ts); this island only lets the visitor switch between the three
 * difficulty versions and the four post-workout scenarios.
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
  /** Localized duration, e.g. "24 min". */
  duration: string;
  points: number;
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
    duration: string;
    points: string;
    pointsShort: string;
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

  if (!selected) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div className="rounded-card border border-border bg-surface p-5 md:p-7">
        <p className="text-sm text-muted">{workoutLabel}</p>

        <div
          className="mt-5 grid grid-cols-3 gap-2 md:gap-3"
          role="group"
          aria-label={labels.planTitle}
        >
          {choices.map((c) => {
            const active = c.choice === choice;
            const isRec = c.choice === recommended;
            return (
              <button
                key={c.choice}
                type="button"
                aria-pressed={active}
                onClick={() => setChoice(c.choice)}
                className={`relative flex flex-col items-start gap-1 rounded-inner border p-3 text-left transition md:p-4 ${
                  active
                    ? 'border-primary bg-primary text-on-primary'
                    : 'border-border bg-surface-2 text-text hover:border-border-strong'
                }`}
              >
                {isRec && (
                  <span
                    className={`rounded-pill px-2 py-0.5 text-xs font-semibold uppercase ${
                      active ? 'bg-on-primary text-primary' : 'bg-accent text-on-primary'
                    }`}
                  >
                    {labels.recommended}
                  </span>
                )}
                <span className="font-semibold">{c.label}</span>
                <span className={`text-sm ${active ? 'text-on-primary/70' : 'text-muted'}`}>
                  {labels.duration}: <span className="tabular">{c.duration}</span>
                </span>
                <span className={`text-sm ${active ? 'text-on-primary/70' : 'text-muted'}`}>
                  {labels.points}: <span className="tabular">{c.points}</span>
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-sm text-muted">{recommendedReason}</p>

        <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-muted">
          {labels.planTitle}
        </h3>
        <ol className="mt-3 flex flex-col gap-3">
          {selected.blocks.map((b) => (
            <li key={b.id} className="rounded-inner border border-border bg-bg p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-semibold">{b.title}</span>
                <span className="text-xs text-muted">{b.meta}</span>
              </div>
              <ul className="mt-2 flex flex-col gap-1 text-sm">
                {b.items.map((it, i) => (
                  <li key={`${b.id}-${i}`} className="flex items-baseline justify-between gap-3">
                    <span className={it.substituted ? 'text-accent' : ''}>{it.name}</span>
                    <span className="tabular whitespace-nowrap text-muted">
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
      </div>

      <div className="rounded-card border border-border bg-surface p-5 md:p-7">
        <h3 className="font-display text-2xl">{labels.rpeTitle}</h3>
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
                className={`rounded-inner border px-3 py-3 text-sm font-medium transition ${
                  active
                    ? 'border-primary bg-primary text-on-primary'
                    : 'border-border bg-surface-2 hover:border-border-strong'
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        <div
          className="mt-5 min-h-28 rounded-inner border border-border bg-bg p-4"
          aria-live="polite"
        >
          {scenario ? (
            <>
              <p className="text-sm uppercase tracking-wide text-muted">{labels.nextTime}</p>
              <p
                className={`font-display mt-1 text-4xl ${
                  scenario.deltaPercent > 0
                    ? 'text-success'
                    : scenario.deltaPercent < 0
                      ? 'text-warning'
                      : ''
                }`}
              >
                {fmtDelta(scenario.deltaPercent)}
              </p>
              <p className="mt-1 text-sm text-muted tabular">
                {labels.scaleNow.replace('{scale}', String(scenario.scale))}
              </p>
              <p className="mt-3 text-sm">{scenario.reason}</p>
              {scenario.safetyNote && (
                <p className="mt-2 rounded-inner bg-danger/10 px-3 py-2 text-sm text-danger">
                  {scenario.safetyNote}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted">{labels.scaleNow.replace('{scale}', '1.0')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
