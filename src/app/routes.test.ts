/**
 * Every destination the app links to must be a route the router actually declares.
 *
 * This exists because it did not: the course builder shipped with its screens written, its side-nav
 * entries added and its `<Route>` elements missing, so clicking "Конструктор курсов" fell through
 * to the catch-all and landed on the home screen. Nothing failed — not the type check, not the
 * build, not a unit test — because a `to=` string and a `path=` string never have to agree.
 *
 * Both sides are read out of the source rather than imported, because the router is JSX and the
 * nav tables are module-private. That is coarse, but it is exactly the coupling that broke.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(process.cwd(), 'src', 'app');
const read = (p: string) => readFileSync(join(SRC, p), 'utf8');

/** Every `path="…"` on a <Route>, plus `/` for the index route. */
function declaredRoutes(): string[] {
  const src = read('router.tsx');
  const paths = [...src.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]!);
  if (/<Route\s+index\b/.test(src)) paths.push('/');
  return paths;
}

/** Every `to: '…'` in a nav table. */
function navTargets(file: string): string[] {
  return [...read(file).matchAll(/\bto:\s*'([^']+)'/g)].map((m) => m[1]!);
}

/** Does a concrete path match a route pattern, treating `:param` as one segment and `*` as any? */
function matches(pattern: string, path: string): boolean {
  if (pattern === '*') return false; // the catch-all is the bug, never the answer
  const rx = new RegExp(
    `^${pattern
      .replace(/\/\*$/, '(?:/.*)?')
      .replace(/:[^/]+/g, '[^/]+')
      .replace(/\//g, '\\/')}$`,
  );
  return rx.test(path);
}

describe('navigation targets', () => {
  const routes = declaredRoutes();

  it('finds the routes and the nav tables at all', () => {
    // Guards the regexes above: a refactor that renames or reformats these files should fail here
    // loudly rather than quietly asserting nothing.
    expect(routes.length).toBeGreaterThan(10);
    expect(navTargets('components/SideNav.tsx').length).toBeGreaterThan(4);
    expect(navTargets('components/BottomNav.tsx').length).toBeGreaterThan(2);
  });

  for (const file of ['components/SideNav.tsx', 'components/BottomNav.tsx']) {
    it(`every destination in ${file} is a declared route`, () => {
      for (const to of navTargets(file)) {
        expect(
          routes.some((r) => matches(r, to)),
          `${file} links to "${to}", which no <Route> in router.tsx declares`,
        ).toBe(true);
      }
    });
  }

  it('declares a route for every registered screen name that is reachable by path', () => {
    // A screen in the registry with no route is dead weight; one is usually half-finished wiring.
    const registry = read('screens/registry.ts');
    const names = [...registry.matchAll(/'([A-Za-z]+Screen)'/g)].map((m) => m[1]!);
    const router = read('router.tsx');
    for (const name of names) {
      expect(router.includes(`name="${name}"`), `${name} is registered but never routed`).toBe(
        true,
      );
    }
  });
});
