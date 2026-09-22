import { describe, expect, it } from 'vitest';
import { AppError, toAppError } from '@/lib/api/errors';
import type { Translator } from '@/app/hooks/useT';
import { adminErrorTitle } from './adminError';

/** Переводчик, который возвращает ключ и подставленные параметры: текст здесь не проверяется. */
const tr = {
  t: (key: string, params?: Record<string, string | number>) =>
    params ? `${key}|${Object.values(params).join(',')}` : key,
} as unknown as Translator;

describe('adminErrorTitle', () => {
  /*
   * Тот самый случай, ради которого всё и написано: код уехал в прод мержем, миграция ещё не
   * применена, постгрест отвечает `PGRST204` с именем колонки. Тренер видел «Не удалось
   * сохранить» и не мог знать, что нажать.
   */
  it('names the column and the button when the database is behind', () => {
    const e = toAppError({
      code: 'PGRST204',
      message: "Could not find the 'title_en' column of 'custom_workouts' in the schema cache",
      details: null,
      hint: null,
    });
    expect(e.code).toBe('schema');
    const text = adminErrorTitle(tr, e, 'app.builderSaveError');
    expect(text).toContain('app.adminSchemaBehind');
    expect(text).toContain('title_en');
  });

  /*
   * Та же беда, но замеченная самим постгресом, а не кешем схемы постгреста.
   *
   * `details` в фикстуре обязателен, и это не формальность: по нему ошибка и опознаётся как
   * пришедшая от постгреста (`isPostgrestLike`). Первая версия этого теста его не положила и
   * падала — то есть проверяла не то, что бывает в жизни.
   */
  it('treats an undefined column from postgres the same way', () => {
    const pg = (code: string, message: string) => ({ code, message, details: null, hint: null });
    expect(toAppError(pg('42703', 'column x does not exist')).code).toBe('schema');
    expect(toAppError(pg('42P01', 'relation y does not exist')).code).toBe('schema');
  });

  /*
   * Всё остальное остаётся своей фразой экрана. «Не удалось удалить» и «не удалось сохранить» —
   * разные вещи, и заменить их общим текстом значило бы потерять то немногое, что уже говорилось.
   */
  it('keeps each screen its own sentence for everything else', () => {
    for (const e of [
      new AppError('network', 'offline'),
      new AppError('validation', 'bad'),
      new AppError('unknown', 'boom'),
      'not an error at all',
    ]) {
      expect(adminErrorTitle(tr, e, 'app.builderDeleteError')).toBe('app.builderDeleteError');
    }
  });
});
