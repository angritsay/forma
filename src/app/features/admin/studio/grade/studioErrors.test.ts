import { describe, expect, it } from 'vitest';
import { AppError } from '@/lib/api/errors';
import { mediaErrorProblem, studioErrorKey, workerErrorText } from './studioErrors';

const FALLBACK = 'app.studioSaveError' as const;

describe('studioErrorKey', () => {
  it('names the network, rights and a busy clip', () => {
    expect(studioErrorKey(new AppError('network', 'offline'), FALLBACK)).toBe(
      'app.studioErrNetwork',
    );
    expect(studioErrorKey(new AppError('forbidden', 'forbidden'), FALLBACK)).toBe(
      'app.studioErrPermission',
    );
    expect(studioErrorKey(new AppError('auth', 'not_signed_in'), FALLBACK)).toBe(
      'app.studioErrPermission',
    );
    expect(studioErrorKey(new AppError('validation', 'clip_busy'), FALLBACK)).toBe(
      'app.studioErrBusy',
    );
  });

  it('maps every server message of the contract', () => {
    for (const m of [
      'invalid_crop',
      'invalid_grade',
      'invalid_span',
      'invalid_raw_path',
      'unknown_exercise',
      'unknown_source',
      'clip_conflict',
      'not_found',
      'invalid_title',
      'invalid_duration',
      'too_many',
      'invalid_id',
    ]) {
      expect(studioErrorKey(new AppError('validation', m), FALLBACK)).not.toBe(FALLBACK);
    }
    expect(studioErrorKey(new AppError('not_found', 'not_found'), FALLBACK)).toBe(
      'app.studioErrNotFound',
    );
  });

  it('keeps the screen line for anything else, and hands a lagging database on', () => {
    expect(studioErrorKey(new AppError('unknown', 'boom'), FALLBACK)).toBe(FALLBACK);
    expect(studioErrorKey(new Error('x'), FALLBACK)).toBe(FALLBACK);
    expect(studioErrorKey(new AppError('schema', 'column x'), FALLBACK)).toBeNull();
  });
});

describe('workerErrorText', () => {
  it('turns known worker codes into a sentence', () => {
    expect(workerErrorText('raw_missing')).toEqual({
      key: 'app.studioWorkerRawMissing',
      detail: null,
    });
    expect(workerErrorText('ffmpeg_timeout').key).toBe('app.studioWorkerTimeout');
  });

  it('shows an unknown error as it is, cut short', () => {
    const t = workerErrorText('Invalid data found when processing input');
    expect(t.key).toBe('app.studioWorkerFailed');
    expect(t.detail).toBe('Invalid data found when processing input');
    expect(workerErrorText('x'.repeat(500)).detail).toHaveLength(200);
    expect(workerErrorText(null)).toEqual({ key: 'app.studioWorkerFailed', detail: null });
  });
});

describe('mediaErrorProblem', () => {
  it('reads a MediaError code', () => {
    expect(mediaErrorProblem(1)).toBe('network');
    expect(mediaErrorProblem(2)).toBe('network');
    expect(mediaErrorProblem(3)).toBe('decode');
    expect(mediaErrorProblem(4)).toBe('unsupported');
    expect(mediaErrorProblem(undefined)).toBe('unsupported');
  });
});
