/**
 * Player chrome: the bar over the clip, the section stepper, the step progress bar, the transport
 * row and the paused overlay. Presentational — the screen owns the state.
 *
 * The player is one viewport of the coach's clip with nothing on it but what an athlete mid-set can
 * read at arm's length: where they are and how long it has run, at the top; the movement's own
 * numbers and the transport, at the bottom. Both float over the footage on their own scrim and stay
 * put while the page scrolls, so the words — technique, the block's list, the notes — can live
 * below the fold without ever taking the timer with them.
 */
import { clsx } from 'clsx';
import { useEffect, useState, type ReactNode } from 'react';
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

/**
 * Has the page moved off the clip?
 *
 * The two bars are see-through while the player is showing the demonstration — that is the point of
 * the screen — and go solid the moment anything scrolls, because a translucent bar with the page
 * sliding underneath is unreadable in both directions: the words behind show through the clock, and
 * the clock muddies the words. A gradient can soften the edge between the clip and the chrome; it
 * cannot be the background of something being read.
 */
function usePageScrolled(threshold = 8): boolean {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const read = () => setScrolled(window.scrollY > threshold);
    read();
    window.addEventListener('scroll', read, { passive: true });
    return () => window.removeEventListener('scroll', read);
  }, [threshold]);
  return scrolled;
}

export interface PlayerHeaderProps {
  title: string;
  muted: boolean;
  stepIndex: number;
  totalSteps: number;
  elapsedSec: number;
  onBack: () => void;
  onToggleSound: () => void;
  onMenu: () => void;
}

/**
 * Fixed to the top of the viewport, over the clip: back, the movement's name, sound and the menu,
 * then the one line an athlete looks up for — which step this is, and how long the session has run.
 *
 * Everything is `--paper` on an ink scrim rather than the tile's ink. The frame underneath is a
 * photograph of a room and can be any brightness, and a bright yellow tile is no safer: white on a
 * gradient to near-black reads on both, and it is the same bar whichever the step turns out to have.
 */
export function PlayerHeader({
  title,
  muted,
  stepIndex,
  totalSteps,
  elapsedSec,
  onBack,
  onToggleSound,
  onMenu,
}: PlayerHeaderProps) {
  const { t } = useT();
  const scrolled = usePageScrolled();
  const last = Math.max(1, totalSteps - 1);
  const n = Math.min(stepIndex + 1, last);
  return (
    <header className="fixed inset-x-0 top-0 z-30 text-paper">
      {/* Its own layer, so over the clip it can run past the bar and fade out over the frame. */}
      <div
        aria-hidden="true"
        className={clsx(
          'pointer-events-none absolute inset-x-0 top-0',
          scrolled
            ? 'h-full bg-bg'
            : 'h-[calc(100%+40px)] bg-linear-to-b from-ink/85 via-ink/55 to-transparent',
        )}
      />
      <div className="relative mx-auto w-full max-w-[560px] px-3 pt-[var(--safe-top)]">
        <div className="flex h-14 items-center gap-2">
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
        </div>
        <div className="flex items-baseline justify-between gap-3 px-1 pb-2">
          <span className="eyebrow tabular text-paper/75">
            {t('app.playerStepOf', { n, total: last })}
          </span>
          <span
            className="font-display tabular text-[22px] leading-none"
            aria-label={t('app.playerElapsed')}
          >
            {formatClock(elapsedSec)}
          </span>
        </div>
      </div>
    </header>
  );
}

export interface PlayerFooterProps {
  children: ReactNode;
}

/**
 * The bottom of every step: its own numbers and controls, over the clip.
 *
 * `sticky bottom-0` as the last thing on the page, not `fixed`: pinned to the viewport for as long
 * as anything is below it, and settling into place at the end of the scroll. That is what lets the
 * details above end where they end — a fixed bar would need the page to reserve its height, and its
 * height changes with every kind of step.
 */
export function PlayerFooter({ children }: PlayerFooterProps) {
  const scrolled = usePageScrolled();
  return (
    <div className="sticky bottom-0 z-30">
      <div
        aria-hidden="true"
        className={clsx(
          'pointer-events-none absolute inset-x-0 bottom-0',
          scrolled
            ? 'h-full bg-bg'
            : 'h-[calc(100%+72px)] bg-linear-to-t from-bg via-bg/92 to-transparent',
        )}
      />
      {/* A short fade above the solid band, so the words do not end on a hard edge. */}
      {scrolled ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-full h-8 bg-linear-to-t from-bg to-transparent"
        />
      ) : null}
      <div className="relative mx-auto w-full max-w-[560px] px-5 pt-6 pb-[calc(var(--safe-bottom)+16px+var(--demo-inset,0px))]">
        {children}
      </div>
    </div>
  );
}

export interface ProgressRowProps {
  stepIndex: number;
  totalSteps: number;
}

/** The 4px rule under the details, the one thing here that takes the programme colour. */
export function ProgressRow({ stepIndex, totalSteps }: ProgressRowProps) {
  const { t } = useT();
  const last = Math.max(1, totalSteps - 1);
  const value = Math.min(1, stepIndex / last);
  const n = Math.min(stepIndex + 1, last);
  return <ProgressBar value={value} label={t('app.playerStepOf', { n, total: last })} />;
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
    <ol className="flex items-stretch gap-2.5" aria-label={t('app.playerSectionsLabel')}>
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
 * Previous ‹ — Pause/Play — Next ›, over the clip.
 *
 * The two side controls are ink plates behind a light hairline, the same `on-art` treatment the
 * header uses, so they are findable on a bright frame; the middle one keeps the white fill, because
 * pause is the control someone reaches for without looking. Everything is square: the one circle
 * the brandbook allows is a play button laid over a video, and this is a row of three.
 */
export function Controls({ paused, canPrev, onPrev, onTogglePause, onNext }: ControlsProps) {
  const { t } = useT();
  const side =
    'flex h-[52px] w-[52px] items-center justify-center rounded-control border border-paper/25 bg-ink/55 text-paper transition-[background-color,transform] duration-150 ease-(--ease-out) hover:bg-ink/70 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40';
  return (
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
  );
}

export interface PausedOverlayProps {
  onResume: () => void;
  children?: ReactNode;
  className?: string;
}

/** Covers the whole player while paused; every timer underneath is frozen. */
export function PausedOverlay({ onResume, children, className }: PausedOverlayProps) {
  const { t } = useT();
  return (
    <div
      role="status"
      className={clsx(
        'fixed inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-bg/92 px-6 text-center',
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

export interface ScrollCueProps {
  label: string;
}

/**
 * The one hint that there is anything below the fold: a word and a chevron under the transport.
 * It goes away once the page has moved — by then it is pointing at where you already are.
 */
export function ScrollCue({ label }: ScrollCueProps) {
  const scrolled = usePageScrolled();
  if (scrolled) return null;
  return (
    <p className="control-label mt-3 flex items-center justify-center gap-1.5 text-[11px] text-paper/60">
      {label}
      <Glyph size={12}>⌄</Glyph>
    </p>
  );
}
