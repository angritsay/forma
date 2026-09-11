# Figure rig — animated SVG athlete

The brand illustration system: a 2-D **blueprint stick figure** — one 7-unit mono line with square
ends, an outlined square head, no fills — drawn in `currentColor` on a flat course tile. It is used
by the app player (hero background), course/exercise cards, exercise thumbnails, the landing hero
and the OG image generator. Pose data drives everything — there are no hand-drawn frames.

```
src/components/anim/
  rig.ts              forward kinematics, easing, poseAt(), figurePath(), figureScene(), plant()
  render.ts           figureSvgString() — standalone SVG for build scripts and previews
  lookup.ts           getPoseSet(id) with a warn-once standing fallback
  ExerciseFigure.tsx  React component (thumb / card / hero), SSR-safe, rAF loop
  poses/types.ts      Pose, Keyframe, Prop, PoseSet contract
  poses/index.ts      registry: POSES, ANIMATION_IDS  ← add one import + one entry per animation
  poses/<id>.ts       one pose set per exercise animation id
  rig.test.ts         kinematics/interpolation/registry tests (validates every registered set)
  preview.test.ts     PNG preview harness (runs only with ANIM_PREVIEW set)
scripts/anim/preview.mjs   wrapper: node scripts/anim/preview.mjs air_squat burpee
```

## Drawing style (brandbook §6)

The second brandbook makes the interface strictly black and white, with the programme colour of
the current course as the only colour on screen. The figures follow the reference drafts in the
design system (`assets/figures/*.svg`, "фигурки-палочки в стиле чертежа"):

- **One line weight.** Limbs, torso, neck and solid equipment are all `STROKE.line = 7` viewBox
  units — the reference's 5-unit line on a 120-unit drawing, scaled to our 140-unit-tall athlete.
  Construction lines that are not objects (floor, band, rope) use `STROKE.thin = 3`.
- **Square ends, sharp corners.** `stroke-linecap: butt`, `stroke-linejoin: miter`. Each limb is
  one polyline (`M shoulder L elbow L wrist`) so bent joints mitre instead of leaving a notch.
- **The head is a 22×22 outlined square** (`HEAD_SIZE`), axis-aligned whatever the body does
  — the reference plank keeps a level square on a sloping body. The neck runs from the shoulder
  and stops on the square's edge.
- **Nothing is filled and there is no circle.** The `Primitive` vocabulary is `line | path | rect`,
  all stroked, so a frame cannot leave the style by accident. The front-view torso is a spine with
  a shoulder bar and a hip bar; equipment is redrawn as outlines (dumbbell `|—|`, kettlebell as an
  open handle over a square body, box as one rectangle, chair as four lines).
- **Colour comes from outside.** Every stroke is `currentColor`. `courseTileVars()` derives
  `--course-tile-fg` from the tile hex and `.hero-art` applies it: black ink on a programme colour
  or on paper, light ink on a dark surface. The figure never carries a colour of its own and is
  never painted in the programme colour — the tile is.
- **Depth is opacity, not weight.** In the side view the far limbs are drawn first at
  `FAR_OPACITY = 0.55`. The reference figures are flat, but a profile with both arms and both legs
  at full ink collapses into one line at every crossing; a lighter far side is the one depth cue
  that keeps a squat readable without a second weight or a fill.
- **No radius anywhere.** The tile behind the figure is a sharp square; `ExerciseFigure` adds no
  `rounded-*` class.

## Public API

```ts
import ExerciseFigure from '@/components/anim/ExerciseFigure';
<ExerciseFigure animation="air_squat" variant="card" tile={course.tile} label={name} />
// variant: 'thumb' (72px, static first frame, tight crop, currentColor, no tile)
//          'card'  (200px flat tile)   'hero' (fills the container, square tile)
// playing?: boolean (thumb defaults to false)   speed?: number   className?: string
// tile?: course colour hex; defaults to the neutral dark surface (DEFAULT_TILE '#1f1f24')

import { figureSvgString } from '@/components/anim/render';
figureSvgString('air_squat', 0.5, { size: 600, tile: '#F2F52D', background: true });
// The tile also picks the ink (black on a programme colour, light on a dark surface) — pass it
// even with background: false when the figure will sit on a known tile.

import { POSES, ANIMATION_IDS } from '@/components/anim/poses/index';
import { basePose, plant, poseAt, solve, validatePoseSet } from '@/components/anim/rig';
```

Unknown animation ids never throw: the component and `figureSvgString` render the standing pose
and `console.warn` once per id.

## Coordinate system

200×200 viewBox, y grows downward, ground line at `GROUND_Y = 172`. Standing athlete: hips at
(100, 106), shoulders at y 62, head centre at y 43 (square from 32 to 54), feet on 172. Segment
lengths (viewBox units): torso 44, neck gap 8, head half-side 11, upper arm 26, forearm 24, thigh
34, shin 32, foot 12 (front view foot 8). Strokes: figure and equipment 7, construction lines 3.

## Views

- `side` — profile facing **right** (+x). `R` limbs are the near side (drawn on top, full ink),
  `L` limbs are the far side (drawn behind at 55 % opacity). Use for squats, hinges, lunges,
  push-ups, burpees, presses, rows, swings, runs.
- `front` — facing the viewer, limbs move in the frontal plane (abduction). `L` is on the screen
  left, `R` on the screen right (mirror view). Shoulders are 26 wide, hips 12 wide; the torso is a
  spine with a shoulder bar and a hip bar. Use for jumping jacks, skaters, lateral lunges, arm
  circles, band pull-aparts, jump rope, side bends.

## Pose = joint angles (degrees) + root

```ts
interface Pose {
  // hip joint position (viewBox units)
  rootX: number;
  rootY: number;
  // lean from vertical; head tilt relative to the torso
  torso: number;
  head: number;
  // arms: upper arm relative to the torso, forearm relative to the upper arm
  shoulderL: number;
  elbowL: number;
  shoulderR: number;
  elbowR: number;
  // legs: thigh relative to the torso, shin relative to the thigh, foot relative to the shin
  hipL: number;
  kneeL: number;
  ankleL: number;
  hipR: number;
  kneeR: number;
  ankleR: number;
}
```

Every angle is **relative to its parent segment**, 0 = straight/along the parent. Positive
directions (side view, athlete facing right):

```
                 head  (+ = chin down; the square itself stays level)
                 [ ]
      torso +     |      torso: + leans forward (top of the body moves →)
      (lean →)    |
                  |──→  shoulder: + = flexion, the arm swings forward/up
                  |  \        0 hangs along the torso, 90 horizontal, 180 overhead
                  |   \→ elbow: + = flexion, forearm bends forward/up (curl)
                  |
                 / \
   hip +  →    /     \    hip: + = flexion, the knee travels forward/up
   (knee fwd) |       |        0 hangs along the torso, 90 thigh horizontal
              |       |   knee: + = flexion, heel goes back toward the glutes
              |       |
             _|       |_  ankle: 0 = right angle (flat foot when the shin is vertical)
      ←heel   toes→        + = dorsiflexion (toes up), − = plantarflexion (toes down)

                     ─────────── ground y = 172 ───────────
```

Front view (athlete facing you): the same joints, but `shoulder` / `hip` are **abduction** (the
limb swings out sideways away from the midline, 90 = horizontal, 180 = overhead), `elbow` /
`knee` are flexion **inside the frontal plane** (elbow 90 with the arm horizontal = forearm
points up; knee flexion brings the foot back toward the midline), `torso` / `head` are lateral
leans toward +x.

Handy identities (side view):

- Flat foot on the floor: `ankle = knee − hip + torso`.
- Upper arm horizontal (forward): `shoulder = 90 + torso`. Straight up: `shoulder = 180 + torso`.
- Thigh horizontal: `hip = 90 + torso`.
- Absolute segment angles are exposed by `solve(pose, view).angles` if you need them for props.

## Pose set

```ts
import { basePose, plant } from '../rig';
import type { Pose, PoseSet } from './types';

// Standing start, right ankle planted at x = 100 on the ground line.
const top: Pose = plant(basePose('side'), 'side', { leg: 'R', x: 100 });
// Bottom of the squat: set the joints, then plant the same foot at the same spot.
const bottomJoints: Pose = { ...top, torso: 32, hipR: 105, kneeR: 112, ankleR: 39 };
const bottom: Pose = plant(bottomJoints, 'side', { leg: 'R', x: 100 });

export const air_squat: PoseSet = {
  id: 'air_squat', // = file name = Exercise.animation, snake_case
  view: 'side',
  loop: 'cycle', // 'cycle' 0→1→0…  |  'pingpong' 0→1→0 (mirrors back)
  durationMs: 2400, // one pass 0→1
  fps: 30, // optional cap for the component loop
  pivot: 'ankleR', // optional: keep this ankle planted between keyframes
  poster: 0.5, // optional: still frame for prefers-reduced-motion
  props: [{ kind: 'floor' }],
  keyframes: [
    { t: 0, pose: top }, // first keyframe must be complete
    { t: 0.5, pose: bottom, ease: 'inOut' }, // partial poses inherit the previous keyframe
    { t: 0.88, pose: top, ease: 'inOut' }, // cycle blends the last keyframe back to t = 0
  ],
};
```

Rules the rig enforces (`validatePoseSet`, run by `rig.test.ts` for every registered set):

- `id` is snake_case and equals the registry key; `durationMs > 0`; keyframe `t` strictly
  increasing within 0..1; the first keyframe is at `t = 0` and complete (spread `basePose(view)`);
  every joint value is a finite number; a `cycle` must end near where it starts.

Interpolation: each joint is eased independently between neighbouring keyframes (`ease` on a
keyframe describes how the motion _arrives_ there; default `inOut`; also `linear`, `in`, `out`).
`poseAt(set, u)` accepts any cycle position — `1.25` wraps to `0.25` for `cycle` and folds to
`0.75` for `pingpong`.

### Keeping feet on the floor

The hip is the root, so bending the legs moves the feet unless you move the root too. Two tools:

1. `plant(pose, view, { leg: 'R', x: 100 })` — authoring helper: shifts `rootX/rootY` so that
   ankle sits at (`x`, ground). Use it on every keyframe where a foot is on the floor.
2. `pivot: 'ankleR'` (or `'ankleL'`) in the pose set — runtime: the rig interpolates that ankle's
   world position instead of the hip, so the planted foot stays exactly where the keyframes put it
   even mid-motion (leg extent is nonlinear in the angles, so plain hip interpolation would sink
   the foot several px). Leave `pivot` unset (root) for flight phases and locomotion.

For jumps, keep `pivot` unset, raise `rootY` (smaller y) on the airborne keyframe and point the toes
(`ankle` ≈ −25). For alternating movements (lunges, step-ups) pivot on the foot that stays down;
if both feet alternate, plant both keyframes and accept sub-pixel drift, or split into two sets.

### Depth in the side view

Both limbs of a pair usually get the same angles; the far limb is then fully hidden. Offsetting
the far limb by 4–8° (e.g. `shoulderL = shoulderR − 6`) lets the lighter far limb peek out and
gives the figure depth. Do it where the limbs are away from the body (arms forward/overhead,
legs split).

## Props

Props are listed on the set and drawn at anchors computed from the pose each frame. They share
the figure's line weight (or the thin construction line) and are never filled:

| prop                                                                 | anchor / placement                                                                                                                                   |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `{ kind: 'floor' }`                                                  | thin line at the ground under the feet — use on every grounded set                                                                                   |
| `{ kind: 'dumbbells' }`                                              | bar across each wrist, perpendicular to the forearm, with a short plate line at each end                                                             |
| `{ kind: 'kettlebell', grip?: 'inline' \| 'hang' }`                  | midpoint of the wrists; an open handle over an outlined square body. `inline` follows the forearm (swings), `hang` drops vertically (goblet/carry)   |
| `{ kind: 'band', anchor?: 'wrists' \| 'feet' \| 'front' \| 'back' }` | thin line between the wrists / from under the feet to both wrists / from the right or left edge to the wrists                                        |
| `{ kind: 'rope' }`                                                   | thin arc between the wrists that sweeps under the feet at `t ≈ 0` and over the head at `t ≈ 0.5` — time the jump so the feet are airborne at `t = 0` |
| `{ kind: 'bar' }`                                                    | horizontal bar at the higher wrist — keep the wrists at a fixed world y and move the root for pull-ups                                               |
| `{ kind: 'chair', x? }`                                              | chair as four lines (seat, back, two legs), seat at ground − 44, default x 60 (behind a side-view athlete)                                           |
| `{ kind: 'box', height?, width?, x? }`                               | one outlined rectangle standing on the ground, default 44×40 at x 130 (in front); put the foot on `GROUND_Y − height` with `plant(..., { y })`       |

## Adding an animation

1. Create `poses/<id>.ts` exporting `export const <id>: PoseSet` (the id in snake_case, same as
   `Exercise.animation`).
2. In `poses/index.ts` add `import { <id> } from './<id>';` and the entry `<id>,` inside `POSES`.
   Both lists are alphabetical, one per line — this keeps parallel edits merge-safe.
3. `npx vitest run src/components/anim/rig.test.ts` — the registry test validates your set.
4. Preview it (below), look at the PNGs, iterate.

## Preview workflow (no dev server, no browser)

```
ANIM_PREVIEW=air_squat,burpee npx vitest run src/components/anim/preview.test.ts
# or
node scripts/anim/preview.mjs air_squat burpee
node scripts/anim/preview.mjs all
```

Writes `/tmp/anim-preview/<id>-<t>.png` for `t = 0, 0.25, 0.5, 0.75` and `<id>-sheet.png` with
eight frames (`t = 0 … 0.875`) in a row on the dark ground. Then open/Read the PNGs.
`ANIM_PREVIEW_OUT` changes the folder, `ANIM_PREVIEW_SIZE` the frame size in px (default 400).
Without `ANIM_PREVIEW` the test file skips silently, so it is safe in the normal test run.

## Quality checklist

- The movement is recognisable from the sheet alone: someone who knows the exercise names it.
- Feet do not sink below or float above the floor line in any frame of a grounded phase
  (`plant` on keyframes + `pivot` for the planted foot).
- Joint ranges are human: knee 0..140, hip −20..130, elbow 0..150, shoulder −60..190, ankle
  −40..35, torso −20..95 (side). Nothing hyper-extends the wrong way.
- Head stays roughly level with the gaze direction of the exercise (`head ≈ −0.7 × torso` keeps
  the athlete looking forward while leaning). The square itself never rotates.
- One repetition per cycle, ending where it starts; timing feels like a coached tempo (descents
  slower than the drive, short pause at the top). `durationMs` 1200–3200 for most movements.
- Arms/legs of a pair are offset a few degrees where they leave the body so the far limb shows.
- Props are attached to the right anchor and do not clip through the figure.
- The first frame (`t = 0`) is a clean, upright start position — it is the static thumbnail.
- `poster` points at the most characteristic frame (the bottom of a squat, the top of a jump).
- Nothing in the drawing is filled, round or coloured: if a change needs a new primitive, it is
  another stroke in `STROKE.line` or `STROKE.thin`, in `currentColor`.
- `npx vitest run src/components/anim` passes; `npx prettier --write` and `npx eslint` are clean.
