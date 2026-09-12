/**
 * Player chrome: the bar over the clip, the section stepper, the transport and the paused overlay.
 * Presentational — the screen owns the state.
 *
 * One rule decides what is allowed on this screen: while the clip is playing an athlete is
 * mid-movement, and the only things worth reading at arm's length are **what they are doing, the
 * number, and what comes next**. Everything else — skipping a step, restarting it, ending the
 * session, the sound cues — is a decision, and a decision belongs behind Pause, which is where
 * someone has already stopped to make one.
 *
 * That is why the top bar is a back arrow and a clock, why the transport is a single pause button
 * with no chevrons beside it, and why the step count is a hairline rather than «Шаг 5 из 20». The
 * words — technique, the block's list, the coach's note — live below the fold and never take the
 * timer with them.
 */
import { clsx } from 'clsx';
import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Glyph, Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { useT } from '@/app/hooks/useT';
import { formatClock } from '@/i18n/index';
import { sectionLabel, type BlockSection } from './model';

/*
 * A loudspeaker is a physical object no glyph says, so it stays an icon: 16px, square caps, a
 * cross through it when muted. It is the only picture in the app's chrome besides play and pause,
 * and it lives on the profile screen — the timer cues are a preference, set once, not something
 * to weigh up between two sets.
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
  /** 0..1 — how far through the session. Drawn as a hairline, never as a sentence. */
  progress: number;
  elapsedSec: number;
  onBack: () => void;
}

/**
 * Fixed to the top of the viewport, over the clip: a hairline of progress, a way out, and the
 * clock.
 *
 * It used to carry the movement's name at 13px, a sound toggle, a «···» menu and «Шаг 5 из 20».
 * The name has moved down to the footer where it is the biggest thing on the screen — it is the
 * answer to "what am I doing", which is not a caption — and the rest has gone behind Pause. What
 * is left is the one number you look *up* for, which is how long you have been going.
 *
 * Everything is `--paper` on an ink scrim rather than the tile's ink. The frame underneath is a
 * photograph of a room and can be any brightness, and a bright yellow tile is no safer: white on a
 * gradient to near-black reads on both, and it is the same bar whichever the step turns out to have.
 */
export function PlayerHeader({ progress, elapsedSec, onBack }: PlayerHeaderProps) {
  const { t } = useT();
  const scrolled = usePageScrolled();
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
      {/*
       * How far through the session, as a 2px rule along the very top edge.
       *
       * A rule says the same thing «Шаг 5 из 20» said, without asking anyone to read two numbers
       * and divide them mid-set. It is the one place the programme colour appears up here.
       */}
      <div
        className="relative h-[2px] w-full bg-paper/15"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        aria-label={t('app.playerProgressLabel')}
      >
        <div
          className="h-full bg-course transition-[width] duration-300 ease-(--ease-out)"
          style={{ width: `${Math.min(1, Math.max(0, progress)) * 100}%` }}
        />
      </div>
      <div className="relative mx-auto w-full max-w-[560px] px-3 pt-[var(--safe-top)]">
        <div className="flex h-14 items-center gap-2">
          <IconButton label={t('common.back')} icon="back" variant="on-art" onClick={onBack} />
          <span className="flex-1" />
          <span
            className="font-display tabular pr-1 text-[22px] leading-none"
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
            : /*
               * Solid for the lower half, then a long fade.
               *
               * It used to start fading immediately, and the movement's name — now the biggest
               * thing in the footer — landed in the faint part, with the figure's legs running
               * straight through the letters. The ground under words has to be a ground.
               */
              'h-[calc(100%+96px)] bg-linear-to-t from-bg from-55% via-bg/90 via-80% to-transparent',
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
  onTogglePause: () => void;
}

/**
 * Pause. That is the whole transport.
 *
 * There were chevrons either side of it, and both were redundant: every step already carries the
 * one action that moves it on — «Готово» on a set, «Поехали» on a rest, and a timed step advances
 * itself — so «›» was a second next button sitting next to the first. «‹» went the other way, a
 * control you only want after a mis-tap, offered at the exact moment a mis-tap is easiest. It is
 * behind Pause now, with the other decisions.
 *
 * Square, like everything else: the one circle the brandbook allows is a play button laid over a
 * video, and this is a control bar.
 */
export function Controls({ paused, onTogglePause }: ControlsProps) {
  const { t } = useT();
  return (
    <div className="flex items-center justify-center">
      <button
        type="button"
        className="flex h-16 w-16 items-center justify-center rounded-control bg-primary text-on-primary transition-[opacity,transform] duration-150 ease-(--ease-out) hover:opacity-85 active:scale-[0.98]"
        onClick={onTogglePause}
        aria-label={paused ? t('app.playerResume') : t('app.playerPause')}
        aria-pressed={paused}
      >
        <Icon name={paused ? 'play' : 'pause'} size={20} />
      </button>
    </div>
  );
}

export interface PausedAction {
  label: string;
  onClick: () => void;
  /** Ending the session is the one that cannot be undone. */
  danger?: boolean;
}

export interface PausedOverlayProps {
  onResume: () => void;
  /** Everything the player used to offer mid-set: go back a step, restart it, skip it, end. */
  actions?: readonly PausedAction[];
  className?: string;
}

/**
 * Covers the whole player while paused; every timer underneath is frozen.
 *
 * This is also where the player keeps its decisions. Skipping a step, restarting it and ending the
 * session were a «···» menu in the top bar — three taps away and, more to the point, three things
 * to ignore on a screen someone is using to do burpees. Pausing is the moment a person has already
 * decided to stop and think, so the list opens where the thinking happens.
 */
export function PausedOverlay({ onResume, actions, className }: PausedOverlayProps) {
  const { t } = useT();
  return (
    <div
      role="status"
      className={clsx(
        // Opaque, not 92%: the frozen clock and the movement's name read straight through a
        // translucent panel, so the list of decisions sat on top of the numbers it replaces.
        'fixed inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-bg px-6 text-center',
        className,
      )}
    >
      <span className="font-display text-4xl">{t('app.playerPausedTitle')}</span>
      <p className="max-w-[30ch] text-[15px] text-muted">{t('app.playerPausedBody')}</p>
      <Button size="lg" onClick={onResume} icon={<Icon name="play" size={16} />} data-autofocus>
        {t('app.playerResume')}
      </Button>
      {actions && actions.length > 0 ? (
        <div className="mt-2 flex w-full max-w-[320px] flex-col">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className={clsx(
                'control-label border-t border-border py-3.5 text-[11px] transition-colors duration-150 ease-(--ease-out)',
                action.danger ? 'text-danger' : 'text-muted hover:text-text',
              )}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
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
