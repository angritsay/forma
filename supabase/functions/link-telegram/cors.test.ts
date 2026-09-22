import { describe, expect, it } from 'vitest';
import { CORS_HEADERS, preflight } from './cors';

describe('preflight', () => {
  /*
   * Тот самый случай, который стоил нам «0 из 17»: обработчик отвечал 405 на `OPTIONS`, браузер
   * получал отказ и не отправлял POST. Проверка ровно на это — на код ответа.
   */
  it('answers OPTIONS instead of refusing it', () => {
    const res = preflight('OPTIONS');
    expect(res).not.toBeNull();
    expect(res!.status).toBe(204);
  });

  it('lets everything else through to the handler', () => {
    expect(preflight('POST')).toBeNull();
    expect(preflight('GET')).toBeNull();
  });

  it('carries the headers the browser needs to see on the answer', () => {
    const res = preflight('OPTIONS')!;
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
    expect(res.headers.get('access-control-allow-methods')).toContain('POST');
  });
});

describe('CORS_HEADERS', () => {
  /*
   * Заголовок, которого нет в списке разрешённых, заворачивает уже сам браузер — и снова молча.
   * `apikey` и `x-client-info` проставляет supabase-js, о них легко забыть: своими руками их никто
   * не пишет, а без них привязка сломается ровно так же незаметно.
   */
  it('allows every header the client actually sends', () => {
    const allowed = CORS_HEADERS['access-control-allow-headers'];
    for (const h of ['authorization', 'content-type', 'apikey', 'x-client-info']) {
      expect(allowed).toContain(h);
    }
  });

  it('keeps the preflight from repeating on every launch', () => {
    expect(Number(CORS_HEADERS['access-control-max-age'])).toBeGreaterThan(0);
  });
});
