/**
 * The semantic colour map, enforced where prose cannot be (global.css header, design/CHANGELOG.md
 * §15).
 *
 * Two kinds of promise live here:
 *
 *   1. **Registry** — the pairs the map hands out (the difficulty scale, the pill tones, the key
 *      word on the photo scrim) clear WCAG: text ≥ 4.5:1, a graphic or an icon ≥ 3:1 (1.4.11).
 *   2. **Usage** — no emoji is laid on a saturated fill. An emoji brings its own colours, and on
 *      orange, neon, the blues or the club's gradient half of them vanish: the screenshot that
 *      started the map was a green 🌿 inside an orange disc. The scan walks every `.tsx` under
 *      `src/`, finds each emoji (a literal one, or an expression that names one — `emoji`, `medal`),
 *      and fails when the nearest enclosing element that sets a background sets a saturated one.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { COLOUR, DIFFICULTY_COLOUR, EMOJI_PLATES, SATURATED_FILL_CLASSES } from './semantic';
import { APP_BG, contrast, tileInk } from './tile';

const TEXT = 4.5;
const GRAPHIC = 3;

const css = readFileSync(new URL('../../styles/global.css', import.meta.url), 'utf8');
const token = (name: string) =>
  new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`).exec(css)?.[1]?.toLowerCase();

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const hex = (c: number[]) =>
  `#${c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
/** `over` at alpha `a` composited on `under`, both opaque sRGB. */
const composite = (under: string, over: string, a: number) =>
  hex(rgb(under).map((u, i) => u * (1 - a) + rgb(over)[i]! * a));

describe('the semantic colour map — registry', () => {
  it('draws every difficulty bar at ≥ 3:1 on its track and on the sheet', () => {
    for (const [choice, hex] of Object.entries(DIFFICULTY_COLOUR)) {
      expect(contrast(hex, COLOUR.surface3), `${choice} on track`).toBeGreaterThanOrEqual(GRAPHIC);
      expect(contrast(hex, COLOUR.surface), `${choice} on sheet`).toBeGreaterThanOrEqual(GRAPHIC);
    }
  });

  it('keeps the three difficulties apart: lighter light blue, ordinary white, harder orange', () => {
    expect(DIFFICULTY_COLOUR.easier).toBe(COLOUR.accent);
    expect(DIFFICULTY_COLOUR.normal).toBe(COLOUR.text);
    expect(DIFFICULTY_COLOUR.harder).toBe(COLOUR.effort);
    expect(new Set(Object.values(DIFFICULTY_COLOUR)).size).toBe(3);
  });

  it('gives every filled pill tone its ink at ≥ 4.5:1', () => {
    const pills: Record<string, [fill: string, ink: string]> = {
      neon: [COLOUR.action, COLOUR.ink],
      orange: [COLOUR.effort, COLOUR.ink],
      ciel: [COLOUR.coach, COLOUR.ink],
      sky: [COLOUR.accent, COLOUR.ink],
      white: ['#ffffff', COLOUR.field],
      ghost: [COLOUR.field, '#ffffff'],
    };
    for (const [tone, [fill, ink]] of Object.entries(pills)) {
      expect(contrast(fill, ink), tone).toBeGreaterThanOrEqual(TEXT);
      expect(tileInk(fill) === ink || fill === '#ffffff' || fill === COLOUR.field, tone).toBe(true);
    }
  });

  it('keeps a neon pill visible as a shape on every ground it is laid on', () => {
    for (const ground of [COLOUR.ground, COLOUR.surface, COLOUR.surface2, COLOUR.field]) {
      expect(contrast(COLOUR.action, ground), ground).toBeGreaterThanOrEqual(GRAPHIC);
    }
  });

  it('keeps a selected chip (light blue, ink words) at ≥ 4.5:1 and visible on the surfaces', () => {
    expect(contrast(COLOUR.accent, COLOUR.ink)).toBeGreaterThanOrEqual(TEXT);
    for (const ground of [COLOUR.ground, COLOUR.surface, COLOUR.surface2]) {
      expect(contrast(COLOUR.accent, ground), ground).toBeGreaterThanOrEqual(GRAPHIC);
    }
  });

  it('reads white and the light-blue key word on the photo scrim over a white frame', () => {
    // NodePreviewScreen: 0.82 of the ground (`rgba(var(--bg-rgb), .82)`) over pure white — sRGB
    // 61 on graphite. Derived from APP_BG so the model follows the ground.
    const worst = composite('#ffffff', APP_BG, 0.82);
    expect(contrast('#ffffff', worst)).toBeGreaterThanOrEqual(TEXT);
    expect(contrast(COLOUR.accent, worst)).toBeGreaterThanOrEqual(TEXT);
  });

  it('names the same ground as tile.ts and global.css', () => {
    expect(COLOUR.ground).toBe(APP_BG);
    expect(COLOUR.surface).toBe(token('surface'));
    expect(COLOUR.surface2).toBe(token('surface-2'));
    expect(COLOUR.surface3).toBe(token('surface-3'));
  });

  it('reads the effort orange and the «now» neon as type on graphite', () => {
    expect(contrast(COLOUR.effort, COLOUR.ground)).toBeGreaterThanOrEqual(TEXT);
    expect(contrast(COLOUR.action, COLOUR.ground)).toBeGreaterThanOrEqual(TEXT);
    // Electric blue is a surface only: it never passes as type on graphite.
    expect(contrast(COLOUR.field, COLOUR.ground)).toBeLessThan(GRAPHIC);
  });

  it('puts white and the light blue on the blue field at ≥ 4.5:1', () => {
    expect(contrast('#ffffff', COLOUR.field)).toBeGreaterThanOrEqual(TEXT);
    expect(contrast(COLOUR.accent, COLOUR.field)).toBeGreaterThanOrEqual(TEXT);
  });

  it('offers only neutral plates for an emoji', () => {
    for (const plate of EMOJI_PLATES) {
      // A neutral: no channel stands more than a hair apart from the others.
      const [r, g, b] = rgb(plate);
      expect(Math.max(r!, g!, b!) - Math.min(r!, g!, b!), plate).toBeLessThanOrEqual(4);
    }
  });
});

/*
 * Glass on plates (global.css, the glass block; design/CHANGELOG.md §16). A `Card` is a gradient
 * of `--surface` at .55–.80 over whatever is behind it, a tab bar a gradient of the ground at
 * .62–.96 over whatever is scrolling. The alphas are read from the stylesheet, so retuning the
 * material re-measures it.
 */
describe('the semantic colour map — glass', () => {
  const alphas = (cls: string) => {
    const block = new RegExp(`\\.${cls}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? '';
    return {
      from: Number(/--glass-from:\s*([0-9.]+)/.exec(block)?.[1]),
      to: Number(/--glass-to:\s*([0-9.]+)/.exec(block)?.[1]),
      tint: /--glass-tint:\s*var\(--([a-z-]+)-rgb\)/.exec(block)?.[1],
    };
  };

  it('finds the plate and the capsule in the stylesheet', () => {
    expect(alphas('glass-card').tint).toBe('surface');
    expect(alphas('glass-card').from).toBeGreaterThan(0);
    expect(alphas('glass-capsule').tint).toBe('bg');
    expect(alphas('glass-capsule').to).toBeGreaterThan(0);
  });

  it('keeps text and the quieter grey AA on a card’s solid fallback (--surface)', () => {
    for (const ink of [COLOUR.text, token('muted')!, token('muted-2')!]) {
      expect(contrast(ink, COLOUR.surface), ink).toBeGreaterThanOrEqual(TEXT);
    }
  });

  it('keeps text and the quieter grey AA at a card’s sheerest point over the ground', () => {
    // .55 of --surface over the ground is the lightest a card can be with nothing but the
    // ground behind it — brighter than the solid, since the surface is the lighter of the two.
    const { from } = alphas('glass-card');
    const sheer = composite(APP_BG, COLOUR.surface, from);
    for (const ink of [COLOUR.text, token('muted')!, token('muted-2')!]) {
      expect(contrast(ink, sheer), ink).toBeGreaterThanOrEqual(TEXT);
    }
  });

  it('keeps the tab-bar labels AA on the capsule’s dense end over white scrolled text', () => {
    // The worst thing under the tab bar is a white word: .96 of the ground over #ffffff. The
    // active label is white, the others --muted; both must read there (10px–14px type).
    const { to } = alphas('glass-capsule');
    const dense = composite('#ffffff', APP_BG, to);
    expect(contrast('#ffffff', dense)).toBeGreaterThanOrEqual(TEXT);
    expect(contrast(token('muted')!, dense)).toBeGreaterThanOrEqual(TEXT);
  });

  it('keeps white on the ink stamp over a white sky', () => {
    // Badge `on-art` (`.glass-tag-ink`): the sheer end of the ground over pure white.
    const { from } = alphas('glass-tag-ink');
    expect(contrast('#ffffff', composite('#ffffff', APP_BG, from))).toBeGreaterThanOrEqual(TEXT);
  });
});

/* ------------------------------------------------------------------------------------------ */

const SRC = fileURLToPath(new URL('../../', import.meta.url));

function tsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...tsxFiles(path));
    else if (path.endsWith('.tsx')) out.push(path);
  }
  return out;
}

/** A colour emoji: presentation-by-default, or a pictograph forced to colour by VS16. */
const EMOJI = /\p{Emoji_Presentation}|\p{Extended_Pictographic}️/u;
/** An expression that stands for an emoji: `DIFFICULTY_EMOJI[x]`, `emoji`, `medal`. */
const EMOJI_NAME = /emoji|medal/i;

/** Every string literal inside a `className` attribute, however it is composed (clsx, ternaries). */
function classNames(node: ts.JsxOpeningLikeElement): string[] {
  const out: string[] = [];
  for (const attr of node.attributes.properties) {
    if (!ts.isJsxAttribute(attr) || attr.name.getText() !== 'className' || !attr.initializer) {
      continue;
    }
    const visit = (n: ts.Node) => {
      if (ts.isStringLiteralLike(n)) out.push(...n.text.split(/\s+/));
      n.forEachChild(visit);
    };
    visit(attr.initializer);
  }
  return out.filter(Boolean);
}

const isBg = (c: string) => /^bg-(?!linear|radial|conic|clip|blend|fixed|local|scroll)/.test(c);
const isSaturated = (c: string) =>
  SATURATED_FILL_CLASSES.some((s) => c === s || c.startsWith(`${s}-`) || c.startsWith(`${s}/`));

interface Violation {
  file: string;
  line: number;
  fill: string;
}

function scan(file: string, text = readFileSync(file, 'utf8')): Violation[] {
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const out: Violation[] = [];

  /** `fills` is the class list of the nearest enclosing element that sets a background. */
  const walk = (node: ts.Node, fills: string[] | null) => {
    let next = fills;
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const opening = ts.isJsxElement(node) ? node.openingElement : node;
      const classes = classNames(opening);
      if (classes.some(isBg)) next = classes;
    }
    const holdsEmoji =
      (ts.isJsxText(node) && EMOJI.test(node.text)) ||
      (ts.isJsxExpression(node) &&
        !!node.expression &&
        (EMOJI.test(node.expression.getText()) || EMOJI_NAME.test(node.expression.getText())));
    if (holdsEmoji && next) {
      const fill = next.find(isSaturated);
      if (fill) {
        const { line } = sf.getLineAndCharacterOfPosition(node.getStart());
        out.push({ file: relative(SRC, file), line: line + 1, fill });
      }
    }
    node.forEachChild((child) => walk(child, next));
  };
  walk(sf, null);
  return out;
}

describe('the semantic colour map — usage', () => {
  const files = tsxFiles(SRC);

  it('finds the files it is meant to scan', () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it('flags an emoji on a saturated fill, and only there (the scanner itself)', () => {
    const probe = (jsx: string) => scan(join(SRC, 'probe.tsx'), `const a = ${jsx};`).length;
    // The sheet as it was: the emoji in a disc that turns orange on the recommended row.
    expect(
      probe(
        `<span className={clsx('size-12', on ? 'bg-course' : 'border')}><span className="emoji">{DIFFICULTY_EMOJI[c]}</span></span>`,
      ),
    ).toBe(1);
    expect(probe(`<span className="bg-field px-2">🔥 3</span>`)).toBe(1);
    expect(probe(`<span className="bg-action/10"><b>{medal}</b></span>`)).toBe(1);
    // A neutral plate nearer to the emoji wins over the saturated fill further out.
    expect(probe(`<div className="bg-orange"><span className="bg-surface-2">🌿</span></div>`)).toBe(
      0,
    );
    expect(probe(`<span className="bg-surface-2">🌿</span>`)).toBe(0);
    // Glyphs are not emoji.
    expect(probe(`<span className="bg-action">✓ ★ →</span>`)).toBe(0);
  });

  it('lays no emoji on orange, neon, the blues or the club gradient', () => {
    const violations = files.flatMap((f) => scan(f));
    expect(
      violations.map((v) => `${v.file}:${v.line} (${v.fill})`),
      'emoji on a saturated fill — put it on --surface / --surface-2 or white',
    ).toEqual([]);
  });
});
