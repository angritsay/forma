/**
 * The clip on the coach's screen, with the two controls reviewing a stack of proof actually needs:
 * a speed toggle and a bar you can drag with a thumb.
 *
 * **It exists because the evidence is as long as the task.** A ten-minute warm-up is sent in as a
 * ten-minute clip, and «did this person really do it» is not a question that needs ten minutes of
 * an evening to answer — but the native `<video controls>` gave no way to ask it faster. Speed
 * lives behind a submenu in Chrome, behind nothing at all on an iPhone, and the native scrubber is
 * a hairline at the bottom of the frame that a thumb cannot land on. So the chrome is ours: 1× /
 * 2× / 4× as three visible buttons, and a bar with a 44px band of hit area around it.
 *
 * The speed the coach picks carries to the next clip he opens in the same sitting (`lastSpeed`).
 * Reviewing is one long pass down a feed, and re-tapping 2× on every row is the kind of small tax
 * that makes a screen quietly go unused. It is deliberately not persisted to storage: a fresh
 * session starts at 1×, so nobody ever sits down to a feed silently running at quadruple speed.
 *
 * Nothing here is colour. This is `on-art` chrome over a photograph of somebody's living room —
 * white on an ink scrim, square ends, a typographic `×` — and the programme colour never lands on
 * a control (brandbook rule 1).
 */
import { clsx } from 'clsx';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { IconButton } from '@/components/ui/IconButton';
import { useT } from '@/app/hooks/useT';
import {
  formatClock,
  isPlayableDuration,
  NUDGE_SECONDS,
  nudge,
  playedRatio,
  ratioAt,
  REVIEW_SPEEDS,
  seekTarget,
  type ReviewSpeed,
} from './proofPlayer';

export interface ProofPlayerProps {
  /** A signed, short-lived URL for the object in the private `proofs` bucket. */
  src: string;
}

/** The speed chosen on the last clip, so a pass down the feed keeps it. Not persisted. */
let lastSpeed: ReviewSpeed = 1;

export function ProofPlayer({ src }: ProofPlayerProps) {
  const { t } = useT();
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<HTMLSpanElement>(null);
  const [speed, setSpeed] = useState<ReviewSpeed>(lastSpeed);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(Number.NaN);
  const [scrubbing, setScrubbing] = useState(false);

  /*
   * `playbackRate` is a property of the element, not an attribute, and it is reset whenever a new
   * source loads — so it is applied here on every change and again on `loadedmetadata` below.
   */
  useEffect(() => {
    const el = videoRef.current;
    if (el) el.playbackRate = speed;
    lastSpeed = speed;
  }, [speed]);

  const seekTo = useCallback((seconds: number) => {
    const el = videoRef.current;
    if (!el || !isPlayableDuration(el.duration)) return;
    el.currentTime = seconds;
    // Draw the new position now rather than waiting for `timeupdate`: a drag has to feel
    // fastened to the thumb, and the element only reports a few times a second.
    setTime(seconds);
  }, []);

  const seekToPointer = useCallback(
    (clientX: number) => {
      const box = trackRef.current?.getBoundingClientRect();
      const el = videoRef.current;
      if (!box || !el) return;
      seekTo(seekTarget(ratioAt(clientX, box.left, box.width), el.duration));
    },
    [seekTo],
  );

  const onPointerDown = (e: ReactPointerEvent<HTMLSpanElement>) => {
    // Capture, so the clip keeps following a thumb that has slid off the strip — or off the
    // side of the phone — instead of the gesture dying where the element ends.
    e.currentTarget.setPointerCapture(e.pointerId);
    setScrubbing(true);
    seekToPointer(e.clientX);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLSpanElement>) => {
    if (scrubbing) seekToPointer(e.clientX);
  };

  const endScrub = (e: ReactPointerEvent<HTMLSpanElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setScrubbing(false);
  };

  const toggle = () => {
    const el = videoRef.current;
    if (!el) return;
    // `play()` rejects when the browser is not in the mood (an interrupted load, a policy);
    // swallowing it keeps a failed tap from becoming an unhandled rejection in the coach's console.
    if (el.paused) void el.play().catch(() => undefined);
    else el.pause();
  };

  const known = isPlayableDuration(duration);
  const ratio = playedRatio(time, duration);

  return (
    <span className="glass-card relative mt-2 block overflow-hidden rounded-tile">
      {/* No `<track>`: a phone clip of somebody doing twenty squats carries no speech to caption,
          and an empty track element is a worse lie than none. */}
      <video
        ref={videoRef}
        src={src}
        preload="metadata"
        playsInline
        // The frame itself is the play button, which is how every video on a phone behaves.
        onClick={toggle}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => {
          // While a drag is in flight the thumb is the source of truth; `timeupdate` still
          // arrives for the seeks it causes, and letting it through makes the bar stutter.
          if (!scrubbing) setTime(e.currentTarget.currentTime);
        }}
        onLoadedMetadata={(e) => {
          e.currentTarget.playbackRate = speed;
          setDuration(e.currentTarget.duration);
        }}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        className="block max-h-80 w-full"
      />

      <span className="absolute inset-x-0 bottom-0 block">
        {/* Its own layer, so the controls sit on something legible whatever the frame behind
            them turns out to be — the same ink-to-nothing wash the player uses. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 top-[-24px] block bg-linear-to-t from-ink/75 via-ink/45 to-transparent"
        />

        <span className="relative flex items-center gap-2 px-2 pt-2 text-paper">
          <IconButton
            label={playing ? t('app.mAdminProofPause') : t('app.mAdminProofPlay')}
            icon={playing ? 'pause' : 'play'}
            variant="on-art"
            size="sm"
            onClick={toggle}
          />
          <span className="tabular text-[12px] text-paper/80">
            {formatClock(time)}
            <span className="text-paper/45"> / </span>
            {formatClock(duration)}
          </span>
          <span className="flex-1" />

          {/*
           * Three buttons rather than a menu: the whole point is that changing speed costs one
           * tap in the middle of watching. The chosen one is the white fill — the same way the
           * kit says «this one» everywhere else — and `aria-pressed` says it out loud.
           */}
          <span
            role="group"
            aria-label={t('app.mAdminProofSpeed')}
            className="flex items-center overflow-hidden rounded-control border border-paper/25 bg-ink/55"
          >
            {REVIEW_SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={s === speed}
                onClick={() => setSpeed(s)}
                className={clsx(
                  'font-display tap-target-y px-2.5 py-1.5 text-[12px] leading-none font-semibold transition-colors duration-150',
                  s === speed ? 'bg-paper text-ink' : 'text-paper/75 hover:text-paper',
                )}
              >
                {s}×
              </button>
            ))}
          </span>
        </span>

        {/*
         * The bar, and the reason the chrome is ours at all: a 4px rule with a 44px band of hit
         * area around it, so scrubbing a ten-minute clip is a thumb drawn across the bottom of
         * the frame rather than a hairline hunted for with a fingernail.
         *
         * `touch-none` on the band: the feed scrolls, and a drag that started on the bar must
         * scrub rather than scroll the page out from under it.
         */}
        <span
          ref={trackRef}
          role="slider"
          tabIndex={known ? 0 : -1}
          aria-label={t('app.mAdminProofSeek')}
          aria-valuemin={0}
          aria-valuemax={known ? Math.round(duration) : 0}
          aria-valuenow={known ? Math.round(time) : 0}
          aria-valuetext={formatClock(time)}
          aria-disabled={known ? undefined : true}
          onPointerDown={known ? onPointerDown : undefined}
          onPointerMove={known ? onPointerMove : undefined}
          onPointerUp={endScrub}
          onPointerCancel={endScrub}
          onKeyDown={(e) => {
            if (!known) return;
            const el = videoRef.current;
            if (!el) return;
            if (e.key === 'ArrowRight') seekTo(nudge(el.currentTime, duration, NUDGE_SECONDS));
            else if (e.key === 'ArrowLeft') seekTo(nudge(el.currentTime, duration, -NUDGE_SECONDS));
            else if (e.key === 'Home') seekTo(0);
            else if (e.key === 'End') seekTo(duration);
            else return;
            e.preventDefault();
          }}
          className="relative flex h-11 touch-none items-center px-2 outline-none focus-visible:ring-1 focus-visible:ring-paper/70 focus-visible:ring-inset"
        >
          {/* A rule, not a capsule — 4px, square ends, the way every bar in the kit is drawn. */}
          <span className="relative block h-1 w-full bg-paper/25">
            <span
              className="absolute inset-y-0 left-0 block bg-paper"
              style={{ width: `${ratio * 100}%` }}
            />
            {/*
             * The playhead is a square tick, not a knob: it says where the thumb is holding
             * without turning the one bar on the screen into a pill. It grows while dragging,
             * which is the only feedback a finger sitting on top of it can see.
             */}
            <span
              aria-hidden="true"
              className={clsx(
                'absolute top-1/2 block w-0.5 -translate-x-1/2 -translate-y-1/2 bg-paper transition-[height] duration-150',
                scrubbing ? 'h-5' : 'h-3',
              )}
              style={{ left: `${ratio * 100}%` }}
            />
          </span>
        </span>
      </span>
    </span>
  );
}
