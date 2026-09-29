/**
 * The club has no neon — on the site too.
 *
 * `club-no-neon.test.ts` holds the app to it; this is the same rule for the landing's club zone
 * (design/CHANGELOG.md §17, global.css header «Three card treatments»). The site's club surfaces —
 * `ClubTitle`, `ClubDay` and whatever else lays the club out — live in
 * `src/components/landing/club/`, and their main action is `Button variant="gradient"`, their one
 * filled pill `Pill tone="warm"`. The neon is the rest of the site's «now»: workout 1.
 *
 * What paints it on the site, and so what is forbidden here: the landing `Button`'s `primary`
 * variant (and a `<Button>` with no variant at all, which *is* `primary`), the `action` pill tone,
 * the `bg-action` / `text-action` utilities, and `data-neon`, the mark a neon control carries for
 * the sticky bar. Prose in comments may say «neon»; only code counts.
 *
 * Two surfaces outside `club/` wear the club's colours and so obey the same rule: the invite card
 * (`ShareInvite.tsx` — the aurora, the gradient hairline, a gradient «Отправить») and, through
 * `club/TogetherClub.astro`, the «Вдвоём в клубе» block of `/together/`.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SRC = fileURLToPath(new URL('../../', import.meta.url));
const CLUB = join(SRC, 'components/landing/club');
/** Club-coloured surfaces that live outside `club/`. */
const ALSO = [join(SRC, 'components/landing/ShareInvite.tsx')];

function files(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...files(path));
    else if (/\.(astro|tsx?)$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(path);
  }
  return out;
}

const NEON: readonly RegExp[] = [
  /variant=["']primary["']/,
  /variant=\{[^}]*['"]primary['"]/,
  /tone=["']action["']/,
  /tone=\{[^}]*['"]action['"]/,
  /\bbg-action(?:\/\d+)?\b/,
  /\btext-action(?:\/\d+)?\b/,
  /\bdata-neon\b/,
];

/** Comments out, so prose about the neon does not count: block, line, HTML and JSX forms. */
function code(text: string): string {
  return text
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

function offences(file: string, text = readFileSync(file, 'utf8')): string[] {
  const src = code(text);
  const out: string[] = [];
  src.split('\n').forEach((line, i) => {
    for (const re of NEON) {
      if (re.test(line)) out.push(`${relative(SRC, file)}:${i + 1} ${line.trim()}`);
    }
  });
  // A landing Button with no variant is the primary — the neon — by default.
  for (const m of src.matchAll(/<Button\b[^>]*>/g)) {
    if (!/\bvariant=/.test(m[0])) {
      out.push(`${relative(SRC, file)} <Button> without a variant is the neon primary`);
    }
  }
  return out;
}

describe('the site’s club zone has no neon', () => {
  const found = [...files(CLUB), ...ALSO];

  it('finds the club’s components', () => {
    expect(found.some((f) => f.endsWith('ClubTitle.astro'))).toBe(true);
    expect(found.some((f) => f.endsWith('ClubDay.astro'))).toBe(true);
    expect(found.some((f) => f.endsWith('TogetherClub.astro'))).toBe(true);
    expect(found.some((f) => f.endsWith('ShareInvite.tsx'))).toBe(true);
  });

  it('flags the neon’s variants, tones, classes and mark, and only those (the scanner itself)', () => {
    const probe = (src: string) => offences(join(CLUB, 'probe.astro'), src);
    expect(probe(`<Button variant="primary" href="#">x</Button>`)).toHaveLength(1);
    expect(probe(`<Button href="#">x</Button>`)).toHaveLength(1);
    expect(probe(`<Pill tone="action">x</Pill>`)).toHaveLength(1);
    expect(probe(`<span class="bg-action/10 text-on-action">x</span>`)).toHaveLength(1);
    expect(probe(`<a class="text-action" data-neon>x</a>`)).toHaveLength(2);
    expect(probe(`<Button variant="gradient" href="#">x</Button>`)).toHaveLength(0);
    expect(probe(`<Pill tone="warm">x</Pill>`)).toHaveLength(0);
    expect(probe(`<!-- the neon is the rest of the site's --><span class="bg-warm" />`)).toEqual(
      [],
    );
    expect(probe(`/* never bg-action here */ <span class="text-gradient" />`)).toEqual([]);
  });

  it('paints no neon button, pill, fill or mark in src/components/landing/club/', () => {
    expect(found.flatMap((f) => offences(f))).toEqual([]);
  });
});
