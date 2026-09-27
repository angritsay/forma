/**
 * Does this person want less motion?
 *
 * Four screens each carried their own copy of this query (`AuthScreen`, `BookScreen`,
 * `PlayerScreen`, `ClubDemoChat`), and the club's game layer adds three more places that have to
 * ask it — the sealed task card, the confetti, the streak's pulse — so the question gets one
 * answer here. The CSS side of the same rule is the `prefers-reduced-motion` block in global.css;
 * this is for the pieces that decide *whether to start* an animation at all, where turning the
 * keyframes off would leave a canvas drawing nothing for a second.
 *
 * Safe in node and in a WebView without `matchMedia`: both read as «no preference».
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches === true;
  } catch {
    return false;
  }
}
