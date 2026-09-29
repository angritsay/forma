import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { AUTH_EMAIL_KEY } from './StartForm';

describe('StartForm', () => {
  it('writes the key AuthScreen reads, without importing the app into the island', () => {
    const auth = readFileSync(
      fileURLToPath(new URL('../../app/screens/AuthScreen.tsx', import.meta.url)),
      'utf8',
    );
    expect(auth).toContain(`export const AUTH_EMAIL_KEY = '${AUTH_EMAIL_KEY}';`);
  });

  it('stays free of the Supabase client', () => {
    const src = readFileSync(fileURLToPath(new URL('./StartForm.tsx', import.meta.url)), 'utf8');
    expect(src).not.toMatch(/from ['"]@\/lib\/api|@supabase/);
  });

  it('never submits the address natively: the input has no name, the action is the app', () => {
    const src = readFileSync(fileURLToPath(new URL('./StartForm.tsx', import.meta.url)), 'utf8');
    expect(src).not.toMatch(/name="email"/);
    expect(src).toContain('action={appUrl}');
  });
});
