/**
 * Turkish get-up — side view, pingpong (0 = lying, 1 = standing; the way down is the reverse).
 * Lying on the back (head to the left) with the weight locked out over the shoulder, near knee
 * bent with the foot flat, far leg long → roll up to the tall sit propped on the far hand → high
 * bridge: hips lift with the far leg long and the far hand still on the floor → sweep the far
 * leg back under to the half-kneeling lunge, trunk upright → stand up. The loaded arm stays
 * vertical throughout.
 *
 * Rig note: the kettlebell prop is anchored between both wrists, so a bell in one hand with the
 * other hand on the floor cannot be drawn; the get-up uses the dumbbell prop instead. The support
 * forearm is kept vertical wherever it touches the floor so its (far, lighter) dumbbell lies flat
 * under the hand. In the lying start both arms coincide, hiding the far dumbbell.
 *
 * Geometry (hip on the floor at y 167, near foot planted at x 126): tall sit torso −40° with the
 * support elbow bent 68°; bridge torso −50°, hip 22 above the floor, far leg straight to a heel
 * on the floor; the half-kneel copies the reverse-lunge bottom with the loaded arm overhead.
 */
import { GROUND_Y, basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

const FOOT_X = 126;

const lying: Pose = plant(
  {
    ...basePose('side'),
    torso: -90,
    head: 25,
    // Both arms vertical up (absolute 180 = shoulder 90 with the torso at −90).
    shoulderL: 90,
    shoulderR: 90,
    elbowL: 0,
    elbowR: 0,
    // Near leg: thigh 145° absolute (up-forward), shin 15° → foot flat at x 126.
    hipR: 55,
    kneeR: 129.6,
    ankleR: -15.4,
    // Far leg long on the floor, toes up.
    hipL: 0,
    kneeL: 0,
    ankleL: 0,
  },
  'side',
  { leg: 'R', x: FOOT_X, y: GROUND_Y },
);

// Tall sit: torso 50° above the floor, loaded arm vertical, support hand on the floor behind.
const sit: Pose = plant(
  {
    ...lying,
    torso: -40,
    head: 28,
    shoulderR: 140,
    shoulderL: -108.1,
    elbowL: 68.1,
    hipR: 105,
    hipL: 50,
  },
  'side',
  { leg: 'R', x: FOOT_X, y: GROUND_Y },
);

// High bridge: hips up, far leg long with the heel down, support arm nearly straight.
const bridge: Pose = plant(
  {
    ...lying,
    torso: -50,
    head: 35,
    shoulderR: 130,
    shoulderL: -76.3,
    elbowL: 26.3,
    hipR: 55.8,
    kneeR: 117.9,
    ankleR: 12.1,
    hipL: 25.1,
    kneeL: 0,
    ankleL: -15.1,
  },
  'side',
  { leg: 'R', x: FOOT_X, y: GROUND_Y },
);

// Half-kneeling lunge: front thigh horizontal over a vertical shin, rear knee at the floor.
const kneel: Pose = plant(
  {
    ...basePose('side'),
    torso: 4,
    head: -3,
    shoulderR: 184,
    elbowR: 0,
    shoulderL: 4,
    elbowL: 8,
    hipR: 94,
    kneeR: 90,
    ankleR: 0,
    hipL: -38.7,
    kneeL: 53.4,
    ankleL: 36.1,
  },
  'side',
  { leg: 'R', x: FOOT_X },
);

const stand: Pose = plant(
  { ...basePose('side'), shoulderR: 178, elbowR: 0, shoulderL: 6, elbowL: 10 },
  'side',
  { leg: 'R', x: 110 },
);

export const turkish_get_up: PoseSet = {
  id: 'turkish_get_up',
  view: 'side',
  loop: 'pingpong',
  durationMs: 4400,
  poster: 0.75,
  props: [{ kind: 'floor' }, { kind: 'dumbbells' }],
  keyframes: [
    { t: 0, pose: lying },
    { t: 0.25, pose: sit, ease: 'inOut' },
    { t: 0.5, pose: bridge, ease: 'inOut' },
    { t: 0.75, pose: kneel, ease: 'inOut' },
    { t: 1, pose: stand, ease: 'inOut' },
  ],
};
