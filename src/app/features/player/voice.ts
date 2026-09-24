/**
 * The one recorded sound in the player: the exercise's name, spoken, at the start of its step.
 *
 * A person in a forward fold cannot read the panel. The coach records each movement's name per
 * language (`Exercise.audio`, `storage:audio/shared/<id>.<lang>.m4a`, docs/VIDEO.md «Аудио») and
 * the player says it when the step arrives, so the athlete hears what comes next with their eyes
 * on the floor.
 *
 * ## Why WebAudio and not an `<audio>` element
 *
 * iOS lets a page make sound only after a gesture, and it grants that per mechanism: the
 * AudioContext the cues play through is unlocked by the tap that starts the session (`unlockAudio`
 * in the start buttons and on every pointer-down in the player), and an `<audio>` element would
 * need a gesture of its own — which the step change that should speak the name is not. So the
 * recordings are decoded once into `AudioBuffer`s and played through the same context as the
 * beeps: whatever unlocked one has unlocked the other, and the mute switch covers both.
 *
 * ## One voice at a time
 *
 * A name that is still being said when the next step arrives (a skip, a swipe) is cut, not
 * layered: two names at once is noise, and the newer one is the one that matters. The cues are
 * allowed to overlap a voice — «дальше» under the name of the next movement is one event heard
 * twice, and the beep is over in a fifth of a second.
 *
 * ## Pause
 *
 * A name file is at most two seconds. Pausing the workout stops the voice and resuming does not
 * pick it up again — half a word a minute later would be stranger than silence — and the step
 * it belongs to is still on screen with its name written on the panel.
 *
 * ## A recording still on its way
 *
 * On a slow connection the first step can arrive before its name has finished decoding: the
 * player signs and prefetches everything as it opens, and the first step asks at once. Saying
 * nothing then was the known gap. So a recording whose decode is in flight is waited for — up to
 * {@link VOICE_WAIT_MS}, longer for a caller that asks (an explanation has no clock running) — and
 * said only if nothing has happened since: every `stopVoice` and every `playVoice` moves a
 * generation counter on, and a late recording whose generation is gone stays silent. A step that
 * was left, paused or replaced in the meantime is exactly one of those. A ref never asked for
 * (not prefetched) is still not fetched here.
 *
 * Everything here is best effort and never throws: a name that failed to load, decode or play is
 * a name not said, and the workout goes on.
 */
import { resolveMediaUrl } from '@/lib/api/storage';
import { getAudioContext, isSoundMuted } from './sound';

/** A little under full scale: the recordings are normalised, and a phone speaker clips at 1. */
const VOICE_GAIN = 0.9;

/** Every ref ever asked for, resolved or not: a failed one is `null` and is not asked again. */
const decoding = new Map<string, Promise<AudioBuffer | null>>();
/** The subset that is ready to play, for the synchronous lookup `playVoice` needs. */
const ready = new Map<string, AudioBuffer>();

let current: AudioBufferSourceNode | null = null;
/** Moves on with every stop and every play: a late recording plays only if it is still current. */
let generation = 0;

/** How long a recording still decoding is waited for before the moment is considered gone. */
export const VOICE_WAIT_MS = 1500;

/**
 * `decodeAudioData` returns a promise everywhere that matters now; old WebKit only took callbacks
 * and returned nothing. The callback form gets a copy of the bytes because the first attempt may
 * have detached them.
 */
function decode(ctx: AudioContext, bytes: ArrayBuffer): Promise<AudioBuffer> {
  try {
    const p = ctx.decodeAudioData(bytes) as Promise<AudioBuffer> | undefined;
    if (p && typeof p.then === 'function') return p;
  } catch {
    /* Fall through to the callback form. */
  }
  return new Promise((resolve, reject) => {
    ctx.decodeAudioData(bytes.slice(0), resolve, reject);
  });
}

async function load(ref: string): Promise<AudioBuffer | null> {
  try {
    // The demo backend has no buckets and answers undefined for a `storage:` ref: nothing to say.
    const url = await resolveMediaUrl(ref);
    if (!url) return null;
    const ctx = getAudioContext();
    if (!ctx) return null;
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = await decode(ctx, await res.arrayBuffer());
    ready.set(ref, buffer);
    return buffer;
  } catch {
    return null;
  }
}

/**
 * Fetch and decode every recording a session can speak, once each, so `playVoice` finds them
 * ready. Called with the session's refs when the player opens (see `sessionAudioRefs`). Resolves
 * when every one has either decoded or failed; never rejects.
 */
export async function prefetchVoice(refs: readonly string[]): Promise<void> {
  const pending: Promise<unknown>[] = [];
  for (const ref of new Set(refs)) {
    let p = decoding.get(ref);
    if (!p) {
      p = load(ref);
      decoding.set(ref, p);
    }
    pending.push(p);
  }
  await Promise.all(pending);
}

/** Cut the voice that is playing, if any. */
export function stopVoice(): void {
  generation += 1;
  const source = current;
  current = null;
  if (!source) return;
  try {
    source.onended = null;
    source.stop();
    source.disconnect();
  } catch {
    /* Already stopped, or a closed context. */
  }
}

/**
 * Say a recording, cutting whatever was being said. A no-op with nothing to say (no ref), with the
 * sound off, and for a recording that was never prefetched or failed to load. One still decoding
 * is waited for up to `waitMs` and said then — unless anything else was played or stopped in the
 * meantime, because then the step it belonged to is over.
 */
export function playVoice(ref: string | undefined, opts?: { waitMs?: number }): void {
  if (!ref || isSoundMuted()) return;
  stopVoice();
  const buffer = ready.get(ref);
  if (buffer) {
    start(buffer);
    return;
  }
  const pending = decoding.get(ref);
  if (!pending) return;
  const mine = generation;
  const waitMs = Math.max(0, opts?.waitMs ?? VOICE_WAIT_MS);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), waitMs);
  });
  void Promise.race([pending, timeout])
    .then((late) => {
      clearTimeout(timer);
      if (!late || mine !== generation || isSoundMuted()) return;
      start(late);
    })
    .catch(() => undefined);
}

function start(buffer: AudioBuffer): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = VOICE_GAIN;
    source.connect(gain).connect(ctx.destination);
    source.onended = () => {
      if (current === source) current = null;
    };
    source.start();
    current = source;
  } catch {
    /* A closed context or an odd browser: the name goes unsaid. */
  }
}
