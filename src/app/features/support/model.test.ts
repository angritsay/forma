import { describe, expect, it } from 'vitest';
import { AppError } from '@/lib/api/errors';
import { checkSupportText, SUPPORT_MAX, supportErrorKey, supportLength } from './model';

describe('checkSupportText', () => {
  it('refuses an empty message, spaces included', () => {
    expect(checkSupportText('')).toEqual({ ok: false, reason: 'empty' });
    expect(checkSupportText('   \n\t ')).toEqual({ ok: false, reason: 'empty' });
  });

  it('sends the text trimmed', () => {
    expect(checkSupportText('  Можно ли с больным коленом?\n')).toEqual({
      ok: true,
      text: 'Можно ли с больным коленом?',
    });
  });

  /* Та же граница, что у support_message в 0042: тысяча — можно, тысяча один — нет. */
  it('holds the same cap as the server', () => {
    expect(checkSupportText('а'.repeat(SUPPORT_MAX)).ok).toBe(true);
    expect(checkSupportText('а'.repeat(SUPPORT_MAX + 1))).toEqual({
      ok: false,
      reason: 'too_long',
    });
  });

  /* Postgres считает символы, а не половинки UTF-16: эмодзи — один символ, и у нас тоже. */
  it('counts an emoji as one character, as Postgres does', () => {
    expect(supportLength('💪💪')).toBe(2);
    expect(checkSupportText('💪'.repeat(SUPPORT_MAX)).ok).toBe(true);
  });
});

describe('supportErrorKey', () => {
  it('turns the server’s words into sentences', () => {
    expect(supportErrorKey(new AppError('validation', 'rate_limited'))).toBe(
      'app.supportErrorRate',
    );
    expect(supportErrorKey(new AppError('validation', 'text_too_long'))).toBe(
      'app.supportErrorLong',
    );
    expect(supportErrorKey(new AppError('validation', 'text_empty'))).toBe('app.supportErrorEmpty');
  });

  it('says what kind of failure it was, never a code', () => {
    expect(supportErrorKey(new AppError('network', 'Failed to fetch'))).toBe(
      'app.supportErrorNetwork',
    );
    expect(supportErrorKey(new AppError('auth', 'not_signed_in'))).toBe('app.supportErrorAuth');
    // The function is not in the database yet (migration not applied): a plain «не получилось».
    expect(supportErrorKey(new AppError('unknown', 'PGRST202'))).toBe('app.supportError');
    expect(supportErrorKey('boom')).toBe('app.supportError');
  });
});
