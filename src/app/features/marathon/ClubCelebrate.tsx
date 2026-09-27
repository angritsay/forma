/**
 * The small win: what happens on the screen the moment a proof is sent.
 *
 * The owner's brief for the club's active week — «геймифицировать… регулярная подпитка
 * дофамином… желание зайти и узнать новое задание, поучаствовать, поделиться» — has a moment in
 * the middle that the screen used to answer with a check mark and nothing else. The check still
 * lands (`TaskCard`); this adds the three things a phone can do in the same second:
 *
 *   1. a haptic «success» through Telegram, silent elsewhere (`haptic`);
 *   2. a burst of confetti, about sixty pieces, for under a second, drawn on a canvas laid over
 *      the whole screen and removed when it fades;
 *   3. the points themselves — «+12» — rising from the button that was pressed and fading, so
 *      the number the board is about to gain is seen leaving the card.
 *
 * **Imperative, not a component.** The proof is sent from a callback in `MarathonScreen`, and
 * what should happen next is a side effect at a screen position, not a piece of state the tree
 * has to hold for 900ms and then forget. Both pieces are appended to `<body>` and clean
 * themselves up; nothing re-renders.
 *
 * **The club's colours and no neon** (design/CHANGELOG.md §17): the confetti is the warm
 * gradient's three stops — light blue, beige, orange — read from the stylesheet's own custom
 * properties at run time, so there is no hex in this file and a retuned palette retunes the
 * burst. The numeral is `--orange`, the gradient's hot end, in the display face (`.numeral`).
 *
 * **Reduced motion.** Somebody who asked their phone for less motion gets the haptic and the
 * check and nothing else — no canvas, no rising number. The CSS side is off too
 * (`prefers-reduced-motion` in global.css), but the decision is taken here so the canvas is
 * never even created.
 */
import { haptic } from '@/lib/telegram/webapp';
import { prefersReducedMotion } from '@/lib/ui/motion';

export interface CelebrateInput {
  /** The points just earned: drawn as «+{points}». Omit for a burst without a number. */
  points?: number;
  /** Something other than points to rise from the anchor («🔥 7» for a streak milestone). */
  text?: string;
  /** Where the number rises from and the burst starts; the screen's centre when absent. */
  anchor?: HTMLElement | null;
}

const CONFETTI_MS = 900;
const PARTICLES = 60;
/** The warm gradient's stops, by token name; `--accent`, `--beige`, `--orange` in global.css. */
const COLOUR_TOKENS = ['--accent', '--beige', '--orange'] as const;

export function celebrate({ points, text, anchor }: CelebrateInput): void {
  haptic('success');
  if (typeof document === 'undefined' || prefersReducedMotion()) return;
  const origin = originOf(anchor ?? null);
  const label = text ?? (points !== undefined ? `+${points}` : null);
  try {
    if (label !== null) risingNumeral(label, origin);
    confetti(origin);
  } catch {
    /* A canvas that will not open, or a body that is gone: the proof was still sent. */
  }
}

interface Point {
  x: number;
  y: number;
}

function originOf(anchor: HTMLElement | null): Point {
  if (anchor) {
    const r = anchor.getBoundingClientRect();
    if (r.width > 0 || r.height > 0) return { x: r.left + r.width / 2, y: r.top };
  }
  return { x: window.innerWidth / 2, y: window.innerHeight * 0.6 };
}

/** The colours as the stylesheet resolves them right now; anything unset is left out. */
function colours(): string[] {
  const style = getComputedStyle(document.documentElement);
  const out = COLOUR_TOKENS.map((name) => style.getPropertyValue(name).trim()).filter(Boolean);
  return out.length > 0 ? out : ['white'];
}

function risingNumeral(label: string, at: Point): void {
  const el = document.createElement('span');
  el.className = 'numeral points-up text-orange text-[28px]';
  el.textContent = label;
  el.setAttribute('aria-hidden', 'true');
  el.style.left = `${Math.round(at.x)}px`;
  el.style.top = `${Math.round(at.y - 8)}px`;
  document.body.appendChild(el);
  const remove = () => el.remove();
  el.addEventListener('animationend', remove, { once: true });
  // Belt and braces: an animation that never fires (a hidden tab) must not leave the number.
  window.setTimeout(remove, CONFETTI_MS + 200);
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  angle: number;
  spin: number;
  colour: string;
}

/**
 * Sixty rectangles thrown upwards from the origin with a little spread, under gravity, turning
 * as they fall, fading over the last half of the burst. Velocities are per millisecond so the
 * burst looks the same at 60 and 120 frames a second.
 */
function confetti(at: Point): void {
  const canvas = document.createElement('canvas');
  canvas.className = 'club-confetti';
  canvas.setAttribute('aria-hidden', 'true');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(dpr, dpr);
  document.body.appendChild(canvas);

  const palette = colours();
  const particles: Particle[] = Array.from({ length: PARTICLES }, (_, i) => {
    const spread = (Math.random() - 0.5) * Math.PI * 0.9;
    const speed = 0.45 + Math.random() * 0.5; // px per ms
    return {
      x: at.x,
      y: at.y,
      vx: Math.sin(spread) * speed,
      vy: -Math.cos(spread) * speed - 0.25,
      w: 5 + Math.random() * 5,
      h: 3 + Math.random() * 4,
      angle: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.02,
      colour: palette[i % palette.length] ?? 'white',
    };
  });

  const gravity = 0.0016; // px per ms²
  let last = performance.now();
  const start = last;
  let raf = 0;

  const frame = (now: number) => {
    const dt = Math.min(now - last, 48);
    last = now;
    const t = now - start;
    if (t >= CONFETTI_MS) {
      canvas.remove();
      return;
    }
    const alpha = t < CONFETTI_MS * 0.5 ? 1 : 1 - (t - CONFETTI_MS * 0.5) / (CONFETTI_MS * 0.5);
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = Math.max(0, alpha);
    for (const p of particles) {
      p.vy += gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.angle += p.spin * dt;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.colour;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    raf = window.requestAnimationFrame(frame);
  };
  raf = window.requestAnimationFrame(frame);
  // A tab hidden mid-burst never gets another frame; the canvas must not outlive the moment.
  window.setTimeout(() => {
    window.cancelAnimationFrame(raf);
    canvas.remove();
  }, CONFETTI_MS + 200);
}
