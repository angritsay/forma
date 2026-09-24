/**
 * The demonstration: the coach's own clip of the movement — as a feed.
 *
 * The movement before, the one on screen and the one after are all mounted, one screen apart, on
 * a track that follows the finger (`y`) and snaps when it lets go (see `feed.ts` and `Player`).
 * Swiping up is then the next clip sliding into view with the thumb, not one clip being swapped
 * for another on `touchend` and faded up from black — the owner's «очень резкие» transitions.
 *
 * Mounting the neighbours is also what makes the next clip fast. Each slide is its own `<video>`
 * with `preload="auto"`, so the clip after this one is downloading while this one plays, and the
 * slide that becomes current is the same element that has been loading all along: nothing is
 * remounted, nothing starts from zero. Slides are keyed by step index for exactly that reason.
 *
 * A still from the same clip sits under every video, and the video is transparent until it has a
 * frame to show. So the athlete never sees black: first the still (a frame of the very movement),
 * then the clip crossfading in over it. A movement with neither — not filmed, no still — shows its
 * name on the programme colour instead, because a black screen reads as a broken workout.
 */
import { clsx } from 'clsx';
import { useEffect, useRef, useState, type CSSProperties, type Ref } from 'react';
import { ExerciseStill } from '@/components/media/ExerciseStill';
import { exerciseStillUrl } from '@/lib/api/storage';
import { useMediaUrl } from './useMediaUrl';

/**
 * How a movement is drawn, clip or still, in one string.
 *
 * **The clip is as wide as the screen, always, and that is geometry rather than a decision.**
 * `w-full h-auto` sets the width to the stage's and lets the height follow the clip's own shape;
 * the stage hides what runs past it. A clip taller than the stage is therefore cropped evenly top
 * and bottom — the same result `object-cover` gives — and a shorter one sits centred with space
 * above and below. Neither case can put a bar down the side, because nothing is ever fitted by
 * height.
 *
 * This is the third answer to the same question. `object-cover` as a blanket rule cropped the
 * coach's landscape garden footage to a vertical strip with the squat off-screen; `w-full h-auto
 * max-h-full object-contain` let `max-h-full` win whenever the clip was taller than the stage and
 * painted a portrait squat 239px wide between two bars of black; reading `videoWidth` on
 * `loadedmetadata` and choosing between the two was right in arithmetic and failed whenever the
 * event fired before the listener — the owner's «ЗАМИНКА И РАСТЯЖКА» with 37pt of black down both
 * sides. Geometry has no such moment.
 *
 * From `md` the stage is wider than it is tall and the same rule would crop half a movement away
 * to fill a width nobody was short of, so there the clip is contained instead — `md:h-full
 * md:w-auto`, letterboxed, which a laptop has the room for.
 */
const ART =
  'player-art-lift w-full h-auto md:h-full md:w-auto md:max-h-full md:max-w-full object-contain';

/*
 * The stage: everything under the clock's band and above the glass, less a good deal that slips
 * under the glass.
 *
 * The overlap is 120px, and that number is the fix for the black bars. A 9:16 clip in a 390px-wide
 * stage wants to be 693px tall; at the old 40px the stage was 424px and `contain` fitted it by
 * height. At 120px the stage is about 700px and the clip is fitted by width: 390 across, no bars.
 * The overlap also puts real picture behind the panel, which is the only thing that makes frosted
 * glass read as glass. `TapToPause` keeps 40px deliberately: the part of the picture behind the
 * panel belongs to the panel's buttons.
 *
 * The top belongs to the clock's band (`--player-top-h`, zero on steps with no clock): a movement
 * half-read through frosted glass is not a demonstration. From `md` the panel is a column on the
 * right, so the stage gives up width instead of height. `overflow-hidden` is on the stage itself
 * because a 9:20 clip is taller than it and has to be cropped by something that does not also
 * run up behind the header.
 */
const STAGE =
  'absolute inset-x-0 top-[var(--player-top-h,0px)] bottom-[max(0px,calc(var(--player-glass-h,0px)-120px))] flex items-center overflow-hidden md:right-85 md:bottom-0';

export interface FeedSlide {
  /** The step's index — the slide's key, so a clip that moves into view is the same element. */
  index: number;
  exerciseId: string | undefined;
  videoRef: string | undefined;
  /** The movement's name, drawn when there is neither a clip nor a still. */
  name: string | undefined;
}

interface ArtSlideProps extends FeedSlide {
  /** -1 above, 0 on screen, 1 below. */
  offset: number;
  playing: boolean;
}

function ArtSlide({ exerciseId, videoRef, name, offset, playing }: ArtSlideProps) {
  const video = useRef<HTMLVideoElement>(null);
  const url = useMediaUrl(videoRef);
  const still = exerciseId ? exerciseStillUrl(exerciseId) : undefined;
  // The URL whose first frame has arrived. Until then the video is transparent over the still.
  const [ready, setReady] = useState<string | undefined>(undefined);
  const current = offset === 0;

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    if (current && playing) void el.play().catch(() => undefined);
    else el.pause();
  }, [current, playing, url]);

  return (
    <div className="absolute inset-x-0 h-full" style={{ top: `${offset * 100}%` }}>
      <div className={STAGE}>
        <ExerciseStill
          key={exerciseId}
          exerciseId={exerciseId}
          className={ART}
          loading="eager"
          fallback={
            videoRef || !name ? null : (
              <div className="flex size-full items-center justify-center bg-surface-2 px-8 text-center">
                <span className="display text-3xl text-text">{name}</span>
              </div>
            )
          }
        />
      </div>
      {url ? (
        <div className={STAGE}>
          {/*
           * It starts by itself when its slide becomes current — that is what the effect above is
           * for. A silent loop: the clips carry no audio track (scripts/media/prepare-videos.mjs),
           * and `muted` is still set because without it a browser refuses to autoplay at all.
           */}
          <video
            key={url}
            ref={video}
            src={url}
            poster={still}
            className={clsx(ART, 'player-clip', ready === url && 'is-ready')}
            playsInline
            muted
            loop
            autoPlay={current && playing}
            preload="auto"
            onLoadedData={() => setReady(url)}
            onPlaying={() => setReady(url)}
          />
        </div>
      ) : null}
    </div>
  );
}

export interface ArtFeedProps {
  /** The step before, the step on screen and the step after — whichever of them exist. */
  slides: readonly (FeedSlide & { offset: number })[];
  playing: boolean;
  /** Where the track is, in px: the finger's drag, or a snap on its way. */
  y: number;
  /** Whether the next change of `y` is a transition (a snap) or immediate (a finger). */
  animate: boolean;
  /** The snap has landed. */
  onSettled: () => void;
  trackRef?: Ref<HTMLDivElement>;
}

/**
 * The ground is the app's own graphite, not the programme colour: the clock, the transport and the
 * header all have to stay legible over whatever is behind them.
 */
export function ArtFeed({ slides, playing, y, animate, onSettled, trackRef }: ArtFeedProps) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-bg" aria-hidden="true">
      <div
        ref={trackRef}
        className={clsx('player-feed-track absolute inset-0', animate && 'is-snapping')}
        style={{ '--feed-y': `${y}px` } as CSSProperties}
        onTransitionEnd={(e) => {
          if (e.target === e.currentTarget && e.propertyName === 'transform') onSettled();
        }}
      >
        {slides.map((slide) => (
          <ArtSlide key={slide.index} {...slide} playing={playing} />
        ))}
      </div>
    </div>
  );
}
