import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { headline, migrationFiles } from './bundle.mjs';

describe('migrationFiles', () => {
  it('orders by filename, byte for byte, and puts the two 0027s the same way every time', () => {
    const names = ['0027_telegram_outbox.sql', '0010_x.sql', '0027_proof_review.sql', '0002_y.sql'];
    expect(migrationFiles(names)).toEqual([
      '0002_y.sql',
      '0010_x.sql',
      '0027_proof_review.sql',
      '0027_telegram_outbox.sql',
    ]);
    expect(migrationFiles([...names].reverse())).toEqual(migrationFiles(names));
  });

  it('leaves out the course import and anything that is not a migration', () => {
    expect(migrationFiles(['0009_course_import.sql', 'README.md', '0001_init.sql'])).toEqual([
      '0001_init.sql',
    ]);
  });

  /*
   * The hand-kept list stopped at 0012 while the migrations reached 0043. The bundle must carry
   * every migration in the directory but one.
   */
  it('bundles every migration in the directory, and the generated file is current', () => {
    const all = readdirSync('supabase/migrations').filter((n) => n.endsWith('.sql'));
    const files = migrationFiles(all);
    expect(files).toHaveLength(all.length - 1);
    const bundle = readFileSync('supabase/setup-all.sql', 'utf8');
    for (const name of files) {
      const header = new RegExp(`^-- ${name.replace(/\./g, '\\.')}( — |$)`, 'm');
      expect(
        header.test(bundle),
        `${name} is missing from setup-all.sql — run npm run db:bundle`,
      ).toBe(true);
    }
  });
});

describe('headline', () => {
  it('reads the second header line, without the number', () => {
    expect(headline('-- ===\n-- 0034 — пары в дуо-клубе.\n')).toBe('пары в дуо-клубе.');
    expect(headline('-- ===\n-- Forma — 0001_init: extensions, tables.\n')).toBe(
      'extensions, tables.',
    );
    expect(headline('-- ===\n-- admin_people — everybody.\n')).toBe('admin_people — everybody.');
    expect(headline('')).toBe('');
  });
});
