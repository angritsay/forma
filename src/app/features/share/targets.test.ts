import { describe, expect, it } from 'vitest';
import {
  instagramRoute,
  shareTargets,
  storyCaption,
  storyFileName,
  telegramShareUrl,
  type ShareEnv,
} from './targets';

const web: ShareEnv = {
  fileShare: false,
  telegram: false,
  storyApi: false,
  downloadApi: false,
  publicUploads: true,
};
const tgNew: ShareEnv = { ...web, telegram: true, storyApi: true, downloadApi: true };

describe('share targets', () => {
  it('on a desktop browser: download for Instagram and to save; no Telegram Stories', () => {
    expect(shareTargets(web)).toEqual(['instagram', 'telegramChat', 'save', 'more']);
    expect(instagramRoute(web)).toBe('download');
  });

  it('on a phone browser the system sheet carries Instagram', () => {
    expect(instagramRoute({ ...web, fileShare: true })).toBe('share');
  });

  it('in a current Telegram: everything, Instagram through the gallery', () => {
    expect(shareTargets(tgNew)).toEqual([
      'instagram',
      'telegramStory',
      'telegramChat',
      'save',
      'more',
    ]);
    expect(instagramRoute(tgNew)).toBe('telegramDownload');
  });

  it('in an old Telegram without file sharing: only the chat and the text', () => {
    const old = { ...tgNew, storyApi: false, downloadApi: false };
    expect(shareTargets(old)).toEqual(['telegramChat', 'more']);
  });

  it('in the demo: no public URL, so no Telegram Stories and no Telegram download', () => {
    const demo = { ...tgNew, publicUploads: false };
    expect(shareTargets(demo)).toEqual(['telegramChat', 'more']);
    expect(shareTargets({ ...demo, fileShare: true })).toEqual([
      'instagram',
      'telegramChat',
      'more',
    ]);
  });
});

describe('share strings', () => {
  it('builds Telegram’s share link', () => {
    expect(telegramShareUrl('https://x.co/a b', 'Готово & всё')).toBe(
      'https://t.me/share/url?url=https%3A%2F%2Fx.co%2Fa%20b&text=%D0%93%D0%BE%D1%82%D0%BE%D0%B2%D0%BE%20%26%20%D0%B2%D1%81%D1%91',
    );
  });

  it('caps a story caption at 200 characters', () => {
    expect(storyCaption('a'.repeat(250))).toHaveLength(200);
    expect(storyCaption('short')).toBe('short');
  });

  it('names the file after the session and the design', () => {
    expect(storyFileName('0f1e-22', 'neon')).toBe('0f1e-22-neon.png');
    expect(storyFileName('2026-09-25T10:00:00.000Z', 'warm')).toMatch(/^[a-z0-9]+-warm\.png$/);
  });
});
