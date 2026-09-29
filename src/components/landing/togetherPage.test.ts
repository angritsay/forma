/**
 * `/together/` takes three values from a link other people forward — `d`, `from`, `ref` — and must
 * never let one of them into the HTML the build writes, into markup, or into a preview. The build
 * cannot see a query string anyway; this pins the page's source so it stays that way.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const page = readFileSync(
  fileURLToPath(new URL('../../pages/[...lang]/together.astro', import.meta.url)),
  'utf8',
);
const script = page.slice(page.indexOf('<script>'));

describe('/together/', () => {
  it('never reads the query at build time', () => {
    expect(page).not.toMatch(/Astro\.url|Astro\.request|searchParams/);
  });

  it('writes the link’s values with textContent only', () => {
    expect(page).not.toMatch(/innerHTML|outerHTML|insertAdjacentHTML|set:html|document\.write/);
    expect(script).toContain('eyebrow.textContent =');
    expect(script).toContain("cleanName(query.get('from'))");
    expect(script).toContain("validDate(query.get('d'), now)");
  });

  it('promises the +30 only when this link’s own code is the one waiting', () => {
    expect(script).toContain("referralIsThisLink(query.get('ref'))");
    expect(script).not.toMatch(/activeReferral\(\)\s*!==\s*null/);
  });

  it('puts no name, date or code into an attribute', () => {
    expect(script).not.toMatch(/setAttribute\(/);
  });
});
