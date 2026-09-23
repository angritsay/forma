/**
 * Run `fn` at most once per `intervalMs`. Calls inside the window are dropped, not queued: the
 * caller is asking "is it worth checking again?", and a check a minute ago already answered.
 * `primed` starts the window at creation, for when the data was just read by someone else.
 * `now` is injectable for tests.
 */
export function throttled(
  fn: () => void,
  intervalMs: number,
  { primed = false, now = Date.now }: { primed?: boolean; now?: () => number } = {},
): () => boolean {
  let last = primed ? now() : -Infinity;
  return () => {
    const at = now();
    if (at - last < intervalMs) return false;
    last = at;
    fn();
    return true;
  };
}
