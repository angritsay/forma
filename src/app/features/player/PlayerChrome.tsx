/**
 * Player chrome: the top bar over the hero art, the section stepper, the step progress row, the
 * bottom control row and the paused overlay. Presentational — the screen owns the state.
 */
import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Glyph, Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useT } from '@/app/hooks/useT';
import { formatClock } from '@/i18n/index';
import { sectionLabel, type BlockSection } from './model';

/*
 * A loudspeaker is a physical object no glyph says, so it stays an icon: 16px, square caps, a
 * cross through it when muted. The only picture in the player's chrome besides play and pause.
 */
export function SoundIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="butt"
      strokeLinejoin="miter"
      aria-hidden="true"
    >
      <path d="M4 9v6h4l5 4V5L8 9z" />
      {muted ? (
        <path d="M16 9l5 6M21 9l-5 6" />
      ) : (
        <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" />
      )}
    </svg>
  );
}

export interface PlayerHeaderProps {
  title: string;
  muted: boolean;
  /** True while the coach's video is behind the bar: the title goes white over the frame. */
  overVideo?: boolean;
  onBack: () => void;
  onToggleSound: () => void;
  onMenu: () => void;
}

/**
 * Back, the step's name, sound and the menu, laid over the art. The three controls are ink plates
 * (`on-art`), findable on a yellow tile and on a video frame alike; the title reads in the ink the
 * tile wants and in white over a video, where the art layer draws a scrim for it.
 */
export function PlayerHeader({
  title,
  muted,
  overVideo = false,
  onBack,
  onToggleSound,
  onMenu,
}: PlayerHeaderProps) {
  const { t } = useT();
  return (
    <header
      className={clsx(
        'relative z-10 flex h-14 items-center gap-2 px-3 pt-[var(--safe-top)]',
        overVideo ? 'text-paper' : 'text-tile-fg',
      )}
    >
      <IconButton label={t('common.back')} icon="back" variant="on-art" onClick={onBack} />
      <h1 className="font-display min-w-0 flex-1 truncate text-center text-[13px]">{title}</h1>
      <IconButton
        label={muted ? t('app.playerUnmute') : t('app.playerMute')}
        icon={<SoundIcon muted={muted} />}
        variant="on-art"
        aria-pressed={!muted}
        onClick={onToggleSound}
      />
      <IconButton
        label={t('app.playerMenu')}
        icon={<Glyph size={16}>···</Glyph>}
        variant="on-art"
        onClick={onMenu}
      />
    </header>
  );
}

export interface ProgressRowProps {
  stepIndex: number;
  totalSteps: number;
  elapsedSec: number;
}

/**
 * The step counter as a kicker on the left, the elapsed clock in the display face on the right,
 * and the 4px bar under both — the design system's player row. The bar is the one thing here
 * that takes the programme colour; the clock is type.
 */
export function ProgressRow({ stepIndex, totalSteps, elapsedSec }: ProgressRowProps) {
  const { t } = useT();
  const last = Math.max(1, totalSteps - 1);
  const value = Math.min(1, stepIndex / last);
  const n = Math.min(stepIndex + 1, last);
  return (
    <div className="flex flex-col gap-3 px-5 pt-4 pb-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="eyebrow tabular">{t('app.playerStepOf', { n, total: last })}</span>
        <span
          className="font-display tabular text-[22px] leading-none"
          aria-label={t('app.playerElapsed')}
        >
          {formatClock(elapsedSec)}
        </span>
      </div>
      <ProgressBar value={value} label={t('app.playerStepOf', { n, total: last })} />
    </div>
  );
}

export interface SectionStepperProps {
  sections: BlockSection[];
  current: BlockSection;
}

/**
 * The three parts of a session — Разминка · Тренировка · Заминка — as kickers over 2px rules,
 * so the athlete always sees where they are and what is left. The active part is the one kicker
 * on the screen in the programme colour; a finished part ends in a tick. Hidden when a workout
 * has only one part (a bare test), where it would say nothing.
 */
export function SectionStepper({ sections, current }: SectionStepperProps) {
  const { t } = useT();
  if (sections.length < 2) return null;
  const currentIdx = sections.indexOf(current);
  return (
    <ol className="flex items-stretch gap-2.5 px-5 pt-4" aria-label={t('app.playerSectionsLabel')}>
      {sections.map((section, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <li
            key={section}
            className={clsx(
              'eyebrow flex flex-1 items-center gap-1.5 border-t-2 pt-2 transition-colors duration-150 ease-(--ease-out)',
              active
                ? 'border-course text-course'
                : done
                  ? 'border-border-strong text-muted'
                  : 'border-border text-muted-2',
            )}
            aria-current={active ? 'step' : undefined}
          >
            {sectionLabel(t, section)}
            {done ? <Glyph size={11}>✓</Glyph> : null}
          </li>
        );
      })}
    </ol>
  );
}

export interface ControlsProps {
  paused: boolean;
  canPrev: boolean;
  onPrev: () => void;
  onTogglePause: () => void;
  onNext: () => void;
}

/**
 * Previous ‹ — Pause/Play — Next ›. The two side controls are 52px squares with a hairline and a
 * glyph; the middle one is 64px, the white fill, and carries the one picture the brand keeps for
 * the player. Everything is square: the circle the brandbook allows is a play button laid over a
 * video, and this row sits under the art, not on it.
 */
export function Controls({ paused, canPrev, onPrev, onTogglePause, onNext }: ControlsProps) {
  const { t } = useT();
  const side =
    'flex h-[52px] w-[52px] items-center justify-center rounded-control border border-border-strong bg-transparent text-text transition-[background-color,transform] duration-150 ease-(--ease-out) hover:bg-surface-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40';
  return (
    <div className="sticky bottom-0 z-20 bg-linear-to-t from-bg via-bg/95 to-transparent px-5 pb-[calc(var(--safe-bottom)+16px+var(--demo-inset,0px))] pt-4">
      <div className="flex items-center justify-center gap-3.5">
        <button
          type="button"
          className={side}
          onClick={onPrev}
          disabled={!canPrev}
          aria-label={t('app.playerPrev')}
        >
          <Glyph size={18}>‹</Glyph>
        </button>
        <button
          type="button"
          className="flex h-16 w-16 items-center justify-center rounded-control bg-primary text-on-primary transition-[opacity,transform] duration-150 ease-(--ease-out) hover:opacity-85 active:scale-[0.98]"
          onClick={onTogglePause}
          aria-label={paused ? t('app.playerResume') : t('app.playerPause')}
          aria-pressed={paused}
        >
          <Icon name={paused ? 'play' : 'pause'} size={20} />
        </button>
        <button type="button" className={side} onClick={onNext} aria-label={t('app.playerNext')}>
          <Glyph size={18}>›</Glyph>
        </button>
      </div>
    </div>
  );
}

export interface PausedOverlayProps {
  onResume: () => void;
  children?: ReactNode;
  className?: string;
}

/** Covers the step content while paused; the timers underneath are frozen. */
export function PausedOverlay({ onResume, children, className }: PausedOverlayProps) {
  const { t } = useT();
  return (
    <div
      role="status"
      className={clsx(
        'absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-bg/92 px-6 text-center',
        className,
      )}
    >
      <span className="font-display text-4xl">{t('app.playerPausedTitle')}</span>
      <p className="max-w-[30ch] text-[15px] text-muted">{t('app.playerPausedBody')}</p>
      <Button size="lg" onClick={onResume} icon={<Icon name="play" size={16} />} data-autofocus>
        {t('app.playerResume')}
      </Button>
      {children}
    </div>
  );
}
