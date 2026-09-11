/**
 * Forma figure rig — a 2-D blueprint stick figure drawn in SVG and driven by joint angles.
 *
 * Coordinate system: 200×200 viewBox, y grows downward, ground line at y = GROUND_Y.
 * Segment directions are expressed as an angle from the *downward* vertical, positive toward +x
 * (0 = down, 90 = right/forward, 180 = up, -90 = left/back). See poses/types.ts for the joint
 * conventions and README.md for the authoring guide.
 *
 * Drawing style (brandbook §6, "фирменная графика"): one mono line with square ends, no fills,
 * the head an outlined square. Everything is stroked in `currentColor`, so the same geometry is
 * black on a programme colour or on paper and light on a dark surface — the renderer decides.
 *
 * Pure module: no DOM, no React. Used by the component (client), the static renderer (build
 * scripts) and the tests.
 */
import type { Ease, Keyframe, Pose, PoseKey, PoseSet, Prop, View } from './poses/types';

export const VIEWBOX = 200;
/** y of the sole of the feet in the standing pose. */
export const GROUND_Y = 172;

/** Segment lengths in viewBox units. */
export const LENGTHS = {
  torso: 44,
  neck: 8,
  /** Half the side of the head square (the head centre sits this far past the neck). */
  head: 11,
  upperArm: 26,
  forearm: 24,
  thigh: 34,
  shin: 32,
  foot: 12,
  /** Foreshortened foot in the front view. */
  footFront: 8,
} as const;

/**
 * Stroke widths. The brand figures (assets/figures/*.svg) are a 5-unit line on a figure about
 * 98 units tall with a 16-unit head, in a 120 box. Our standing athlete is 140 units tall (head
 * top 32 → ground 172), a ×1.43 scale: 5 → 7.1 line, 16 → 22.9 head. Rounded to 7 and 22 so the
 * head stays exactly the 22 the kinematics already place it at (LENGTHS.head × 2).
 *
 * `line` is the one weight for the figure and for solid equipment (dumbbells, bell, bar, box,
 * chair); `thin` is for construction lines that are not objects — the floor, a band, the rope.
 */
export const STROKE = {
  line: 7,
  thin: 3,
} as const;

/** Side of the head square, in viewBox units (16 in the 120-unit brand figures). */
export const HEAD_SIZE = LENGTHS.head * 2;

/**
 * Opacity of far-side limbs in the side view. The brand figures are flat, but a profile with two
 * arms and two legs at full ink turns into one line at every crossing; a lighter far side is the
 * only depth cue that keeps a squat readable without adding a second weight or a fill.
 */
export const FAR_OPACITY = 0.55;
/** The default course tile (--tile-4 in global.css), used when no course colour is supplied. */
export const DEFAULT_TILE = '#1f1f24';

const SHOULDER_HALF: Record<View, number> = { side: 0, front: 13 };
const HIP_HALF: Record<View, number> = { side: 0, front: 6 };

export interface Point {
  x: number;
  y: number;
}

const rad = (deg: number): number => (deg * Math.PI) / 180;
/** Unit vector for an angle from the downward vertical, positive toward +x. */
const dirDown = (deg: number): Point => ({ x: Math.sin(rad(deg)), y: Math.cos(rad(deg)) });
/** Unit vector for an angle from the upward vertical, positive toward +x. */
const dirUp = (deg: number): Point => ({ x: Math.sin(rad(deg)), y: -Math.cos(rad(deg)) });
const along = (p: Point, d: Point, len: number): Point => ({
  x: p.x + d.x * len,
  y: p.y + d.y * len,
});

export const POSE_KEYS: readonly PoseKey[] = [
  'rootX',
  'rootY',
  'torso',
  'head',
  'shoulderL',
  'elbowL',
  'shoulderR',
  'elbowR',
  'hipL',
  'kneeL',
  'ankleL',
  'hipR',
  'kneeR',
  'ankleR',
];

/* ------------------------------------------------------------------------------------------ */
/* Forward kinematics                                                                          */
/* ------------------------------------------------------------------------------------------ */

export interface Joints {
  hip: Point;
  hipL: Point;
  hipR: Point;
  shoulder: Point;
  shoulderL: Point;
  shoulderR: Point;
  /** Head centre. */
  head: Point;
  elbowL: Point;
  wristL: Point;
  elbowR: Point;
  wristR: Point;
  kneeL: Point;
  ankleL: Point;
  toeL: Point;
  kneeR: Point;
  ankleR: Point;
  toeR: Point;
}

/** Absolute (world) segment angles, handy for props that follow a limb. */
export interface Angles {
  upperArmL: number;
  forearmL: number;
  upperArmR: number;
  forearmR: number;
  thighL: number;
  shinL: number;
  footL: number;
  thighR: number;
  shinR: number;
  footR: number;
}

export interface Solved {
  joints: Joints;
  angles: Angles;
}

/** Compute every joint position for a pose. */
export function solve(pose: Pose, view: View): Solved {
  const hip: Point = { x: pose.rootX, y: pose.rootY };
  const up = dirUp(pose.torso);
  // Perpendicular to the torso, pointing to +x when upright.
  const right: Point = { x: -up.y, y: up.x };
  const shoulder = along(hip, up, LENGTHS.torso);
  const head = along(shoulder, dirUp(pose.torso + pose.head), LENGTHS.neck + LENGTHS.head);
  const sh = SHOULDER_HALF[view];
  const hh = HIP_HALF[view];
  const shoulderL = along(shoulder, right, -sh);
  const shoulderR = along(shoulder, right, sh);
  const hipL = along(hip, right, -hh);
  const hipR = along(hip, right, hh);

  // Front view mirrors the left side: abduction/flexion rotate away from the midline.
  const signL = view === 'front' ? -1 : 1;
  const signR = 1;

  const arm = (origin: Point, shoulderDeg: number, elbowDeg: number, sign: number) => {
    const upperArm = -pose.torso + sign * shoulderDeg;
    const forearm = upperArm + sign * elbowDeg;
    const elbow = along(origin, dirDown(upperArm), LENGTHS.upperArm);
    const wrist = along(elbow, dirDown(forearm), LENGTHS.forearm);
    return { upperArm, forearm, elbow, wrist };
  };
  const leg = (origin: Point, hipDeg: number, kneeDeg: number, ankleDeg: number, sign: number) => {
    const thigh = -pose.torso + sign * hipDeg;
    const shin = thigh - sign * kneeDeg;
    const foot = shin + sign * (90 + ankleDeg);
    const knee = along(origin, dirDown(thigh), LENGTHS.thigh);
    const ankle = along(knee, dirDown(shin), LENGTHS.shin);
    const toe = along(ankle, dirDown(foot), view === 'front' ? LENGTHS.footFront : LENGTHS.foot);
    return { thigh, shin, foot, knee, ankle, toe };
  };

  const armL = arm(shoulderL, pose.shoulderL, pose.elbowL, signL);
  const armR = arm(shoulderR, pose.shoulderR, pose.elbowR, signR);
  const legL = leg(hipL, pose.hipL, pose.kneeL, pose.ankleL, signL);
  const legR = leg(hipR, pose.hipR, pose.kneeR, pose.ankleR, signR);

  return {
    joints: {
      hip,
      hipL,
      hipR,
      shoulder,
      shoulderL,
      shoulderR,
      head,
      elbowL: armL.elbow,
      wristL: armL.wrist,
      elbowR: armR.elbow,
      wristR: armR.wrist,
      kneeL: legL.knee,
      ankleL: legL.ankle,
      toeL: legL.toe,
      kneeR: legR.knee,
      ankleR: legR.ankle,
      toeR: legR.toe,
    },
    angles: {
      upperArmL: armL.upperArm,
      forearmL: armL.forearm,
      upperArmR: armR.upperArm,
      forearmR: armR.forearm,
      thighL: legL.thigh,
      shinL: legL.shin,
      footL: legL.foot,
      thighR: legR.thigh,
      shinR: legR.shin,
      footR: legR.foot,
    },
  };
}

/** Relaxed standing pose for a view, feet on the ground line, hips at x = 100. */
export function basePose(view: View): Pose {
  const side: Pose = {
    rootX: 100,
    rootY: GROUND_Y - LENGTHS.thigh - LENGTHS.shin,
    torso: 0,
    head: 0,
    // Athletic stance: hands slightly in front of the hips so the arm reads apart from the torso.
    shoulderL: 10,
    elbowL: 18,
    shoulderR: 10,
    elbowR: 18,
    hipL: 0,
    kneeL: 0,
    ankleL: 0,
    hipR: 0,
    kneeR: 0,
    ankleR: 0,
  };
  switch (view) {
    case 'side':
      return side;
    case 'front':
      return plant(
        { ...side, shoulderL: 6, elbowL: 10, shoulderR: 6, elbowR: 10, hipL: 8, hipR: 8 },
        'front',
        { leg: 'R', y: GROUND_Y },
      );
  }
}

/**
 * Authoring helper: shift the root so that an ankle sits at a given point.
 * `leg` defaults to the lowest ankle; `x` defaults to the ankle's current x; `y` to the ground.
 */
export function plant(
  pose: Pose,
  view: View,
  opts: { leg?: 'L' | 'R'; x?: number; y?: number } = {},
): Pose {
  const { joints } = solve(pose, view);
  const leg = opts.leg ?? (joints.ankleL.y > joints.ankleR.y ? 'L' : 'R');
  const ankle = leg === 'L' ? joints.ankleL : joints.ankleR;
  const targetX = opts.x ?? ankle.x;
  const targetY = opts.y ?? GROUND_Y;
  return {
    ...pose,
    rootX: pose.rootX + (targetX - ankle.x),
    rootY: pose.rootY + (targetY - ankle.y),
  };
}

/* ------------------------------------------------------------------------------------------ */
/* Keyframes, easing, interpolation                                                            */
/* ------------------------------------------------------------------------------------------ */

export function ease(kind: Ease, s: number): number {
  const x = s < 0 ? 0 : s > 1 ? 1 : s;
  switch (kind) {
    case 'linear':
      return x;
    case 'in':
      return x * x;
    case 'out':
      return 1 - (1 - x) * (1 - x);
    case 'inOut':
      return x < 0.5 ? 2 * x * x : 1 - ((-2 * x + 2) * (-2 * x + 2)) / 2;
  }
}

export interface ResolvedKeyframe {
  t: number;
  pose: Pose;
  ease: Ease;
  /** World position of the pivot ankle (when the set uses an ankle pivot). */
  pivot: Point | null;
}

const resolvedCache = new WeakMap<PoseSet, ResolvedKeyframe[]>();

/** Spread missing joints from the previous keyframe (the first from `basePose`). */
export function resolveKeyframes(set: PoseSet): ResolvedKeyframe[] {
  const cached = resolvedCache.get(set);
  if (cached) return cached;
  const out: ResolvedKeyframe[] = [];
  let prev: Pose = basePose(set.view);
  for (const kf of set.keyframes) {
    const pose: Pose = { ...prev, ...kf.pose };
    out.push({
      t: kf.t,
      pose,
      ease: kf.ease ?? 'inOut',
      pivot: pivotPoint(set, pose),
    });
    prev = pose;
  }
  if (out.length === 0) {
    out.push({ t: 0, pose: prev, ease: 'inOut', pivot: pivotPoint(set, prev) });
  }
  resolvedCache.set(set, out);
  return out;
}

function pivotPoint(set: PoseSet, pose: Pose): Point | null {
  const pivot = set.pivot ?? 'root';
  if (pivot === 'root') return null;
  const { joints } = solve(pose, set.view);
  return pivot === 'ankleL' ? joints.ankleL : joints.ankleR;
}

/** Map an unbounded cycle count to a phase 0..1 according to the loop mode. */
export function loopPhase(loop: PoseSet['loop'], u: number): number {
  if (!Number.isFinite(u)) return 0;
  switch (loop) {
    case 'cycle': {
      const p = u - Math.floor(u);
      return p;
    }
    case 'pingpong': {
      const p = u - 2 * Math.floor(u / 2);
      return p <= 1 ? p : 2 - p;
    }
  }
}

export function lerpPose(a: Pose, b: Pose, s: number): Pose {
  const out = { ...a };
  for (const k of POSE_KEYS) out[k] = a[k] + (b[k] - a[k]) * s;
  return out;
}

/**
 * Full pose at cycle position `u` (0..1 is one pass; values outside wrap per `loop`).
 * Between keyframes each joint is eased independently; in `cycle` mode the last keyframe
 * blends back into the first at t = 1.
 */
export function poseAt(set: PoseSet, u: number): Pose {
  const kfs = resolveKeyframes(set);
  const first = kfs[0]!;
  if (kfs.length === 1) return first.pose;
  const t = loopPhase(set.loop, u);
  const last = kfs[kfs.length - 1]!;

  let a: ResolvedKeyframe;
  let b: ResolvedKeyframe;
  let ta: number;
  let tb: number;
  let e: Ease;
  if (t < first.t) {
    return first.pose;
  } else if (t >= last.t) {
    if (set.loop === 'pingpong' || last.t >= 1) return last.pose;
    a = last;
    b = first;
    ta = last.t;
    tb = 1;
    e = first.ease;
  } else {
    let i = 0;
    while (i + 1 < kfs.length && kfs[i + 1]!.t <= t) i++;
    a = kfs[i]!;
    b = kfs[i + 1]!;
    ta = a.t;
    tb = b.t;
    e = b.ease;
  }
  const span = tb - ta;
  const s = span > 0 ? ease(e, (t - ta) / span) : 1;
  const pose = lerpPose(a.pose, b.pose, s);
  if (a.pivot && b.pivot) {
    // Keep the planted foot on its interpolated world position instead of the hip.
    const target: Point = {
      x: a.pivot.x + (b.pivot.x - a.pivot.x) * s,
      y: a.pivot.y + (b.pivot.y - a.pivot.y) * s,
    };
    const { joints } = solve({ ...pose, rootX: 0, rootY: 0 }, set.view);
    const offset = set.pivot === 'ankleL' ? joints.ankleL : joints.ankleR;
    pose.rootX = target.x - offset.x;
    pose.rootY = target.y - offset.y;
  }
  return pose;
}

/** Authoring lint: returns human-readable problems (empty when the set is well-formed). */
export function validatePoseSet(set: PoseSet): string[] {
  const issues: string[] = [];
  const id = set.id || '<no id>';
  if (!/^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(set.id)) issues.push(`${id}: id must be snake_case`);
  if (set.view !== 'side' && set.view !== 'front') issues.push(`${id}: view must be side|front`);
  if (!(set.durationMs > 0)) issues.push(`${id}: durationMs must be > 0`);
  if (set.fps !== undefined && !(set.fps > 0 && set.fps <= 120))
    issues.push(`${id}: fps must be within 1..120`);
  if (set.poster !== undefined && (set.poster < 0 || set.poster > 1))
    issues.push(`${id}: poster must be within 0..1`);
  if (set.keyframes.length === 0) issues.push(`${id}: at least one keyframe is required`);
  const first = set.keyframes[0];
  if (first) {
    if (first.t !== 0) issues.push(`${id}: first keyframe must be at t = 0`);
    const missing = POSE_KEYS.filter((k) => first.pose[k] === undefined);
    if (missing.length)
      issues.push(`${id}: first keyframe is incomplete (missing ${missing.join(', ')})`);
  }
  set.keyframes.forEach((kf, i) => {
    if (kf.t < 0 || kf.t > 1) issues.push(`${id}: keyframe ${i} t=${kf.t} outside 0..1`);
    const prev = set.keyframes[i - 1];
    if (prev && kf.t <= prev.t)
      issues.push(`${id}: keyframe ${i} t must increase (${prev.t} → ${kf.t})`);
    for (const [k, v] of Object.entries(kf.pose)) {
      if (!(POSE_KEYS as readonly string[]).includes(k))
        issues.push(`${id}: keyframe ${i} has unknown joint "${k}"`);
      if (typeof v !== 'number' || !Number.isFinite(v))
        issues.push(`${id}: keyframe ${i} joint "${k}" must be a finite number`);
    }
  });
  if (set.loop === 'cycle' && set.keyframes.length > 1) {
    const kfs = resolveKeyframes(set);
    const a = kfs[0]!.pose;
    const b = kfs[kfs.length - 1]!.pose;
    const jump = POSE_KEYS.filter((k) => Math.abs(a[k] - b[k]) > 60 && !k.startsWith('root'));
    if (jump.length && kfs[kfs.length - 1]!.t >= 1)
      issues.push(`${id}: cycle jumps at the wrap (${jump.join(', ')}) — end where you start`);
  }
  return issues;
}

/* ------------------------------------------------------------------------------------------ */
/* Geometry → drawing primitives                                                               */
/* ------------------------------------------------------------------------------------------ */

export type Part =
  | 'torso'
  | 'neck'
  /** Front view only: the bar between the shoulders / between the hips. */
  | 'shoulders'
  | 'hips'
  | 'upperArmL'
  | 'forearmL'
  | 'upperArmR'
  | 'forearmR'
  | 'thighL'
  | 'shinL'
  | 'footL'
  | 'thighR'
  | 'shinR'
  | 'footR';

export interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** 0 = near (full ink), 1 = far (lighter, drawn behind). */
  depth: 0 | 1;
  part: Part;
  width: number;
}

export interface FigureGeometry {
  segments: Segment[];
  /** Axis-aligned head square: centre and side. Outline only, never filled. */
  head: { cx: number; cy: number; size: number };
  joints: Joints;
  angles: Angles;
}

/**
 * Where the neck line meets the head square. The square is axis-aligned whatever the head tilt
 * (the brand plank has a level square on a sloping body), so the neck runs from the shoulder
 * toward the head centre and stops on the square's edge instead of poking into the outline.
 */
function neckEnd(shoulder: Point, head: Point): Point {
  const dx = shoulder.x - head.x;
  const dy = shoulder.y - head.y;
  const reach = Math.max(Math.abs(dx), Math.abs(dy));
  if (reach === 0) return head;
  const k = LENGTHS.head / reach;
  return { x: head.x + dx * k, y: head.y + dy * k };
}

/** Line segments, head square and anchor points for a pose. */
export function figurePath(pose: Pose, view: View): FigureGeometry {
  const { joints: j, angles } = solve(pose, view);
  const seg = (a: Point, b: Point, part: Part, depth: 0 | 1): Segment => ({
    x1: a.x,
    y1: a.y,
    x2: b.x,
    y2: b.y,
    depth,
    part,
    width: STROKE.line,
  });
  const farL: 0 | 1 = view === 'side' ? 1 : 0;
  const segments: Segment[] = [
    seg(j.shoulderL, j.elbowL, 'upperArmL', farL),
    seg(j.elbowL, j.wristL, 'forearmL', farL),
    seg(j.hipL, j.kneeL, 'thighL', farL),
    seg(j.kneeL, j.ankleL, 'shinL', farL),
    seg(j.ankleL, j.toeL, 'footL', farL),
    seg(j.shoulderR, j.elbowR, 'upperArmR', 0),
    seg(j.elbowR, j.wristR, 'forearmR', 0),
    seg(j.hipR, j.kneeR, 'thighR', 0),
    seg(j.kneeR, j.ankleR, 'shinR', 0),
    seg(j.ankleR, j.toeR, 'footR', 0),
    seg(j.hip, j.shoulder, 'torso', 0),
    seg(j.shoulder, neckEnd(j.shoulder, j.head), 'neck', 0),
  ];
  if (view === 'front') {
    // A spine with a shoulder bar and a hip bar: the limbs still hang from the same joints the
    // solver puts them at, and the torso stays one line weight like everything else.
    segments.push(seg(j.shoulderL, j.shoulderR, 'shoulders', 0));
    segments.push(seg(j.hipL, j.hipR, 'hips', 0));
  }
  return {
    segments,
    head: { cx: j.head.x, cy: j.head.y, size: HEAD_SIZE },
    joints: j,
    angles,
  };
}

/**
 * Renderer-agnostic drawing primitives in draw order. Everything is a stroke in the renderer's
 * `currentColor` — there is no fill and no circle in the vocabulary, which is what keeps every
 * frame inside the blueprint style by construction.
 */
export type Primitive =
  | { kind: 'line'; x1: number; y1: number; x2: number; y2: number; width: number; opacity: number }
  | { kind: 'path'; d: string; width: number; opacity: number }
  | { kind: 'rect'; x: number; y: number; w: number; h: number; width: number; opacity: number };

const n = (v: number): string => (Math.round(v * 100) / 100).toString();
/** Closed or open polyline through `pts` as path data. */
const poly = (pts: readonly Point[], close: boolean): string =>
  pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${n(p.x)} ${n(p.y)}`).join(' ') + (close ? ' Z' : '');

/**
 * Build the full scene (props + figure) for a pose. `t` is the phase 0..1, used by props that
 * depend on the animation phase (jump rope).
 */
export function figureScene(
  pose: Pose,
  view: View,
  opts: { props?: readonly Prop[]; t?: number } = {},
): Primitive[] {
  const geo = figurePath(pose, view);
  const t = opts.t ?? 0;
  const props = opts.props ?? [];
  const behind: Primitive[] = [];
  const front: Primitive[] = [];

  // The sole of a foot is the lower edge of its 7-unit line; objects on the floor stand on that.
  const floorY = GROUND_Y + STROKE.line / 2;

  for (const prop of props) {
    switch (prop.kind) {
      case 'floor':
        behind.push(line({ x: 24, y: floorY }, { x: 176, y: floorY }, STROKE.thin, 0.35));
        break;
      case 'bar': {
        const y = Math.min(geo.joints.wristL.y, geo.joints.wristR.y);
        behind.push(line({ x: 36, y }, { x: 164, y }, STROKE.line, 0.9));
        break;
      }
      case 'rope': {
        const { wristL, wristR } = geo.joints;
        const cx = (wristL.x + wristR.x) / 2;
        const cy = (wristL.y + wristR.y) / 2;
        const sweep = Math.cos(2 * Math.PI * t);
        const ctrlY = cy + 20 + 128 * sweep;
        const spread = view === 'front' ? 58 : 46;
        const d = `M${n(wristL.x)} ${n(wristL.y)} C${n(cx - spread)} ${n(ctrlY)} ${n(cx + spread)} ${n(ctrlY)} ${n(wristR.x)} ${n(wristR.y)}`;
        behind.push({ kind: 'path', d, width: STROKE.thin, opacity: 0.85 });
        break;
      }
      case 'chair': {
        // Seat, back and two legs — four lines of the one weight, like a furniture drawing.
        const x = prop.x ?? 60;
        const seatY = GROUND_Y - 44;
        const w = STROKE.line;
        behind.push(
          line({ x: x - 20, y: seatY }, { x: x + 20, y: seatY }, w, 0.55),
          line({ x: x - 20 + w / 2, y: seatY - 42 }, { x: x - 20 + w / 2, y: seatY }, w, 0.55),
          line({ x: x - 16, y: seatY }, { x: x - 16, y: floorY }, w, 0.55),
          line({ x: x + 16, y: seatY }, { x: x + 16, y: floorY }, w, 0.55),
        );
        break;
      }
      case 'box': {
        // One outlined rectangle standing on the floor line; the outline is centred on the edge,
        // so the box is inset by half a stroke to keep its outer face on the stated width.
        const h = prop.height ?? 40;
        const w = prop.width ?? 44;
        const x = prop.x ?? 130;
        const inset = STROKE.line / 2;
        behind.push({
          kind: 'rect',
          x: x - w / 2 + inset,
          y: floorY - h + inset,
          w: Math.max(w - STROKE.line, 0),
          h: Math.max(h - STROKE.line, 0),
          width: STROKE.line,
          opacity: 0.7,
        });
        break;
      }
      case 'band': {
        const { wristL, wristR, ankleL, ankleR } = geo.joints;
        const anchor = prop.anchor ?? 'wrists';
        const w = STROKE.thin;
        switch (anchor) {
          case 'wrists':
            front.push(line(wristL, wristR, w, 0.8));
            break;
          case 'feet': {
            const foot: Point = {
              x: (ankleL.x + ankleR.x) / 2 + (view === 'side' ? LENGTHS.foot / 2 : 0),
              y: Math.max(ankleL.y, ankleR.y) + STROKE.line / 2,
            };
            front.push(line(foot, wristL, w, 0.8), line(foot, wristR, w, 0.8));
            break;
          }
          case 'front':
          case 'back': {
            const ax = anchor === 'front' ? 190 : 10;
            const ay = (wristL.y + wristR.y) / 2;
            front.push(
              line({ x: ax, y: ay }, wristL, w, 0.8),
              line({ x: ax, y: ay }, wristR, w, 0.8),
            );
            break;
          }
        }
        break;
      }
      case 'dumbbells': {
        // A bar across the wrist with a short plate line at each end: |—| in the one weight.
        const sides: Array<['L' | 'R', Point, number]> = [
          ['L', geo.joints.wristL, geo.angles.forearmL],
          ['R', geo.joints.wristR, geo.angles.forearmR],
        ];
        for (const [side, wrist, forearm] of sides) {
          const opacity = view === 'side' && side === 'L' ? FAR_OPACITY : 1;
          const axis = dirDown(forearm);
          const perp = dirDown(forearm + 90);
          const a = along(wrist, perp, -9);
          const b = along(wrist, perp, 9);
          const target = view === 'side' && side === 'L' ? behind : front;
          const w = STROKE.line;
          target.push(
            line(a, b, w, opacity),
            line(along(a, axis, -6), along(a, axis, 6), w, opacity),
            line(along(b, axis, -6), along(b, axis, 6), w, opacity),
          );
        }
        break;
      }
      case 'kettlebell': {
        // Handle = an open Π under the hands, body = an outlined square hanging from it. Both are
        // built as paths so the bell can follow the forearm in a swing; a <rect> cannot rotate.
        const { wristL, wristR } = geo.joints;
        const hands: Point = { x: (wristL.x + wristR.x) / 2, y: (wristL.y + wristR.y) / 2 };
        const dir = prop.grip === 'hang' ? dirDown(0) : dirDown(geo.angles.forearmR);
        const perp: Point = { x: -dir.y, y: dir.x };
        const handleH = 9;
        const handleHalf = 7;
        const bodyHalf = 10;
        const handleTop = hands;
        const bodyTop = along(hands, dir, handleH);
        const bodyBottom = along(bodyTop, dir, bodyHalf * 2);
        const handle: Point[] = [
          along(bodyTop, perp, -handleHalf),
          along(handleTop, perp, -handleHalf),
          along(handleTop, perp, handleHalf),
          along(bodyTop, perp, handleHalf),
        ];
        const body: Point[] = [
          along(bodyTop, perp, -bodyHalf),
          along(bodyTop, perp, bodyHalf),
          along(bodyBottom, perp, bodyHalf),
          along(bodyBottom, perp, -bodyHalf),
        ];
        front.push(
          { kind: 'path', d: poly(handle, false), width: STROKE.line, opacity: 1 },
          { kind: 'path', d: poly(body, true), width: STROKE.line, opacity: 1 },
        );
        break;
      }
    }
  }

  const figure: Primitive[] = [];
  const byPart = new Map(geo.segments.map((s) => [s.part, s]));
  /**
   * One limb = one polyline, as in the brand SVGs (`M … L … L …`): with square ends, separate
   * lines leave a notch on the outside of every bent joint, whereas a polyline mitres the corner.
   */
  const chain = (parts: readonly Part[]) => {
    const segs = parts.map((p) => byPart.get(p)).filter((s): s is Segment => s !== undefined);
    if (segs.length === 0) return;
    const pts: Point[] = [
      { x: segs[0]!.x1, y: segs[0]!.y1 },
      ...segs.map((s) => ({ x: s.x2, y: s.y2 })),
    ];
    const opacity = segs[0]!.depth === 1 ? FAR_OPACITY : 1;
    figure.push({ kind: 'path', d: poly(pts, false), width: STROKE.line, opacity });
  };
  const armL: Part[] = ['upperArmL', 'forearmL'];
  const armR: Part[] = ['upperArmR', 'forearmR'];
  const legL: Part[] = ['thighL', 'shinL', 'footL'];
  const legR: Part[] = ['thighR', 'shinR', 'footR'];
  // Far side first (side view), then the body, then legs before arms so hanging arms read in
  // front of the hips, then the near limbs.
  if (view === 'side') {
    chain(armL);
    chain(legL);
  }
  chain(['torso', 'neck']);
  chain(['shoulders']);
  chain(['hips']);
  if (view === 'front') chain(legL);
  chain(legR);
  if (view === 'front') chain(armL);
  chain(armR);
  // The head last, so its outline sits over whatever an overhead arm crosses.
  figure.push({
    kind: 'rect',
    x: geo.head.cx - geo.head.size / 2,
    y: geo.head.cy - geo.head.size / 2,
    w: geo.head.size,
    h: geo.head.size,
    width: STROKE.line,
    opacity: 1,
  });

  return [...behind, ...figure, ...front];
}

function line(a: Point, b: Point, width: number, opacity: number): Primitive {
  return { kind: 'line', x1: a.x, y1: a.y, x2: b.x, y2: b.y, width, opacity };
}

/** Axis-aligned bounds of a scene including stroke widths (for tight thumbnail viewBoxes). */
export function sceneBounds(prims: readonly Primitive[]): {
  x: number;
  y: number;
  w: number;
  h: number;
} {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const grow = (x: number, y: number, pad: number) => {
    minX = Math.min(minX, x - pad);
    minY = Math.min(minY, y - pad);
    maxX = Math.max(maxX, x + pad);
    maxY = Math.max(maxY, y + pad);
  };
  for (const p of prims) {
    switch (p.kind) {
      case 'line':
        grow(p.x1, p.y1, p.width / 2);
        grow(p.x2, p.y2, p.width / 2);
        break;
      case 'rect':
        grow(p.x, p.y, p.width / 2);
        grow(p.x + p.w, p.y + p.h, p.width / 2);
        break;
      case 'path': {
        const nums = p.d.match(/-?\d+(?:\.\d+)?/g) ?? [];
        for (let i = 0; i + 1 < nums.length; i += 2)
          grow(Number(nums[i]), Number(nums[i + 1]), p.width / 2);
        break;
      }
    }
  }
  if (!Number.isFinite(minX)) return { x: 0, y: 0, w: VIEWBOX, h: VIEWBOX };
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/** Square viewBox string that frames the scene with a margin (used by the thumb variant). */
export function tightViewBox(prims: readonly Primitive[], margin = 6): string {
  const b = sceneBounds(prims);
  const size = Math.max(b.w, b.h) + margin * 2;
  const x = b.x + b.w / 2 - size / 2;
  const y = b.y + b.h / 2 - size / 2;
  return `${n(x)} ${n(y)} ${n(size)} ${n(size)}`;
}

export type { Ease, Keyframe, Pose, PoseKey, PoseSet, Prop, View };
