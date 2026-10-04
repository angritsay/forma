/**
 * The studio's four steps for one filmed video — «Нарезка · Названия · Цвет · Превью» — their
 * addresses, and which of them are open yet.
 *
 *  - **cut**: always (the cutter is where the clips come from);
 *  - **name**: once at least one clip is uploaded;
 *  - **color** and **preview**: once every clip has an exercise — a colour or a framing for a clip
 *    that may yet turn out to be a different exercise is work done twice.
 *
 * «Отправить в обработку» is on the last step, so nothing is queued before it has been seen the
 * way the athlete will see it.
 */
import type { MediaClip } from '@/lib/api/mediaStudio';

export const STUDIO_PATH = '/admin/studio';
/** A new video: the cutter with no source yet. */
export const STUDIO_CUT_PATH = '/admin/studio/cut';

export const STUDIO_STEPS = ['cut', 'name', 'color', 'preview'] as const;
export type StudioStep = (typeof STUDIO_STEPS)[number];

export function isStudioStep(v: unknown): v is StudioStep {
  return STUDIO_STEPS.includes(v as StudioStep);
}

/** `/admin/studio/s/<source>/<step>`, optionally opened on one clip. */
export function studioStepPath(sourceId: string, step: StudioStep, clipId?: string | null): string {
  const base = `/admin/studio/s/${encodeURIComponent(sourceId)}/${step}`;
  return clipId ? `${base}?clip=${encodeURIComponent(clipId)}` : base;
}

type FlowClip = Pick<MediaClip, 'exerciseId' | 'status'>;

/** Which steps are open for these clips (the clips of one source). */
export function openSteps(clips: readonly FlowClip[]): Record<StudioStep, boolean> {
  const any = clips.length > 0;
  const named = any && clips.every((c) => c.exerciseId !== null);
  return { cut: true, name: any, color: named, preview: named };
}

/**
 * The step a source is at, for the overview's link: nothing uploaded — cut; a clip without an
 * exercise — name; everything sent or rendered — preview (where its state is shown); else colour.
 */
export function currentStep(clips: readonly FlowClip[]): StudioStep {
  if (clips.length === 0) return 'cut';
  if (clips.some((c) => c.exerciseId === null)) return 'name';
  if (clips.every((c) => c.status !== 'draft' && c.status !== 'failed')) return 'preview';
  return 'color';
}

/** The furthest open step at or before `want`: where a link to a closed step lands instead. */
export function allowedStep(want: StudioStep, clips: readonly FlowClip[]): StudioStep {
  const open = openSteps(clips);
  for (let i = STUDIO_STEPS.indexOf(want); i >= 0; i--) {
    const s = STUDIO_STEPS[i]!;
    if (open[s]) return s;
  }
  return 'cut';
}
