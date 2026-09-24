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
import { Pill } from '@/components/ui/Pill';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefCallback,
} from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
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
  const headerSlot = useContext(HeaderSlotContext);
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
       * and divide them mid-set. It is progress, so it is the light blue (the semantic colour map,
       * global.css header) — not the programme colour, which is identity and not a state.
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
          className="h-full bg-accent transition-[width] duration-300 ease-(--ease-out)"
          style={{ width: `${Math.min(1, Math.max(0, progress)) * 100}%` }}
        />
      </div>
      <div className="relative mx-auto w-full max-w-[560px] px-3 pt-[var(--safe-top)]">
        <div className="flex h-14 items-center gap-2">
          <IconButton label={t('common.back')} icon="back" variant="on-art" onClick={onBack} />
          {/* The step's own progress line lands here, between the two buttons — see
              `PlayerHeaderSlot`. Empty on a step without one, and then it is only the spacer. */}
          <div
            ref={headerSlot?.setNode}
            className="flex min-w-0 flex-1 items-center justify-center px-4"
          />
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

/*
 * --- the clock, and why it is not in the panel any more -----------------------------------------
 *
 * The owner: «будет замечательно, если ты разделишь вот этот нижний блок на две части: верхняя там
 * какой-нибудь таймер, как у нас есть, а нижняя это уже про выполнение. Таким образом мы сможем
 * центрировать, чтобы было видно технику выполнения упражнения.»
 *
 * Everything used to sit in one band at the foot: the movement's name, the countdown, the progress
 * line, the controls. That band is tall — 235px measured on a timed step — and the clip was given
 * the room above it, so the movement was drawn in the upper two thirds of the screen while the eye
 * sat in the middle of the band. Splitting it puts the clock in a band of its own under the header
 * and leaves «про выполнение» below, and the picture is then framed between two edges instead of
 * pushed up off one.
 *
 * **It is a portal rather than a prop.** Every step owns its own clock — the countdown, its cues,
 * the auto-advance at zero are all hooks inside `WorkTimerStep`, `RestStep`, `AmrapStep`,
 * `FortimeStep` and `TestStep` — so handing the clock upward as a prop would mean lifting that
 * state out of the component that runs it, or splitting each step into two components that share a
 * clock. A step instead renders `<PlayerTimerSlot>` wherever it likes in its own tree, and the
 * band is where those children land. The steps that have no clock (reps, a block's title card)
 * render no slot, `:empty` matches, and the band disappears with `--player-top-h` going to zero.
 */
const TimerBandContext = createContext<HTMLElement | null>(null);

/**
 * The gap between the back and pause buttons in the header, as a second portal target.
 *
 * The owner: «нижнюю полоску с цифрами под большим таймером нужно расположить между кнопками назад
 * и пауза, цифры можно не подписывать». The line says how far through this movement you are; under
 * the clock it made the band taller and pushed the clip down, and its two numbers repeated what the
 * clock already says. In the header it costs no height at all. The header is a sibling of the
 * steps, like the band, so the node lives in the same provider: the header registers it, a step
 * portals into it.
 */
const HeaderSlotContext = createContext<{
  node: HTMLElement | null;
  setNode: (el: HTMLElement | null) => void;
} | null>(null);

export interface PlayerTimerBandProps {
  /** Publishes the band's height so the clip can start below it. Zero while it is empty. */
  onHeight?: (px: number) => void;
  /** The rest of the card's front. It has to be inside, or no step could reach the band. */
  children: ReactNode;
}

/**
 * The band under the header that holds the running step's clock — and the provider that lets any
 * step reach it.
 *
 * The two are one component because they have to be: the band's DOM node is what a step portals
 * into, and a step is rendered inside the panel at the *foot* of the card, which is this band's
 * sibling rather than its child. Wrapping the whole front is what puts the node in scope. The band
 * itself is absolutely positioned, so being first among those children costs the layout nothing.
 *
 * It is the same material as the panel at the foot, turned the other way up: `.glass-bar-top` is
 * dense where the numbers are and sheer where the clip arrives from, so the clip runs under its
 * lower edge rather than stopping at a line.
 *
 * `empty:hidden` is what makes it free for a step without a clock — no band, no height, nothing to
 * subtract. It works because the portal inserts real DOM children, so `:empty` is an honest test of
 * whether this step put anything here.
 */
export function PlayerTimerBand({ onHeight, children }: PlayerTimerBandProps) {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [headerNode, setHeaderNode] = useState<HTMLElement | null>(null);
  const headerSlot = useMemo(() => ({ node: headerNode, setNode: setHeaderNode }), [headerNode]);
  const ref: RefCallback<HTMLDivElement> = (el) => {
    setNode(el);
  };

  useEffect(() => {
    if (!node || !onHeight) return;
    const report = () => onHeight(node.getBoundingClientRect().height);
    report();
    // The clock's own box changes inside one step — a caption appears, a progress line is added —
    // so the box is measured rather than guessed at, exactly as the footer's is.
    const ro = new ResizeObserver(report);
    ro.observe(node);
    return () => {
      ro.disconnect();
      onHeight(0);
    };
  }, [node, onHeight]);

  return (
    <TimerBandContext.Provider value={node}>
      <HeaderSlotContext.Provider value={headerSlot}>
        <div
          ref={ref}
          className="glass-bar-top glass-sheer pointer-events-none absolute inset-x-0 top-[calc(var(--safe-top)+56px)] z-20 px-6 pt-2 pb-4 text-paper empty:hidden md:right-95"
        />
        {children}
      </HeaderSlotContext.Provider>
    </TimerBandContext.Provider>
  );
}

/**
 * Puts its children in the band above, from anywhere inside the player's tree.
 *
 * Renders nothing at all before the band's node exists (the first paint) and nothing when there is
 * no band, so a step can use it unconditionally.
 */
export function PlayerTimerSlot({ children }: { children: ReactNode }) {
  const node = useContext(TimerBandContext);
  if (!node) return null;
  return createPortal(
    <div className="pointer-events-auto mx-auto w-full max-w-[560px]">{children}</div>,
    node,
  );
}

/** Puts its children between the header's back and pause buttons, from anywhere in the player. */
export function PlayerHeaderSlot({ children }: { children: ReactNode }) {
  const slot = useContext(HeaderSlotContext);
  if (!slot?.node) return null;
  return createPortal(<div className="w-full max-w-[240px]">{children}</div>, slot.node);
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
 * It also reports its height, because the clip is sized to end above it (see ArtFeed) — and that
 * height changes with the step: a rep count with a stepper and a button is twice a countdown.
 *
 * **From `md` it is a column down the right-hand side instead of a band across the bottom.** The
 * owner's choice for training from a laptop: «видео крупно, счётчик сбоку». The reason it works is
 * the same one that makes it a band on a phone — the panel goes where the screen has room to spare.
 * A phone is tall and has it at the foot; a laptop is wide and has it at the side, and a band
 * across 1440px would be a strip of numbers a metre from the movement they belong to.
 *
 * Three things follow. The glass turns ninety degrees (`--glass-angle`), so it is sheer where the
 * clip meets it and dense where the numbers sit — the whole point of the gradient, now on the
 * other axis. The fade above it becomes a fade to its left. And the measured height stops mattering:
 * the column is a fixed width, so `ArtFeed` insets by that instead.
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
    <div
      ref={ref}
      className="absolute inset-x-0 bottom-0 z-30 md:inset-y-0 md:right-0 md:left-auto md:w-95"
    >
      <div
        aria-hidden="true"
        /*
         * This panel is where the material came from — the owner saw it and asked for the system to
         * read this way — so it is now the token rather than a copy of it. `.glass-bar` is that same
         * line, generalised: thinnest at the top, where the clip is still showing through, heaviest
         * at the bottom, where the numbers are, and a `--paper` hairline along the top edge. The
         * gradient is also what hides the clip's own bottom edge inside the panel; with a flat tint
         * it read as a seam across the glass.
         *
         * `.glass-sheer` restores this panel's own alphas. The shared bar had to be made denser for
         * the tab bar, whose 10px labels sit over whatever list is scrolling underneath; here the
         * clip carrying on behind the numbers is the point, so the surface keeps the weight it had.
         */
        className="glass-bar glass-sheer pointer-events-none absolute inset-0 md:[--glass-angle:90deg]"
      />
      {/* A short fade above the glass so its edge is a line rather than a cut — to its left from
          `md`, where the panel stands beside the clip rather than under it. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-full h-16 bg-linear-to-t from-bg/45 to-transparent md:inset-x-auto md:inset-y-0 md:right-full md:h-auto md:w-16 md:bg-linear-to-l"
      />
      {/*
       * Capped at the card's own height and scrollable inside that cap. Almost every step's footer
       * is three short things tall, but the end of an AMRAP asks for two steppers, two labels and a
       * save button — and in a card that is clipped rather than scrolled, anything taller than the
       * viewport would lose its top edge off the screen with no way to reach it.
       */}
      <div className="relative mx-auto max-h-dvh w-full max-w-[560px] overflow-y-auto overscroll-contain px-6 pt-6 pb-[calc(var(--safe-bottom)+16px+var(--demo-inset,0px))] md:flex md:h-full md:max-h-none md:flex-col md:justify-center md:px-8">
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
 * Where you are in the session — Разминка, Тренировка or Заминка — as one of the brand's pills.
 *
 * It was three kickers over 2px rules, all three at once, the current one light blue. On the back
 * of the card that read as a tab bar: three words in a row with a line over each look pressable,
 * and they are not. The owner: «вместо верхнего таба сделай наши фирменные пилюли, но не все сразу
 * три, а только ту, что подходит». So the reverse says the one fact it is there for — which part
 * this movement belongs to — in the `sky` pill (light blue is progress and «where you are», the
 * semantic map in global.css). The full order stays in the accessible name, where a screen reader
 * still hears «2 of 3».
 *
 * Hidden when a workout has only one part (a bare test), where it would say nothing.
 */
export function SectionStepper({ sections, current }: SectionStepperProps) {
  const { t } = useT();
  if (sections.length < 2) return null;
  const position = sections.indexOf(current) + 1;
  return (
    <div
      className="flex"
      role="status"
      aria-label={`${t('app.playerSectionsLabel')}: ${sectionLabel(t, current)} (${position}/${sections.length})`}
    >
      <Pill tone="sky" aria-hidden="true">
        {sectionLabel(t, current)}
      </Pill>
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
        // Opaque, not 92%: the frozen numbers and the movement's name read straight through a
        // translucent panel, so the list of decisions sat on top of what it replaces.
        'fixed inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-bg px-6 text-center',
        className,
      )}
    >
      <span className="font-display text-4xl">{t('app.playerPausedTitle')}</span>
      <p className="max-w-[30ch] text-[15px] text-muted">{t('app.playerPausedBody')}</p>
      <Button
        variant="action"
        size="lg"
        onClick={onResume}
        icon={<Icon name="play" size={16} />}
        data-autofocus
      >
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
