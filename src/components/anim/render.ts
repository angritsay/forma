/**
 * Static SVG rendering of the figure — standalone strings for build scripts (OG images),
 * previews and tests. No DOM, no React.
 */
import { getPoseSet } from './lookup';
import {
  DEFAULT_TILE,
  INK,
  VIEWBOX,
  figureScene,
  poseAt,
  type Pose,
  type Primitive,
  type Prop,
  type View,
} from './rig';

const n = (v: number): string => (Math.round(v * 100) / 100).toString();

function escapeAttr(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/** One primitive → SVG element markup. Colour comes from `currentColor`. */
export function primitiveToSvg(p: Primitive): string {
  const op = p.opacity < 1 ? ` opacity="${n(p.opacity)}"` : '';
  switch (p.kind) {
    case 'line':
      return `<line x1="${n(p.x1)}" y1="${n(p.y1)}" x2="${n(p.x2)}" y2="${n(p.y2)}" stroke="currentColor" stroke-width="${n(p.width)}" stroke-linecap="round"${op}/>`;
    case 'circle':
      return p.fill
        ? `<circle cx="${n(p.cx)}" cy="${n(p.cy)}" r="${n(p.r)}" fill="currentColor"${op}/>`
        : `<circle cx="${n(p.cx)}" cy="${n(p.cy)}" r="${n(p.r)}" fill="none" stroke="currentColor" stroke-width="${n(p.width)}"${op}/>`;
    case 'path':
      return p.fill
        ? `<path d="${p.d}" fill="currentColor" stroke="currentColor" stroke-width="${n(p.width)}" stroke-linejoin="round"${op}/>`
        : `<path d="${p.d}" fill="none" stroke="currentColor" stroke-width="${n(p.width)}" stroke-linecap="round" stroke-linejoin="round"${op}/>`;
    case 'rect':
      return p.fill
        ? `<rect x="${n(p.x)}" y="${n(p.y)}" width="${n(p.w)}" height="${n(p.h)}" rx="${n(p.rx)}" fill="currentColor"${op}/>`
        : `<rect x="${n(p.x)}" y="${n(p.y)}" width="${n(p.w)}" height="${n(p.h)}" rx="${n(p.rx)}" fill="none" stroke="currentColor" stroke-width="${n(p.width)}"${op}/>`;
  }
}

/** Inner markup (no <svg> wrapper) for a pose, e.g. to embed in a larger SVG. */
export function figureMarkup(
  pose: Pose,
  view: View,
  opts: { props?: readonly Prop[]; t?: number } = {},
): string {
  return figureScene(pose, view, opts).map(primitiveToSvg).join('');
}

export interface FigureSvgOptions {
  /** Pixel size of the square image (default 200). */
  size?: number;
  /** Flat course tile colour; defaults to --tile-1. */
  tile?: string;
  /** Draw the rounded tile behind the figure (default true). */
  background?: boolean;
}

/**
 * Standalone SVG for an animation at phase `t` (cycle position; wraps per the set's loop).
 * Unknown ids render the standing pose (a warning is logged once).
 */
export function figureSvgString(
  animationId: string,
  t: number,
  opts: FigureSvgOptions = {},
): string {
  const set = getPoseSet(animationId);
  const size = opts.size ?? VIEWBOX;
  const tile = opts.tile ?? DEFAULT_TILE;
  const background = opts.background ?? true;
  const pose = poseAt(set, t);
  const body = figureMarkup(pose, set.view, { props: set.props, t: t - Math.floor(t) });
  // One flat fill, so no <defs>/<linearGradient> and no per-frame gradient id to keep unique.
  const defs = background
    ? `<rect width="${VIEWBOX}" height="${VIEWBOX}" rx="24" fill="${escapeAttr(tile)}"/>`
    : '';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${n(size)}" height="${n(size)}" viewBox="0 0 ${VIEWBOX} ${VIEWBOX}" color="${INK}">` +
    defs +
    `<g>${body}</g>` +
    `</svg>`
  );
}
