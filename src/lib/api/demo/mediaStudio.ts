/**
 * Demo double of «Студия» (0060).
 *
 * The browser-local demo has no storage and no render worker, so this keeps sources and clips in
 * memory for the tab and applies the same rules as the SQL: labelled clips queue, a clip being
 * rendered is not edited, a rendered clip that changes is a draft again. Nothing ever renders —
 * a queued clip stays queued, which is the honest picture of a backend with no worker.
 */
import { AppError } from '../errors';
import { guard } from '../internal';
import {
  clipPatchToDb,
  cropToDb,
  gradeToDb,
  type AddMediaClipInput,
  type MediaClip,
  type MediaClipPatch,
  type MediaPaste,
  type MediaSource,
  type SaveMediaSourceInput,
} from '../mediaStudio';
import { GRADE_VERSION } from '@/lib/media/grade';
import { delay } from './latency';
import { currentDemoUser, nowIso } from './store';

async function run<T>(fn: () => T): Promise<T> {
  await delay();
  return guard(async () => {
    if (!currentDemoUser()) throw new AppError('auth', 'not_signed_in');
    return fn();
  });
}

type DemoSource = Omit<MediaSource, 'clips' | 'done' | 'queued' | 'failed'>;

const sources = new Map<string, DemoSource>();
const clips = new Map<string, MediaClip>();

const uuid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : '00000000-0000-4000-8000-' + String(Date.now()).padStart(12, '0').slice(-12);

const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

export async function listMediaSources(): Promise<MediaSource[]> {
  return run(() =>
    [...sources.values()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((s) => {
        const own = [...clips.values()].filter((c) => c.sourceId === s.id);
        return {
          ...s,
          clips: own.length,
          done: own.filter((c) => c.status === 'done').length,
          queued: own.filter((c) => c.status === 'queued' || c.status === 'rendering').length,
          failed: own.filter((c) => c.status === 'failed').length,
        };
      }),
  );
}

export async function saveMediaSource(input: SaveMediaSourceInput): Promise<string> {
  return run(() => {
    const id = input.id ?? uuid();
    const was = sources.get(id);
    sources.set(id, {
      id,
      title: input.title?.trim() ?? was?.title ?? '',
      fileName: input.fileName?.trim() || was?.fileName || null,
      durationS: input.durationS ?? was?.durationS ?? null,
      createdAt: was?.createdAt ?? nowIso(),
    });
    return id;
  });
}

export async function listMediaClips(sourceId: string | null): Promise<MediaClip[]> {
  return run(() =>
    [...clips.values()]
      .filter((c) => sourceId === null || c.sourceId === sourceId)
      .sort((a, b) => a.sourceId.localeCompare(b.sourceId) || a.startS - b.startS),
  );
}

export async function addMediaClip(input: AddMediaClipInput): Promise<MediaClip> {
  return run(() => {
    if (!sources.has(input.sourceId)) throw new AppError('validation', 'unknown_source');
    const was = clips.get(input.id);
    if (was && was.sourceId !== input.sourceId) throw new AppError('validation', 'clip_conflict');
    if (was && was.status !== 'draft' && was.status !== 'failed') return was;
    const now = nowIso();
    const clip: MediaClip = {
      id: input.id,
      sourceId: input.sourceId,
      exerciseId: input.exerciseId ?? was?.exerciseId ?? null,
      exerciseName: null,
      exerciseHasVideo: false,
      rawPath: input.rawPath,
      rawOffsetS: input.rawOffsetS,
      startS: input.startS,
      endS: input.endS,
      crop: cropToDb(input.crop) ?? was?.crop ?? null,
      grade: was?.grade ?? null,
      gradeVersion: was?.gradeVersion ?? GRADE_VERSION,
      status: was?.status ?? 'draft',
      error: was?.error ?? null,
      attempts: was?.attempts ?? 0,
      renderedAt: null,
      createdAt: was?.createdAt ?? now,
      updatedAt: now,
    };
    clips.set(clip.id, clip);
    return clip;
  });
}

export async function saveMediaClip(id: string, patch: MediaClipPatch): Promise<MediaClip> {
  return run(() => {
    const was = clips.get(id);
    if (!was) throw new AppError('not_found', 'not_found');
    if (was.status === 'rendering') throw new AppError('validation', 'clip_busy');
    const db = clipPatchToDb(patch);
    const next: MediaClip = {
      ...was,
      ...('exercise_id' in db ? { exerciseId: (db.exercise_id as string | null) ?? null } : {}),
      ...('crop' in db ? { crop: db.crop as MediaClip['crop'] } : {}),
      ...('grade' in db
        ? { grade: db.grade as MediaClip['grade'], gradeVersion: GRADE_VERSION }
        : {}),
    };
    const changed =
      next.exerciseId !== was.exerciseId ||
      !same(next.crop, was.crop) ||
      !same(next.grade, was.grade);
    if (changed && was.status === 'done') next.status = 'draft';
    // As on the server: an unlabelled clip is never claimed, so it does not stay queued.
    if (next.status === 'queued' && !next.exerciseId) next.status = 'draft';
    next.updatedAt = nowIso();
    clips.set(id, next);
    return next;
  });
}

export async function pasteMediaSettings(ids: string[], paste: MediaPaste): Promise<number> {
  return run(() => {
    const grade = 'grade' in paste ? gradeToDb(paste.grade) : undefined;
    const crop = 'crop' in paste ? cropToDb(paste.crop) : undefined;
    let n = 0;
    for (const id of ids) {
      const c = clips.get(id);
      if (!c || c.status === 'rendering') continue;
      const next = {
        ...c,
        ...(grade !== undefined ? { grade, gradeVersion: GRADE_VERSION } : {}),
        ...(crop !== undefined ? { crop } : {}),
      };
      if (same(next.grade, c.grade) && same(next.crop, c.crop)) continue;
      if (next.status === 'done') next.status = 'draft';
      next.updatedAt = nowIso();
      clips.set(id, next);
      n++;
    }
    return n;
  });
}

function requeue(ids: string[], from: readonly MediaClip['status'][]): number {
  let n = 0;
  for (const id of ids) {
    const c = clips.get(id);
    if (!c || !c.exerciseId || !from.includes(c.status)) continue;
    clips.set(id, { ...c, status: 'queued', attempts: 0, error: null, updatedAt: nowIso() });
    n++;
  }
  return n;
}

export async function queueMediaClips(ids: string[]): Promise<number> {
  return run(() => requeue(ids, ['draft', 'done', 'failed']));
}

export async function retryMediaClips(ids: string[]): Promise<number> {
  return run(() => requeue(ids, ['failed']));
}

export async function deleteMediaClip(clip: Pick<MediaClip, 'id'>): Promise<void> {
  return run(() => {
    const c = clips.get(clip.id);
    if (c?.status === 'rendering') throw new AppError('validation', 'clip_busy');
    clips.delete(clip.id);
  });
}
