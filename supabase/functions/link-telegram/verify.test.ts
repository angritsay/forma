import { describe, expect, it } from 'vitest';
import {
  MAX_AGE_SEC,
  checkInitData,
  dataCheckString,
  digestMatches,
  sign,
  verifyInitData,
} from './verify';

const TOKEN = '1234567890:AAH-test-bot-token';
const NOW = 1_780_000_000;

/** Строка запуска, подписанная тем же способом, каким её подписывает телеграм. */
async function launch(fields: Record<string, string>, token = TOKEN): Promise<string> {
  const params = new URLSearchParams(fields);
  const hash = await sign(params.toString(), token);
  params.set('hash', hash);
  return params.toString();
}

const USER = JSON.stringify({ id: 77123, first_name: 'Настя', username: 'nastia' });

describe('dataCheckString', () => {
  it('sorts the pairs and joins them with newlines', () => {
    const s = dataCheckString(new URLSearchParams('b=2&a=1&c=3'));
    expect(s).toBe('a=1\nb=2\nc=3');
  });

  it('leaves out hash and signature', () => {
    // `signature` is Telegram's own third-party Ed25519 field and is not part of what it signed;
    // including it would break verification on every newer client.
    const s = dataCheckString(new URLSearchParams('a=1&hash=deadbeef&signature=xyz'));
    expect(s).toBe('a=1');
  });

  it('keeps values exactly as the query string decoded them', () => {
    const s = dataCheckString(new URLSearchParams('user=%7B%22id%22%3A1%7D'));
    expect(s).toBe('user={"id":1}');
  });
});

describe('digestMatches', () => {
  it('is true only for identical strings', () => {
    expect(digestMatches('abc', 'abc')).toBe(true);
    expect(digestMatches('abc', 'abd')).toBe(false);
    expect(digestMatches('abc', 'abcd')).toBe(false);
    expect(digestMatches('', '')).toBe(true);
  });
});

describe('verifyInitData', () => {
  it('accepts a launch string the bot token really signed', async () => {
    const initData = await launch({ auth_date: String(NOW), user: USER, query_id: 'A1' });
    await expect(verifyInitData(initData, TOKEN, NOW)).resolves.toEqual({
      userId: 77123,
      authDate: NOW,
    });
  });

  /* Подпись — единственное, что отличает «пришёл из телеграма» от «набрал руками». */
  it('rejects a launch string signed with another bot token', async () => {
    const initData = await launch({ auth_date: String(NOW), user: USER }, 'other:token');
    await expect(verifyInitData(initData, TOKEN, NOW)).resolves.toBeNull();
  });

  it('rejects a tampered user id', async () => {
    const initData = await launch({ auth_date: String(NOW), user: USER });
    const forged = initData.replace(
      encodeURIComponent(USER),
      encodeURIComponent(JSON.stringify({ id: 999, first_name: 'Настя', username: 'nastia' })),
    );
    await expect(verifyInitData(forged, TOKEN, NOW)).resolves.toBeNull();
  });

  it('rejects a launch string with no hash at all', async () => {
    await expect(verifyInitData(`auth_date=${NOW}&user=${USER}`, TOKEN, NOW)).resolves.toBeNull();
  });

  /*
   * Подпись вечна, поэтому у строки есть срок. Строка из лога полугодовой давности проходит
   * проверку подписи ровно так же, как сегодняшняя, — и это единственное, что её останавливает.
   */
  it('rejects a launch string that is too old', async () => {
    const initData = await launch({ auth_date: String(NOW - 3600), user: USER });
    await expect(verifyInitData(initData, TOKEN, NOW)).resolves.toBeNull();
  });

  it('rejects a launch string from the future', async () => {
    const initData = await launch({ auth_date: String(NOW + 3600), user: USER });
    await expect(verifyInitData(initData, TOKEN, NOW)).resolves.toBeNull();
  });

  it('accepts one that is inside the window', async () => {
    const initData = await launch({ auth_date: String(NOW - 300), user: USER });
    await expect(verifyInitData(initData, TOKEN, NOW)).resolves.not.toBeNull();
  });

  it('rejects a correctly signed string with no user in it', async () => {
    const initData = await launch({ auth_date: String(NOW), query_id: 'A1' });
    await expect(verifyInitData(initData, TOKEN, NOW)).resolves.toBeNull();
  });

  it('rejects a correctly signed string whose user is not JSON', async () => {
    const initData = await launch({ auth_date: String(NOW), user: 'не json' });
    await expect(verifyInitData(initData, TOKEN, NOW)).resolves.toBeNull();
  });

  it('rejects a user id that is not a positive whole number', async () => {
    for (const id of [0, -5, 1.5]) {
      const initData = await launch({ auth_date: String(NOW), user: JSON.stringify({ id }) });
      await expect(verifyInitData(initData, TOKEN, NOW)).resolves.toBeNull();
    }
  });

  it('answers null rather than throwing on empty input', async () => {
    await expect(verifyInitData('', TOKEN, NOW)).resolves.toBeNull();
    await expect(verifyInitData('a=1', '', NOW)).resolves.toBeNull();
  });

  /* Телеграм шлёт hex в нижнем регистре, но сравнение не должно зависеть от этого. */
  it('accepts an upper-case hash', async () => {
    const initData = await launch({ auth_date: String(NOW), user: USER });
    const upper = initData.replace(/hash=([0-9a-f]+)/, (_, h: string) => `hash=${h.toUpperCase()}`);
    await expect(verifyInitData(upper, TOKEN, NOW)).resolves.not.toBeNull();
  });
});

describe('checkInitData', () => {
  /*
   * Ради этого всё и затевалось: отказ должен называть себя. Одно слово «не верю» на все причины
   * стоило часов гадания на пустом журнале — «подпись не та» и «строка просрочена» выглядели
   * одинаково, а чинятся совершенно по-разному.
   */
  it('names the signature when the token is not the right bot', async () => {
    const res = await checkInitData(await launch({ user: USER, auth_date: String(NOW) }), 'другой');
    expect(res.ok).toBe(false);
    expect(res.ok === false && res.reason).toBe('signature');
  });

  it('names staleness, and says how stale, when the signature is fine', async () => {
    const data = await launch({ user: USER, auth_date: String(NOW) });
    const res = await checkInitData(data, TOKEN, NOW + MAX_AGE_SEC + 61);
    expect(res.ok).toBe(false);
    expect(res.ok === false && res.reason).toBe('stale');
    expect(res.ok === false && res.ageSec).toBe(MAX_AGE_SEC + 61);
  });

  it('tells a missing hash from a wrong one', async () => {
    const res = await checkInitData(`user=${encodeURIComponent(USER)}&auth_date=${NOW}`, TOKEN);
    expect(res.ok === false && res.reason).toBe('no-hash');
  });

  it('hands back the data when everything checks out', async () => {
    const data = await launch({ user: USER, auth_date: String(NOW) });
    const res = await checkInitData(data, TOKEN, NOW + 5);
    expect(res.ok).toBe(true);
    expect(res.ok === true && res.data.userId).toBe(77123);
  });
});
