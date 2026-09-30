/**
 * The course editor's autosave when a write fails (0059): the patch comes back instead of being
 * dropped, writes go one at a time, and a patch keeps the day it was written for.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { t } from '@/i18n/index';
import { combineSaveStates, SaveStatus } from './SaveStatus';
import { SaveQueue, type SaveState } from './useAutosave';

type Patch = Record<string, string>;

function recorder() {
  const states: SaveState[] = [];
  const queue = new SaveQueue<Patch>((s) => states.push(s));
  return { states, queue };
}

describe('SaveQueue', () => {
  it('puts a failed patch back and sends it with the next save', async () => {
    const { states, queue } = recorder();
    const sent: Patch[] = [];
    let fail = true;
    const save = async (p: Patch) => {
      if (fail) throw new Error('offline');
      sent.push(p);
    };

    queue.push({ name: 'Старт' }, save);
    expect(await queue.run()).toBe(false);
    expect(states.at(-1)).toBe('error');
    expect(queue.pending).toBe(true);

    // Typed since: merged over the restored patch, the newer value winning.
    queue.push({ tagline: 'для новичков' }, save);
    fail = false;
    expect(await queue.run()).toBe(true);
    expect(sent).toEqual([{ name: 'Старт', tagline: 'для новичков' }]);
    expect(states.at(-1)).toBe('saved');
    expect(queue.pending).toBe(false);
  });

  it('lets a newer value win over the restored one', async () => {
    const { queue } = recorder();
    const sent: Patch[] = [];
    let calls = 0;
    const save = async (p: Patch) => {
      calls += 1;
      if (calls === 1) {
        // While the first write is in flight the coach types again.
        queue.push({ name: 'новое' }, save);
        throw new Error('500');
      }
      sent.push(p);
    };
    queue.push({ name: 'старое', tagline: 'x' }, save);
    expect(await queue.run()).toBe(false);
    expect(await queue.run()).toBe(true);
    expect(sent).toEqual([{ name: 'новое', tagline: 'x' }]);
  });

  it('sends one write at a time, in order', async () => {
    const { queue } = recorder();
    const log: string[] = [];
    let release!: () => void;
    const slow = (p: Patch) =>
      new Promise<void>((resolve) => {
        log.push(`start ${p.v}`);
        release = () => {
          log.push(`end ${p.v}`);
          resolve();
        };
      });

    queue.push({ v: '1' }, slow);
    const first = queue.run();
    queue.push({ v: '2' }, slow);
    const second = queue.run();
    await Promise.resolve();
    expect(log).toEqual(['start 1']);
    release();
    await new Promise((r) => setTimeout(r, 0));
    // The second starts only after the first ended.
    expect(log).toEqual(['start 1', 'end 1', 'start 2']);
    release();
    expect(await first).toBe(true);
    expect(await second).toBe(true);
    expect(log).toEqual(['start 1', 'end 1', 'start 2', 'end 2']);
  });

  it('keeps each patch with the day it was written for', async () => {
    const { queue } = recorder();
    const written: string[] = [];
    const day3 = async (p: Patch) => void written.push(`3:${p.title}`);
    const day4 = async (p: Patch) => void written.push(`4:${p.title}`);
    queue.push({ title: 'a' }, day3);
    queue.push({ title: 'b' }, day4);
    expect(await queue.run()).toBe(true);
    expect(written).toEqual(['3:a', '4:b']);
  });
});

describe('SaveStatus', () => {
  const render = (state: SaveState) =>
    renderToStaticMarkup(createElement(SaveStatus, { state, onRetry: () => {} }));

  it('says a failed save with a retry', () => {
    const html = render('error');
    expect(html).toContain('role="alert"');
    expect(html).toContain(t('ru', 'app.courseSaveFailed'));
    expect(html).toContain(t('ru', 'common.retry'));
  });

  it('says saving and saved, and nothing before the first edit', () => {
    expect(render('saving')).toContain(t('ru', 'app.courseSaving'));
    expect(render('saved')).toContain(t('ru', 'app.courseSaved'));
    expect(render('idle')).toBe('');
  });

  it('reads two savers as one, a failure first', () => {
    expect(combineSaveStates('saved', 'error')).toBe('error');
    expect(combineSaveStates('saving', 'saved')).toBe('saving');
    expect(combineSaveStates('idle', 'saved')).toBe('saved');
    expect(combineSaveStates('idle', 'idle')).toBe('idle');
  });
});
