/**
 * The club has no neon (global.css header «Three card treatments», design/CHANGELOG.md §17).
 *
 * Owner: «в клубе — градиент и цвета, связанные с ним». The club's main action is the warm half
 * of its gradient under ink (`Button`/`LinkButton` `gradient`), its one filled pill is `warm`,
 * the leader's circle is the gradient, today's dot on the streak is orange. The neon — the
 * `action` variant, the `neon` pill, `bg-action` — is the rest of the app's «now», and on a
 * member's club screen it would be a second colour claiming the same job as the gradient.
 *
 * Enforced by grep rather than by review: every `.tsx` under `src/app/features/marathon/` except
 * the admin's tools (`admin/`, `Admin*Screen` — the coach's panel is a tool and keeps the neon)
 * and the two club screens. Prose in comments is allowed to say «neon»; only the classes and
 * props that paint it are not.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SRC = fileURLToPath(new URL('../../', import.meta.url));
const CLUB = join(SRC, 'app/features/marathon');
const SCREENS = ['MarathonScreen.tsx', 'MarathonBoardScreen.tsx'].map((f) =>
  join(SRC, 'app/screens', f),
);

function tsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (name !== 'admin') out.push(...tsxFiles(path));
    } else if (path.endsWith('.tsx') && !/^Admin.*Screen\.tsx$/.test(basename(path))) {
      out.push(path);
    }
  }
  return out;
}

/** What paints the neon: the button variant, the pill tone, the fill utility (and its alphas). */
const NEON = [
  /variant=["']action["']/,
  /variant=\{[^}]*['"]action['"]/,
  /tone=["']neon["']/,
  /tone=\{[^}]*['"]neon['"]/,
  /\bbg-action(?:\/\d+)?\b/,
];

function offences(file: string, text = readFileSync(file, 'utf8')): string[] {
  // Strip block and line comments so prose about the neon does not count.
  const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const out: string[] = [];
  code.split('\n').forEach((line, i) => {
    for (const re of NEON) {
      if (re.test(line)) out.push(`${relative(SRC, file)}:${i + 1} ${line.trim()}`);
    }
  });
  return out;
}

describe('the club has no neon', () => {
  const files = [...tsxFiles(CLUB), ...SCREENS];

  it('finds the club’s files and leaves the admin’s tools alone', () => {
    expect(files.length).toBeGreaterThan(5);
    expect(files.some((f) => f.endsWith('TaskCard.tsx'))).toBe(true);
    expect(files.some((f) => f.includes(`${join('marathon', 'admin')}`))).toBe(false);
  });

  it('flags the neon’s classes and props, and only those (the scanner itself)', () => {
    const probe = (jsx: string) => offences(join(SRC, 'probe.tsx'), jsx);
    expect(probe(`<Button variant="action" />`)).toHaveLength(1);
    expect(probe(`<Button variant={x ? 'secondary' : 'action'} />`)).toHaveLength(1);
    expect(probe(`<Pill tone="neon" />`)).toHaveLength(1);
    expect(probe(`<span className="bg-action/10" />`)).toHaveLength(1);
    expect(probe(`<Button variant="gradient" /> /* the neon is the app's */`)).toHaveLength(0);
    expect(probe(`<Pill tone="warm" />`)).toHaveLength(0);
    expect(probe(`<span className="bg-warm text-ink" />`)).toHaveLength(0);
  });

  it('paints no neon button, pill or fill on a member’s club screen', () => {
    expect(files.flatMap((f) => offences(f))).toEqual([]);
  });
});
