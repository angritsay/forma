import { describe, it } from 'vitest';
import { COURSES } from '@content/courses';
import { prescribeWorkout } from '@/lib/training/prescribe';
import { buildPlayerSteps } from '@/lib/training/player';
import { stepWeightSec } from '@/lib/training/session';
import type { DifficultyChoice, UserTrainingProfile } from '@/lib/training/types';
import type { Workout } from '@/content/schema';

const PROFILE = {
  equipment: ['none', 'mat', 'dumbbells', 'kettlebell', 'pullup_bar', 'box', 'jump_rope', 'band'],
  dumbbellKg: [8, 12, 16],
  kettlebellKg: [16, 24],
  limitations: [],
} as unknown as UserTrainingProfile;

describe('scratch', () => {
  it('all-non-scalable workouts', () => {
    for (const c of COURSES) {
      for (const w of c.workouts as Workout[]) {
        const all = w.blocks.every((b) => b.scalable === false);
        if (!all) continue;
        const pts = (ch: DifficultyChoice) =>
          prescribeWorkout(w, { profile: PROFILE, level: 2, choice: ch, scale: 1 });
        const e = pts('easier'), n = pts('normal'), h = pts('harder');
        const nodes = c.nodes.filter((nd) => nd.workoutId === w.id).map((nd) => `${nd.id}(${nd.kind})`);
        console.log(`${c.id}/${w.id} blocks=${w.blocks.map(b=>b.type).join(',')} points=${e.points}/${n.points}/${h.points} sec=${e.estimatedSec}/${n.estimatedSec}/${h.estimatedSec} nodes=${nodes.join(' ')}`);
      }
    }
  });

  it('start emom weights by block type', () => {
    const c = COURSES.find((x) => x.id === 'start')!;
    for (const w of c.workouts as Workout[]) {
      const p = prescribeWorkout(w, { profile: PROFILE, level: 2, choice: 'normal', scale: 1 });
      const steps = buildPlayerSteps(p);
      const byBlock = new Map<string, number>();
      steps.forEach((s) => {
        const wt = stepWeightSec(s);
        if (wt <= 0) return;
        const bid = 'blockId' in s ? s.blockId : '?';
        byBlock.set(bid, (byBlock.get(bid) ?? 0) + wt);
      });
      const types = new Map(p.blocks.map((b) => [b.blockId, b.type]));
      const parts = [...byBlock].map(([b, sec]) => `${types.get(b)}:${b}=${sec}`);
      const total = [...byBlock.values()].reduce((a, b) => a + b, 0);
      console.log(`${w.id} total=${total} ${parts.join(' ')}`);
    }
  });

  it('node kinds per course', () => {
    for (const c of COURSES) {
      const counts: Record<string, number> = {};
      for (const n of c.nodes) counts[n.kind] = (counts[n.kind] ?? 0) + 1;
      console.log(c.id, JSON.stringify(counts), 'nodes=', c.nodes.length);
    }
  });
});
