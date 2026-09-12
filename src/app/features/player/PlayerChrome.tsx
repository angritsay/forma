/**
 * Player chrome: the two corners of the card's front, the paused overlay, and the handle that
 * turns the card over.
 *
 * One rule decides what is allowed on the front. While the clip is playing an athlete is
 * mid-movement, and the only things worth reading at arm's length are **what they are doing and
 * how much of it is left**. So the top edge carries a way out and a way to stop, the bottom edge
 * carries the movement and its number, and there is nothing else on the card at all — no elapsed
 * clock, no sound control, no step counter, no preview of what comes next.
 *
 * Everything that is a decision — skipping a step, restarting it, skipping the warm-up, ending the
 * session — lives behind Pause, which is where someone has already stopped to make one. Everything
 * that is words lives on the back of the card (CardBack.tsx).
 */
import { clsx } from 'clsx';
import { useEffect, useRef, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Glyph, Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { useT } from '@/app/hooks/useT';
import { sectionLabel, type BlockSection } from './model';

export interface PlayerHeaderProps {
  /** 0..1 — how far through the session. Drawn as a hairline, never as a sentence. */
  progress: number;
  paused: boolean;
  onBack: () => void;
  onTogglePause: () => void;
}

/**
 * The top edge of the card: a hairline of progress, the way out, and the way to stop.
 *
 * It used to carry the movement's name, a sound toggle, a «···» menu, «Шаг 5 из 20» and the
 * elapsed clock. The name has moved to the bottom edge where it is the biggest thing on the card —
 * it is the answer to "what am I doing", which is not a caption — and the rest has gone. The
 * elapsed clock went last and on purpose: how long the session has been running is a fact about
 * the session, not about the set in front of you, and a number that only ever goes up is a thing
 * to watch instead of the movement.
 *
 * Everything is `--paper` on an ink scrim rather than the tile's ink. The frame underneath is a
 * photograph of a room and can be any brightness, and a bright yellow tile is no safer: white on a
 * gradient to near-black reads on both, whichever the step turns out to have.
 */
export function PlayerHeader({ progress, paused, onBack, onTogglePause }: PlayerHeaderProps) {
  const { t } = useT();
  return (
    <header className="absolute inset-x-0 top-0 z-30 text-paper">
      {/* Its own layer, so it can run past the bar and fade out over the frame. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[calc(100%+24px)] bg-linear-to-b from-ink/55 via-ink/20 to-transparent"
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
          <IconButton
            label={paused ? t('app.playerResume') : t('app.playerPause')}
            icon={paused ? 'play' : 'pause'}
            variant="on-art"
            onClick={onTogglePause}
          />
        </div>
      </div>
    </header>
  );
}

export interface PlayerFooterProps {
  children: ReactNode;
  /** Publishes the panel's height so the clip can be given the room above it. */
  onHeight?: (px: number) => void;
}

/**
 * The bottom edge of the card: the movement, its number, and the one control that moves it on.
 *
 * It is a pane of frosted glass, not a scrim. It used to be a gradient that went solid a long way
 * up the frame, and on a real clip — a man in a garden under a grey sky — that read as the video
 * being switched off halfway down rather than as a panel laid over it. Glass says the clip is still
 * there and something is sitting on top of it: a hairline along the top edge, a little of the app's
 * own ground, and a heavy blur of whatever is behind.
 *
 * It also reports its height, because the clip is sized to end above it (see ArtLayer) — and that
 * height changes with the step: a rep count with a stepper and a button is twice a countdown.
 */
export function PlayerFooter({ children, onHeight }: PlayerFooterProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !onHeight) return;
    const report = () => onHeight(el.getBoundingClientRect().height);
    report();
    // Every step renders its own footer, and a value can also change inside one (a stepper that
    // grows a line): measure the box rather than guessing from the step's kind.
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => ro.disconnect();
  }, [onHeight]);

  return (
    <div ref={ref} className="absolute inset-x-0 bottom-0 z-30">
      <div
        aria-hidden="true"
        /*
         * Thinnest at the top, where the clip is still showing through, and heaviest at the bottom,
         * where the numbers are. That gradient is also what hides the clip's own bottom edge inside
         * the panel — with a flat tint it read as a seam across the glass.
         */
        className="pointer-events-none absolute inset-0 border-t border-paper/15 bg-linear-to-b from-bg/35 via-bg/65 to-bg/80 backdrop-blur-xl"
      />
      {/* A short fade above the glass so its top edge is a line rather than a cut. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-full h-16 bg-linear-to-t from-bg/45 to-transparent"
      />
      {/*
       * Capped at the card's own height and scrollable inside that cap. Almost every step's footer
       * is three short things tall, but the end of an AMRAP asks for two steppers, two labels and a
       * save button — and in a card that is clipped rather than scrolled, anything taller than the
       * viewport would lose its top edge off the screen with no way to reach it.
       */}
      <div className="relative mx-auto max-h-dvh w-full max-w-[560px] overflow-y-auto overscroll-contain px-5 pt-6 pb-[calc(var(--safe-bottom)+16px+var(--demo-inset,0px))]">
        {children}
      </div>
    </div>
  );
}

export interface FlipHandleProps {
  onFlip: () => void;
  label: string;
}

/**
 * The one thing on the front that is not the set: a small handle saying the card has another side.
 *
 * It sits under the transport rather than beside the movement's name, so the eye meets it after
 * the number rather than instead of it, and it says what it does — «Как делать» — rather than
 * being a chevron someone has to guess at.
 */
export function FlipHandle({ onFlip, label }: FlipHandleProps) {
  return (
    <button
      type="button"
      onClick={onFlip}
      className="control-label tap-target-y mx-auto mt-3 flex items-center justify-center gap-1.5 text-[11px] text-paper/60 transition-colors duration-150 ease-(--ease-out) hover:text-paper"
    >
      {label}
      <Glyph size={12}>⟲</Glyph>
    </button>
  );
}

export interface SectionStepperProps {
  sections: BlockSection[];
  current: BlockSection;
}

/**
 * The three parts of a session — Разминка · Тренировка · Заминка — as kickers over 2px rules.
 * It lives on the back of the card now: where you are in the session is context, and context is
 * what the reverse is for. Hidden when a workout has only one part (a bare test), where it would
 * say nothing.
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
        // Opaque, not 92%: the frozen numbers and the movement's name read straight through a
        // translucent panel, so the list of decisions sat on top of what it replaces.
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
