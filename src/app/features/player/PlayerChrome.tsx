/**
 * Player chrome: the top bar over the hero art, the step progress row, the bottom control row and
 * the paused overlay. Presentational — the screen owns the state.
 */
import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useT } from '@/app/hooks/useT';
import { formatClock } from '@/i18n/index';

function MoreIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}

function SoundIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
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
  onBack: () => void;
  onToggleSound: () => void;
  onMenu: () => void;
}

export function PlayerHeader({ title, muted, onBack, onToggleSound, onMenu }: PlayerHeaderProps) {
  const { t } = useT();
  return (
    <header className="relative z-10 flex h-14 items-center gap-2 px-3 pt-[env(safe-area-inset-top)] text-on-primary">
      <IconButton label={t('common.back')} icon="back" variant="on-art" onClick={onBack} />
      <h1 className="min-w-0 flex-1 truncate text-center text-base font-semibold">{title}</h1>
      <IconButton
        label={muted ? t('app.playerUnmute') : t('app.playerMute')}
        icon={<SoundIcon muted={muted} />}
        variant="on-art"
        aria-pressed={!muted}
        onClick={onToggleSound}
      />
      <IconButton
        label={t('app.playerMenu')}
        icon={<MoreIcon />}
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

/** Elapsed clock, step progress bar and the step counter. */
export function ProgressRow({ stepIndex, totalSteps, elapsedSec }: ProgressRowProps) {
  const { t } = useT();
  const last = Math.max(1, totalSteps - 1);
  const value = Math.min(1, stepIndex / last);
  return (
    <div className="flex items-center gap-3 px-5 pb-2 pt-4">
      <span
        className="tabular flex items-center gap-1 text-sm font-semibold"
        aria-label={t('app.playerElapsed')}
      >
        <Icon name="clock" size={16} className="text-muted" />
        {formatClock(elapsedSec)}
      </span>
      <ProgressBar
        value={value}
        size="sm"
        tone="accent"
        label={t('app.playerStepOf', { n: Math.min(stepIndex + 1, last), total: last })}
        className="flex-1"
      />
      <span className="tabular text-xs font-medium text-muted">
        {Math.min(stepIndex + 1, last)}/{last}
      </span>
    </div>
  );
}

export interface ControlsProps {
  paused: boolean;
  canPrev: boolean;
  onPrev: () => void;
  onTogglePause: () => void;
  onNext: () => void;
}

/** Previous (outlined) — Pause/Play (big white) — Next (outlined). */
export function Controls({ paused, canPrev, onPrev, onTogglePause, onNext }: ControlsProps) {
  const { t } = useT();
  const side =
    'flex h-14 w-14 items-center justify-center rounded-pill border border-border-strong bg-transparent text-text transition-colors hover:bg-white/5 disabled:pointer-events-none disabled:opacity-40';
  return (
    <div className="sticky bottom-0 z-20 bg-linear-to-t from-bg via-bg/95 to-transparent px-5 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-4">
      <div className="flex items-center justify-center gap-6">
        <button
          type="button"
          className={side}
          onClick={onPrev}
          disabled={!canPrev}
          aria-label={t('app.playerPrev')}
        >
          <Icon name="prev" size={22} />
        </button>
        <button
          type="button"
          className="flex h-[76px] w-[76px] items-center justify-center rounded-pill bg-primary text-on-primary shadow-card transition-transform active:scale-95"
          onClick={onTogglePause}
          aria-label={paused ? t('app.playerResume') : t('app.playerPause')}
          aria-pressed={paused}
        >
          <Icon name={paused ? 'play' : 'pause'} size={34} />
        </button>
        <button type="button" className={side} onClick={onNext} aria-label={t('app.playerNext')}>
          <Icon name="next" size={22} />
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
        'absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-card bg-bg/85 px-6 text-center backdrop-blur-sm',
        className,
      )}
    >
      <span className="font-display text-4xl">{t('app.playerPausedTitle')}</span>
      <p className="max-w-[30ch] text-[15px] text-muted">{t('app.playerPausedBody')}</p>
      <Button size="lg" onClick={onResume} icon={<Icon name="play" size={20} />} data-autofocus>
        {t('app.playerResume')}
      </Button>
      {children}
    </div>
  );
}
