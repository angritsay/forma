/**
 * Static SVG rendering of the figure — standalone strings for build scripts (OG images),
 * previews and tests. No DOM, no React.
 */
import { tileInk } from '../../lib/ui/tile';
import { getPoseSet } from './lookup';
import {
  DEFAULT_TILE,
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

/**
 * Stroke attributes shared by every primitive: square ends and sharp corners, never a fill. The
 * colour is `currentColor`, so the embedding context (a tile, a page, an OG card) decides the ink.
 */
const STROKE_ATTRS =
  'stroke="currentColor" fill="none" stroke-linecap="butt" stroke-linejoin="miter"';

/** One primitive → SVG element markup. */
export function primitiveToSvg(p: Primitive): string {
  const op = p.opacity < 1 ? ` opacity="${n(p.opacity)}"` : '';
  const sw = `stroke-width="${n(p.width)}"`;
  switch (p.kind) {
    case 'line':
      return `<line x1="${n(p.x1)}" y1="${n(p.y1)}" x2="${n(p.x2)}" y2="${n(p.y2)}" ${STROKE_ATTRS} ${sw}${op}/>`;
    case 'path':
      return `<path d="${p.d}" ${STROKE_ATTRS} ${sw}${op}/>`;
    case 'rect':
      return `<rect x="${n(p.x)}" y="${n(p.y)}" width="${n(p.w)}" height="${n(p.h)}" ${STROKE_ATTRS} ${sw}${op}/>`;
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
  /**
   * Flat course tile colour; defaults to the neutral dark surface. It also decides the ink —
   * black on a programme colour, light on a dark surface — so pass it even with `background`
   * off when the figure is going to sit on a known tile.
   */
  tile?: string;
  /** Draw the square tile behind the figure (default true). */
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
  // One flat, sharp-cornered fill: the brand has one shape and it has no radius.
  const defs = background
    ? `<rect width="${VIEWBOX}" height="${VIEWBOX}" fill="${escapeAttr(tile)}"/>`
    : '';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${n(size)}" height="${n(size)}" viewBox="0 0 ${VIEWBOX} ${VIEWBOX}" color="${escapeAttr(tileInk(tile))}">` +
    defs +
    `<g>${body}</g>` +
    `</svg>`
  );
}
