import { afterEach, describe, expect, it, vi } from 'vitest';
import { STANDING_SET, getPoseSet, resetAnimationWarnings } from './lookup';
import { ANIMATION_IDS, POSES } from './poses/index';
import type { Pose, PoseSet } from './poses/types';
import { figureSvgString } from './render';
import {
  GROUND_Y,
  HEAD_SIZE,
  STROKE,
  basePose,
  figurePath,
  figureScene,
  loopPhase,
  plant,
  poseAt,
  resolveKeyframes,
  sceneBounds,
  solve,
  validatePoseSet,
} from './rig';

const near = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) <= eps;
const expectPoseClose = (a: Pose, b: Pose, eps = 1e-9) => {
  for (const k of Object.keys(a) as (keyof Pose)[]) {
    expect(Math.abs(a[k] - b[k]), k).toBeLessThan(eps);
  }
};

const swing: PoseSet = {
  id: 'test_swing',
  view: 'side',
  loop: 'cycle',
  durationMs: 1000,
  keyframes: [
    { t: 0, pose: basePose('side') },
    { t: 0.4, pose: { shoulderL: 90, shoulderR: 90 }, ease: 'inOut' },
    { t: 0.7, pose: { elbowR: 45 }, ease: 'out' },
  ],
};

describe('forward kinematics', () => {
  it('stands on the ground line with the head above the hips (side)', () => {
    const { joints } = solve(basePose('side'), 'side');
    expect(near(joints.ankleL.y, GROUND_Y)).toBe(true);
    expect(near(joints.ankleR.y, GROUND_Y)).toBe(true);
    expect(near(joints.toeR.y, GROUND_Y)).toBe(true);
    expect(joints.toeR.x).toBeGreaterThan(joints.ankleR.x); // foot points forward
    expect(joints.head.y).toBeLessThan(joints.shoulder.y);
    expect(joints.shoulder.y).toBeLessThan(joints.hip.y);
    expect(joints.hip.y).toBeLessThan(joints.kneeR.y);
    expect(joints.head.y).toBeGreaterThan(0);
  });

  it('stands on the ground line in the front view with a shoulder width', () => {
    const { joints } = solve(basePose('front'), 'front');
    expect(near(joints.ankleR.y, GROUND_Y)).toBe(true);
    expect(near(joints.ankleL.y, GROUND_Y)).toBe(true);
    expect(joints.shoulderL.x).toBeLessThan(joints.shoulderR.x);
    expect(joints.ankleL.x).toBeLessThan(joints.ankleR.x);
    expect(joints.head.y).toBeLessThan(joints.hip.y);
  });

  it('follows the documented angle directions (side view)', () => {
    const base = basePose('side');
    const flexed = solve({ ...base, shoulderR: 90, elbowR: 0 }, 'side').joints;
    expect(flexed.wristR.x).toBeGreaterThan(flexed.shoulderR.x + 40); // arm forward
    expect(near(flexed.wristR.y, flexed.shoulderR.y, 1e-6)).toBe(true);
    const curl = solve({ ...base, shoulderR: 0, elbowR: 90 }, 'side').joints;
    expect(curl.wristR.x).toBeGreaterThan(curl.elbowR.x); // forearm swings forward
    const kick = solve({ ...base, hipR: 0, kneeR: 90 }, 'side').joints;
    expect(kick.ankleR.x).toBeLessThan(kick.kneeR.x); // heel goes back
    const lean = solve({ ...base, torso: 30 }, 'side').joints;
    expect(lean.shoulder.x).toBeGreaterThan(lean.hip.x); // leaning forward = +x
    const toesUp = solve({ ...base, ankleR: 30 }, 'side').joints;
    expect(toesUp.toeR.y).toBeLessThan(toesUp.ankleR.y);
  });

  it('abducts away from the midline in the front view', () => {
    const base = basePose('front');
    const jacks = solve(
      { ...base, shoulderL: 90, shoulderR: 90, hipL: 30, hipR: 30 },
      'front',
    ).joints;
    expect(jacks.wristL.x).toBeLessThan(jacks.shoulderL.x - 40);
    expect(jacks.wristR.x).toBeGreaterThan(jacks.shoulderR.x + 40);
    expect(jacks.ankleL.x).toBeLessThan(jacks.hipL.x);
    expect(jacks.ankleR.x).toBeGreaterThan(jacks.hipR.x);
  });

  it('plant() puts the requested ankle on the ground at x', () => {
    const p = plant({ ...basePose('side'), hipR: 60, kneeR: 90, torso: 20 }, 'side', {
      leg: 'R',
      x: 100,
    });
    const { joints } = solve(p, 'side');
    expect(near(joints.ankleR.x, 100)).toBe(true);
    expect(near(joints.ankleR.y, GROUND_Y)).toBe(true);
  });
});

describe('interpolation', () => {
  it('spreads missing joints from the previous keyframe', () => {
    const kfs = resolveKeyframes(swing);
    expect(kfs).toHaveLength(3);
    expect(kfs[1]!.pose.shoulderL).toBe(90);
    expect(kfs[2]!.pose.shoulderL).toBe(90);
    expect(kfs[2]!.pose.elbowR).toBe(45);
    expect(kfs[2]!.pose.elbowL).toBe(basePose('side').elbowL);
  });

  it('is continuous at every keyframe', () => {
    const kfs = resolveKeyframes(swing);
    for (const kf of kfs) {
      const before = poseAt(swing, Math.max(0, kf.t - 1e-5));
      const at = poseAt(swing, kf.t);
      const after = poseAt(swing, Math.min(0.99999, kf.t + 1e-5));
      for (const k of Object.keys(at) as (keyof typeof at)[]) {
        expect(Math.abs(before[k] - at[k])).toBeLessThan(0.05);
        expect(Math.abs(after[k] - at[k])).toBeLessThan(0.05);
      }
    }
    expect(poseAt(swing, 0.4).shoulderR).toBe(90);
  });

  it('eases between keyframes', () => {
    const mid = poseAt(swing, 0.2);
    expect(mid.shoulderR).toBeGreaterThan(30);
    expect(mid.shoulderR).toBeLessThan(60);
  });

  it('wraps cycles and folds pingpong', () => {
    expect(loopPhase('cycle', 1.25)).toBeCloseTo(0.25);
    expect(loopPhase('cycle', -0.25)).toBeCloseTo(0.75);
    expect(loopPhase('pingpong', 1.25)).toBeCloseTo(0.75);
    expect(loopPhase('pingpong', 2.1)).toBeCloseTo(0.1);
    expectPoseClose(poseAt(swing, 1.2), poseAt(swing, 0.2));
    // A cycle whose last keyframe is before t = 1 blends back into the first keyframe.
    const nearWrap = poseAt(swing, 0.999);
    expect(Math.abs(nearWrap.shoulderR - poseAt(swing, 0).shoulderR)).toBeLessThan(1);
    const pp: PoseSet = { ...swing, id: 'test_pp', loop: 'pingpong' };
    expectPoseClose(poseAt(pp, 1.3), poseAt(pp, 0.7));
  });

  it('keeps the pivot ankle planted between keyframes', () => {
    const set = POSES.air_squat!;
    for (const u of [0, 0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9]) {
      const { joints } = solve(poseAt(set, u), set.view);
      expect(Math.abs(joints.ankleR.x - 100)).toBeLessThan(1e-6);
      expect(Math.abs(joints.ankleR.y - GROUND_Y)).toBeLessThan(1e-6);
    }
  });
});

describe('air_squat', () => {
  it('goes down and back with the arms forward, then stands back up', () => {
    const set = POSES.air_squat!;
    const top = solve(poseAt(set, 0), 'side').joints;
    const bottom = solve(poseAt(set, 0.5), 'side').joints;
    expect(bottom.hip.y).toBeGreaterThan(top.hip.y + 25); // hips down
    expect(bottom.hip.x).toBeLessThan(top.hip.x - 8); // hips back
    expect(bottom.kneeR.x).toBeGreaterThan(bottom.hip.x + 20); // knees bent forward
    expect(bottom.wristR.x).toBeGreaterThan(bottom.shoulder.x + 40); // arms forward
    expect(poseAt(set, 0.5).torso).toBeGreaterThan(20); // torso forward
    expectPoseClose(poseAt(set, 0.95), poseAt(set, 0)); // back at the top
  });
});

describe('registry and fallback', () => {
  afterEach(() => {
    resetAnimationWarnings();
    vi.restoreAllMocks();
  });

  it('every registered pose set is well-formed', () => {
    expect(ANIMATION_IDS).toContain('air_squat');
    for (const id of ANIMATION_IDS) {
      const set = POSES[id]!;
      expect(set.id, `${id}: id must match the registry key`).toBe(id);
      expect(validatePoseSet(set), `${id}`).toEqual([]);
    }
  });

  it('validatePoseSet reports malformed sets', () => {
    const bad: PoseSet = {
      id: 'Bad Id',
      view: 'side',
      loop: 'cycle',
      durationMs: 0,
      keyframes: [
        { t: 0.1, pose: { torso: 10 } },
        { t: 0.05, pose: { torso: Number.NaN } },
      ],
    };
    const issues = validatePoseSet(bad);
    expect(issues.some((m) => m.includes('snake_case'))).toBe(true);
    expect(issues.some((m) => m.includes('durationMs'))).toBe(true);
    expect(issues.some((m) => m.includes('t = 0'))).toBe(true);
    expect(issues.some((m) => m.includes('incomplete'))).toBe(true);
    expect(issues.some((m) => m.includes('increase'))).toBe(true);
    expect(issues.some((m) => m.includes('finite'))).toBe(true);
  });

  it('falls back to the standing pose for unknown ids and warns once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(getPoseSet('does_not_exist')).toBe(STANDING_SET);
    expect(getPoseSet('does_not_exist')).toBe(STANDING_SET);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(getPoseSet('air_squat')).toBe(POSES.air_squat);
    expect(getPoseSet('constructor')).toBe(STANDING_SET);
  });
});

describe('scene and static rendering', () => {
  it('draws far limbs behind the torso and near limbs on top', () => {
    const geo = figurePath(basePose('side'), 'side');
    expect(geo.segments.filter((s) => s.depth === 1).map((s) => s.part)).toEqual([
      'upperArmL',
      'forearmL',
      'thighL',
      'shinL',
      'footL',
    ]);
    const scene = figureScene(basePose('side'), 'side');
    const firstNear = scene.findIndex((p) => p.kind === 'path' && p.opacity === 1);
    const lastFar = scene.map((p) => p.kind === 'path' && p.opacity < 1).lastIndexOf(true);
    expect(lastFar).toBeGreaterThanOrEqual(0);
    expect(lastFar).toBeLessThan(firstNear);
    expect(scene[scene.length - 1]!.kind).toBe('rect'); // head on top
    // Each limb is one polyline (mitred joints), so a bare side figure is far arm, far leg,
    // torso+neck, near leg, near arm, head.
    expect(scene.map((p) => p.kind)).toEqual(['path', 'path', 'path', 'path', 'path', 'rect']);
  });

  it('is a blueprint: one line weight, square outlined head, nothing filled', () => {
    for (const view of ['side', 'front'] as const) {
      const pose = basePose(view);
      const scene = figureScene(pose, view);
      // Every figure stroke is the single brand weight (props may use the thin construction line).
      expect(new Set(scene.map((p) => p.width))).toEqual(new Set([STROKE.line]));
      expect(scene.some((p) => (p.kind as string) === 'circle')).toBe(false);
      // The head is an axis-aligned 22×22 square centred on the head joint, outlined at line
      // weight — the 16×16 square of the 120-unit brand figures at the rig's scale.
      const { joints } = solve(pose, view);
      const head = scene[scene.length - 1]!;
      expect(head.kind).toBe('rect');
      if (head.kind === 'rect') {
        expect(head.w).toBe(HEAD_SIZE);
        expect(head.h).toBe(HEAD_SIZE);
        expect(head.x + head.w / 2).toBeCloseTo(joints.head.x);
        expect(head.y + head.h / 2).toBeCloseTo(joints.head.y);
        expect(head.width).toBe(STROKE.line);
      }
      // The neck runs from the shoulder and stops on the square's edge, never inside it.
      const neck = figurePath(pose, view).segments.find((s) => s.part === 'neck')!;
      expect(neck.y1).toBeCloseTo(joints.shoulder.y);
      expect(
        Math.max(Math.abs(neck.x2 - joints.head.x), Math.abs(neck.y2 - joints.head.y)),
      ).toBeCloseTo(HEAD_SIZE / 2);
    }
    // The front torso is a spine with shoulder and hip bars, not a filled trapezoid.
    const front = figurePath(basePose('front'), 'front').segments.map((s) => s.part);
    expect(front).toContain('torso');
    expect(front).toContain('shoulders');
    expect(front).toContain('hips');
    expect(figurePath(basePose('side'), 'side').segments.map((s) => s.part)).not.toContain(
      'shoulders',
    );
  });

  it('renders props at anchors', () => {
    const pose = basePose('side');
    const plain = figureScene(pose, 'side').length;
    expect(figureScene(pose, 'side', { props: [{ kind: 'dumbbells' }] }).length).toBe(plain + 6);
    expect(figureScene(pose, 'side', { props: [{ kind: 'kettlebell' }] }).length).toBe(plain + 2);
    expect(
      figureScene(pose, 'side', { props: [{ kind: 'floor' }, { kind: 'bar' }, { kind: 'rope' }] })
        .length,
    ).toBe(plain + 3);
    // The front figure carries two more lines (shoulder and hip bars), so it has its own baseline.
    const front = basePose('front');
    const plainFront = figureScene(front, 'front').length;
    expect(plainFront).toBe(plain + 2);
    expect(
      figureScene(front, 'front', {
        props: [{ kind: 'band', anchor: 'feet' }, { kind: 'box' }, { kind: 'chair' }],
      }).length,
    ).toBe(plainFront + 7);
    // Equipment is outlined in the same weight; the floor, bands and the rope are thin lines.
    const widths = new Set(
      figureScene(pose, 'side', {
        props: [{ kind: 'dumbbells' }, { kind: 'kettlebell' }, { kind: 'floor' }, { kind: 'box' }],
      }).map((p) => p.width),
    );
    expect(widths).toEqual(new Set([STROKE.line, STROKE.thin]));
    // The box stands on the floor line with its outer face on the stated width.
    const box = figureScene(pose, 'side', { props: [{ kind: 'box', height: 40, width: 44 }] })[0]!;
    expect(box.kind).toBe('rect');
    if (box.kind === 'rect') {
      expect(box.x - box.width / 2).toBeCloseTo(130 - 22);
      expect(box.x + box.w + box.width / 2).toBeCloseTo(130 + 22);
      expect(box.y + box.h + box.width / 2).toBeCloseTo(GROUND_Y + STROKE.line / 2);
    }
    const b = sceneBounds(figureScene(pose, 'side'));
    expect(b.y).toBeGreaterThan(20);
    expect(b.y + b.h).toBeLessThan(GROUND_Y + 6);
  });

  it('figureSvgString returns a standalone SVG', () => {
    const svg = figureSvgString('air_squat', 0.5, { size: 400 });
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"')).toBe(
      true,
    );
    // The tile behind the figure is one flat, sharp fill — no radius, no <defs>, no gradient.
    expect(svg).toContain('<rect width="200" height="200" fill="#1f1f24"/>');
    expect(svg).not.toContain('rx=');
    expect(svg).not.toContain('linearGradient');
    // Blueprint strokes: square ends, sharp joins, never a fill or a circle.
    expect(svg).toContain('stroke-linecap="butt"');
    expect(svg).toContain('stroke-linejoin="miter"');
    expect(svg).not.toContain('stroke-linecap="round"');
    expect(svg).not.toContain('<circle');
    expect(svg).not.toContain('fill="currentColor"');
    expect(svg.endsWith('</svg>')).toBe(true);
    // Light ink on the default dark surface, black ink on a programme colour.
    expect(svg).toContain('color="#f6f6f7"');
    expect(figureSvgString('air_squat', 0, { tile: '#F2F52D' })).toContain('color="#0f0f11"');
    const bare = figureSvgString('air_squat', 0, { background: false, size: 96 });
    expect(bare).not.toContain('fill="#1f1f24"');
    expect(bare).toContain('width="96"');
  });
});
