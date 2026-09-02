/**
 * Pose-set contract for the Forma figure rig.
 *
 * A pose is a flat record of joint angles (degrees) plus the root (hip) position in the 200×200
 * viewBox. A pose set is a looping list of keyframes over one repetition of an exercise.
 * See src/components/anim/README.md for the joint conventions and the authoring workflow.
 */

/** `side`: profile facing right (+x). `front`: facing the viewer, limbs move in the frontal plane. */
export type View = 'side' | 'front';

/** Easing applied to the transition that *arrives* at a keyframe. Default `inOut`. */
export type Ease = 'linear' | 'in' | 'out' | 'inOut';

/**
 * Joint angles in degrees + root position. All angles are relative to the parent segment:
 *
 * - `rootX`, `rootY` — hip joint in viewBox units (standing: 100, 106).
 * - `torso` — from vertical; side: positive leans forward (+x); front: positive leans to +x.
 * - `head` — relative to the torso; side: positive tilts the chin down; front: lateral tilt to +x.
 * - `shoulderL/R` — upper arm relative to the torso, 0 = hanging along the torso.
 *   side: positive = flexion (swings forward, 90 = horizontal, 180 = overhead).
 *   front: positive = abduction (out to the side, 90 = horizontal, 180 = overhead).
 * - `elbowL/R` — flexion, 0 = straight, positive bends the forearm toward the shoulder.
 * - `hipL/R` — thigh relative to the torso, 0 = hanging along the torso.
 *   side: positive = flexion (knee travels forward/up). front: positive = abduction (out).
 * - `kneeL/R` — flexion, 0 = straight, positive bends the heel toward the glutes (side) or the
 *   foot toward the midline (front).
 * - `ankleL/R` — foot relative to the shin, 0 = right angle (flat on the ground when the shin is
 *   vertical); positive = dorsiflexion (toes up), negative = plantarflexion (toes down).
 *
 * Side view: `R` limbs are the near side (drawn on top), `L` limbs are the far side (lighter).
 * Front view: `L` limbs are on the screen left, `R` limbs on the screen right (mirror view).
 */
export interface Pose {
  rootX: number;
  rootY: number;
  torso: number;
  head: number;
  shoulderL: number;
  elbowL: number;
  shoulderR: number;
  elbowR: number;
  hipL: number;
  kneeL: number;
  ankleL: number;
  hipR: number;
  kneeR: number;
  ankleR: number;
}

export type PoseKey = keyof Pose;

export interface Keyframe {
  /** Phase within the repetition, 0..1, strictly increasing across the set. */
  t: number;
  /** Joints not listed inherit from the previous keyframe (the first spreads `basePose(view)`). */
  pose: Partial<Pose>;
  /** Easing of the transition from the previous keyframe into this one. Default `inOut`. */
  ease?: Ease;
}

/**
 * Props are drawn at anchor points computed from the pose (wrists, ankles, head) or at fixed
 * positions relative to the ground line.
 */
export type Prop =
  /** Thin ground line under the feet. */
  | { kind: 'floor' }
  /** Short bars across each wrist (perpendicular to the forearm). */
  | { kind: 'dumbbells' }
  /**
   * Bell held with both hands (anchored at the midpoint of the wrists).
   * `inline` (default): continues the forearm line — swings, deadlifts.
   * `hang`: hangs straight down from the hands — goblet holds, carries.
   */
  | { kind: 'kettlebell'; grip?: 'inline' | 'hang' }
  /**
   * Resistance band. `wrists` (default): stretched between the hands (pull-aparts).
   * `feet`: under the feet up to both hands (banded rows/squats).
   * `front` / `back`: from the hands to an anchor at the right / left edge (rows, presses).
   */
  | { kind: 'band'; anchor?: 'wrists' | 'feet' | 'front' | 'back' }
  /** Jump rope: an arc between the hands that sweeps under the feet at t≈0 and over the head at t≈0.5. */
  | { kind: 'rope' }
  /** Horizontal pull-up bar at the height of the (higher) wrist. */
  | { kind: 'bar' }
  /** Chair silhouette; `x` is the seat centre (default 60: behind a side-view athlete). */
  | { kind: 'chair'; x?: number }
  /** Plyo box: a rounded rectangle standing on the ground. Defaults: height 40, width 44, x 130. */
  | { kind: 'box'; height?: number; width?: number; x?: number };

export interface PoseSet {
  /** Matches `Exercise.animation` and the file name in `poses/`. */
  id: string;
  view: View;
  /** Frame rate cap for the component loop (default 30). */
  fps?: number;
  /** `cycle` restarts at 0 after 1; `pingpong` plays 0→1→0. */
  loop: 'cycle' | 'pingpong';
  /** Milliseconds for one pass 0→1. */
  durationMs: number;
  keyframes: Keyframe[];
  props?: Prop[];
  /**
   * Which point is interpolated between keyframes. `root` (default) interpolates the hip;
   * `ankleL` / `ankleR` interpolates that ankle in world space and derives the hip from it, so a
   * planted foot never sinks into or floats above the ground mid-motion (squats, lunges, hinges).
   */
  pivot?: 'root' | 'ankleL' | 'ankleR';
  /** Phase 0..1 of the still frame shown under prefers-reduced-motion (default 0.5). */
  poster?: number;
}
