import { afterEach, describe, expect, it, vi } from 'vitest';

const links = vi.hoisted(() => ({ telegramMiniApp: '' }));
vi.mock('@content/site/links', () => ({ LINKS: links }));

const { referralUrl } = await import('./link');

afterEach(() => {
  links.telegramMiniApp = '';
});

describe('referralUrl', () => {
  it('points to the together page in the person’s language, with the code and the name', () => {
    const ru = new URL(referralUrl('abcd1234', 'Настя Иванова', 'ru'));
    expect(ru.pathname).toMatch(/\/together\/$/);
    expect(ru.pathname).not.toMatch(/\/en\//);
    expect(ru.searchParams.get('ref')).toBe('abcd1234');
    expect(ru.searchParams.get('from')).toBe('Настя');
    expect(ru.searchParams.has('d')).toBe(false);

    const en = new URL(referralUrl('abcd1234', null, 'en'));
    expect(en.pathname).toMatch(/\/en\/together\/$/);
    expect(en.searchParams.has('from')).toBe(false);
  });

  it('never carries a name that is not a name', () => {
    const url = new URL(referralUrl('abcd1234', '<script>', 'ru'));
    expect(url.searchParams.has('from')).toBe(false);
  });

  it('keeps the Mini App link once there is one', () => {
    links.telegramMiniApp = 'https://t.me/forma_training_bot/app';
    expect(referralUrl('abcd1234', 'Настя', 'ru')).toBe(
      'https://t.me/forma_training_bot/app?startapp=ref_abcd1234',
    );
  });
});
