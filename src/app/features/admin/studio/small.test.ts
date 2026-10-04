/**
 * The cutter's small pure modules: exercise ids from names, the keyboard table, error
 * classification, the per-file draft and the status chips.
 */
import { describe, expect, it } from 'vitest';
import { AppError } from '@/lib/api/errors';
import type { MediaClip } from '@/lib/api/mediaStudio';
import { EXERCISE_ID_RE } from '@/app/features/admin/exercises/ExerciseEditor';
import {
  clipsOfSource,
  countByFilter,
  filterOf,
  matchesFilter,
  needsLabel,
  sourceDrafts,
} from './clipStatus';
import {
  DRAFT_MAX_AGE_MS,
  draftKey,
  parseDraft,
  serializeDraft,
  titleFromFileName,
  type CutDraft,
} from './cutDraft';
import { exerciseIdFromName, slugOfName } from './exerciseId';
import { cutterActionForKey } from './shortcuts';
import { newSegment } from './timeline';
import { classifyUploadError, isRetryable, StudioError, tusStatus } from './uploadErrors';

describe('exercise ids', () => {
  it('transliterates a Russian name', () => {
    expect(slugOfName('Выпад назад')).toBe('vypad_nazad');
    expect(slugOfName('Жим гантелей лёжа')).toBe('zhim_ganteley_lezha');
    expect(slugOfName('  Щука — подъём! ')).toBe('schuka_podem');
    expect(slugOfName('Plank 2')).toBe('plank_2');
  });

  it('makes ids the exercise editor accepts', () => {
    for (const name of ['Выпад назад', 'Ягодичный мост на одной ноге', 'Х'.repeat(100)]) {
      const id = exerciseIdFromName(name, new Set());
      expect(id).not.toBeNull();
      expect(EXERCISE_ID_RE.test(id!)).toBe(true);
    }
  });

  it('skips taken ids', () => {
    expect(exerciseIdFromName('Планка', new Set(['planka']))).toBe('planka_2');
    expect(exerciseIdFromName('Планка', new Set(['planka', 'planka_2']))).toBe('planka_3');
    const long = 'Я'.repeat(40); // 'ya' × 40 → cut to 60
    const base = exerciseIdFromName(long, new Set())!;
    const next = exerciseIdFromName(long, new Set([base]))!;
    expect(next.length).toBeLessThanOrEqual(60);
    expect(EXERCISE_ID_RE.test(next)).toBe(true);
  });

  it('gives up on names with nothing usable', () => {
    expect(exerciseIdFromName('!!!', new Set())).toBeNull();
    expect(exerciseIdFromName('ъ', new Set())).toBeNull();
  });
});

describe('cutter keys', () => {
  it('maps the marks, play and steps', () => {
    expect(cutterActionForKey({ key: 'i' })).toBe('mark_in');
    expect(cutterActionForKey({ key: 'O' })).toBe('mark_out');
    expect(cutterActionForKey({ key: 'ш' })).toBe('mark_in');
    expect(cutterActionForKey({ key: 'щ' })).toBe('mark_out');
    expect(cutterActionForKey({ key: ' ' })).toBe('toggle_play');
    expect(cutterActionForKey({ key: 'ArrowLeft' })).toBe('frame_back');
    expect(cutterActionForKey({ key: 'ArrowRight', shiftKey: true })).toBe('second_forward');
  });

  it('leaves typing and browser shortcuts alone', () => {
    expect(cutterActionForKey({ key: 'i', targetTag: 'INPUT' })).toBeNull();
    expect(cutterActionForKey({ key: ' ', targetTag: 'textarea' })).toBeNull();
    expect(cutterActionForKey({ key: 'o', targetEditable: true })).toBeNull();
    expect(cutterActionForKey({ key: 'i', metaKey: true })).toBeNull();
    expect(cutterActionForKey({ key: 'ArrowLeft', altKey: true })).toBeNull();
    expect(cutterActionForKey({ key: 'x' })).toBeNull();
  });

  it('lets space press a focused button, while the marks keys still work there', () => {
    expect(cutterActionForKey({ key: ' ', targetTag: 'BUTTON' })).toBeNull();
    expect(cutterActionForKey({ key: ' ', targetTag: 'a' })).toBeNull();
    expect(cutterActionForKey({ key: 'i', targetTag: 'BUTTON' })).toBe('mark_in');
    expect(cutterActionForKey({ key: ' ', targetTag: 'DIV' })).toBe('toggle_play');
  });
});

describe('upload errors', () => {
  const tusError = (status: number, body = '') => ({
    name: 'DetailedError',
    message: 'tus: unexpected response',
    originalRequest: {},
    originalResponse: { getStatus: () => status, getBody: () => body },
  });

  it('keeps the kind of its own errors', () => {
    expect(classifyUploadError(new StudioError('remux'))).toBe('remux');
    expect(classifyUploadError(new StudioError('keyframe'), false)).toBe('keyframe');
  });

  it('blames the signal when the phone is offline', () => {
    expect(classifyUploadError(new Error('x'), false)).toBe('offline');
    expect(classifyUploadError(new AppError('network', 'fetch failed'))).toBe('offline');
    expect(classifyUploadError({ name: 'DetailedError', originalRequest: {} })).toBe('offline');
    expect(classifyUploadError(new TypeError('Failed to fetch'))).toBe('offline');
  });

  it('reads the server’s answers', () => {
    expect(classifyUploadError(new AppError('validation', 'clip_busy'))).toBe('busy');
    expect(classifyUploadError(new AppError('validation', 'invalid_span'))).toBe('invalid');
    expect(classifyUploadError(new AppError('forbidden', 'not_admin'))).toBe('permission');
    expect(classifyUploadError(new AppError('auth', 'not_signed_in'))).toBe('permission');
    expect(classifyUploadError(new AppError('unknown', 'boom'))).toBe('server');
  });

  it('reads TUS statuses', () => {
    expect(tusStatus(tusError(413))).toBe(413);
    expect(tusStatus({})).toBeNull();
    expect(classifyUploadError(tusError(413))).toBe('too_large');
    expect(classifyUploadError(tusError(400, 'The object exceeded the maximum allowed size'))).toBe(
      'too_large',
    );
    expect(classifyUploadError(tusError(403))).toBe('permission');
    expect(classifyUploadError(tusError(500))).toBe('server');
  });

  it('offers a retry only where one can help', () => {
    expect(isRetryable('offline')).toBe(true);
    expect(isRetryable('server')).toBe(true);
    expect(isRetryable('too_large')).toBe(false);
    expect(isRetryable('unsupported')).toBe(false);
    expect(isRetryable('permission')).toBe(false);
  });
});

describe('cut draft', () => {
  const SRC = '11111111-2222-4333-8444-555555555555';
  const SEG = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
  const now = 1_700_000_000_000;

  const draft = (): CutDraft => {
    const a = { ...newSegment(SEG, 1, 5), exerciseId: 'planka', exerciseName: 'Планка' };
    const b = {
      ...newSegment('bbbbbbbb-bbbb-4ccc-8ddd-eeeeeeeeeeee', 6, 9),
      upload: 'uploading' as const,
      progress: 0.4,
    };
    const c = {
      ...newSegment('cccccccc-bbbb-4ccc-8ddd-eeeeeeeeeeee', 10, 12),
      upload: 'done' as const,
    };
    return { sourceId: SRC, title: 'Тренировка', segments: [a, b, c], savedAt: now };
  };

  it('keys a draft by the file', () => {
    const k = draftKey({ name: 'IMG 1.MOV', size: 10, lastModified: 5 });
    expect(k).toBe('forma.studio.cut.10.5.IMG%201.MOV');
    expect(draftKey({ name: 'IMG 1.MOV', size: 11, lastModified: 5 })).not.toBe(k);
  });

  it('round-trips, with work in flight back to «not uploaded»', () => {
    const back = parseDraft(serializeDraft(draft()), now + 1000)!;
    expect(back.sourceId).toBe(SRC);
    expect(back.title).toBe('Тренировка');
    expect(back.segments.map((s) => s.upload)).toEqual(['idle', 'idle', 'done']);
    expect(back.segments[0]).toMatchObject({ exerciseId: 'planka', exerciseName: 'Планка' });
    expect(back.segments[1]!.progress).toBe(0);
  });

  it('drops old, broken or foreign drafts', () => {
    expect(parseDraft(serializeDraft(draft()), now + DRAFT_MAX_AGE_MS + 1)).toBeNull();
    expect(parseDraft('{', now)).toBeNull();
    expect(parseDraft(JSON.stringify({ sourceId: 'nope' }), now)).toBeNull();
    const bad = JSON.stringify({
      sourceId: SRC,
      savedAt: now,
      segments: [{ id: 'x', startS: 1, endS: 2 }, { id: SEG, startS: 5, endS: 4 }, null],
    });
    expect(parseDraft(bad, now)!.segments).toEqual([]);
  });

  it('titles a source by its file name', () => {
    expect(titleFromFileName('Тренировка 12.mov')).toBe('Тренировка 12');
    expect(titleFromFileName('.mp4')).toBe('.mp4');
  });
});

describe('clip status', () => {
  const clip = (status: MediaClip['status'], extra: Partial<MediaClip> = {}) =>
    ({ status, exerciseId: 'x', sourceId: 's', startS: 0, ...extra }) as MediaClip;

  it('groups rendering with queued', () => {
    expect(filterOf('rendering')).toBe('queued');
    expect(matchesFilter(clip('rendering'), 'queued')).toBe(true);
    expect(matchesFilter(clip('done'), 'all')).toBe(true);
    expect(matchesFilter(clip('done'), 'failed')).toBe(false);
  });

  it('counts per filter', () => {
    const c = countByFilter([clip('draft'), clip('queued'), clip('rendering'), clip('failed')]);
    expect(c).toEqual({ all: 4, draft: 1, queued: 2, done: 0, failed: 1 });
  });

  it('asks for a label only on unlabelled drafts', () => {
    expect(needsLabel(clip('draft', { exerciseId: null }))).toBe(true);
    expect(needsLabel(clip('draft'))).toBe(false);
    expect(needsLabel(clip('failed', { exerciseId: null }))).toBe(false);
  });

  it('derives drafts per source and orders a source’s clips', () => {
    expect(sourceDrafts({ clips: 5, done: 1, queued: 1, failed: 1 })).toBe(2);
    expect(sourceDrafts({ clips: 1, done: 1, queued: 1, failed: 0 })).toBe(0);
    const list = [
      clip('draft', { id: 'b', startS: 9 }),
      clip('draft', { id: 'a', startS: 1 }),
      clip('draft', { id: 'z', sourceId: 'other' }),
    ];
    expect(clipsOfSource(list, 's').map((c) => c.id)).toEqual(['a', 'b']);
  });
});
