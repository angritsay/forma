import { describe, expect, it } from 'vitest';
import type { MediaClip } from '@/lib/api/mediaStudio';
import { allowedStep, currentStep, openSteps, studioStepPath } from './flow';
import { previewPlayback, stillDefault } from './playMode';

type C = Pick<MediaClip, 'exerciseId' | 'status'>;
const named = (status: MediaClip['status'] = 'draft'): C => ({ exerciseId: 'squat', status });
const unnamed: C = { exerciseId: null, status: 'draft' };

describe('studio steps', () => {
  it('opens names with one clip, colour and preview once every clip has an exercise', () => {
    expect(openSteps([])).toEqual({ cut: true, name: false, color: false, preview: false });
    expect(openSteps([named(), unnamed])).toEqual({
      cut: true,
      name: true,
      color: false,
      preview: false,
    });
    expect(openSteps([named(), named()])).toEqual({
      cut: true,
      name: true,
      color: true,
      preview: true,
    });
  });

  it('sends a closed step to the furthest open one before it', () => {
    expect(allowedStep('preview', [])).toBe('cut');
    expect(allowedStep('color', [unnamed])).toBe('name');
    expect(allowedStep('preview', [named()])).toBe('preview');
  });

  it('links a source to the step it is at', () => {
    expect(currentStep([])).toBe('cut');
    expect(currentStep([named(), unnamed])).toBe('name');
    expect(currentStep([named(), named('done')])).toBe('color');
    expect(currentStep([named('queued'), named('done')])).toBe('preview');
    expect(currentStep([named('failed')])).toBe('color');
  });

  it('builds the step address, with the clip open', () => {
    expect(studioStepPath('s1', 'name')).toBe('/admin/studio/s/s1/name');
    expect(studioStepPath('s1', 'color', 'c 1')).toBe('/admin/studio/s/s1/color?clip=c%201');
  });
});

describe('play modes on screen', () => {
  it('previews a loop round, once held, a still on its frame', () => {
    expect(previewPlayback('loop')).toBe('loop');
    expect(previewPlayback('once')).toBe('once');
    expect(previewPlayback('still')).toBe('hold');
  });

  it('chooses the worker’s 45% as the default still frame', () => {
    expect(stillDefault(10)).toBe(4.5);
    expect(stillDefault(3.333)).toBe(1.5);
    expect(stillDefault(Number.NaN)).toBe(0);
  });
});
