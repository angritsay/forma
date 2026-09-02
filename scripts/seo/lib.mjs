/**
 * Shared, dependency-free helpers for the SEO conveyor scripts and the markdown link resolver.
 *
 * - a small YAML-subset frontmatter parser (scalars, flow/block arrays, arrays of mappings,
 *   nested mappings, `|` / `>` block scalars) — enough for the guides collection schema;
 * - a TypeScript object-literal scanner that extracts `id` / `slug` / `name` from
 *   content/exercises and content/courses without compiling TypeScript;
 * - markdown text helpers (word count, headings, links, images);
 * - content-link resolution (`exercise:<id>`, `course:<id>`, `guide:<translationKey>`);
 * - the audit rules (guides, content slugs, built HTML) that scripts/seo/audit.mjs prints.
 *
 * Everything is synchronous and pure except the `load*` readers, which take a project root.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/** @typedef {'ru' | 'en'} Locale */
/** @typedef {{ level: 'error' | 'warning' | 'info', file: string, message: string }} Issue */
/** @typedef {{ id: string, slug: { ru?: string, en?: string }, name: { ru?: string, en?: string }, file: string }} ContentEntry */
/** @typedef {{ exercises: Map<string, ContentEntry>, courses: Map<string, ContentEntry>, issues: Issue[] }} ContentIndex */
/**
 * @typedef {object} GuideFile
 * @property {Locale} locale
 * @property {string} slug
 * @property {string} file        Path relative to the project root.
 * @property {Record<string, unknown>} data
 * @property {string} body
 * @property {number} words
 * @property {{ depth: number, text: string }[]} headings
 * @property {{ text: string, href: string }[]} links
 * @property {{ alt: string, src: string }[]} images
 */

export const LOCALES = /** @type {const} */ (['ru', 'en']);

/** Fallback when src/content.config.ts cannot be parsed. Keep in sync with GUIDE_CLUSTERS. */
export const DEFAULT_GUIDE_CLUSTERS = [
  'beginners',
  'no_equipment',
  'dumbbells',
  'kettlebell',
  'formats',
  'fat_loss',
  'programming',
  'recovery',
  'mobility',
  'motivation',
  'equipment',
];

/** On-page limits used by the audit and documented in docs/SEO.md. */
export const LIMITS = {
  /** Full <title> including the " — Forma" suffix. */
  titleMax: 60,
  titleHardMax: 70,
  descriptionMin: 120,
  descriptionMax: 160,
  descriptionHardMin: 60,
  descriptionHardMax: 170,
  guideWordsMin: 900,
  guideWordsHardMin: 800,
  faqMin: 3,
  faqMax: 5,
  internalLinksMin: 3,
  h2Min: 3,
};

/* -------------------------------------------------------------------------------------------- */
/* Frontmatter (YAML subset)                                                                     */
/* -------------------------------------------------------------------------------------------- */

/**
 * Split a markdown document into frontmatter data and body.
 * @param {string} md
 * @returns {{ data: Record<string, unknown>, body: string, hasFrontmatter: boolean }}
 */
export function parseFrontmatter(md) {
  const m = md.match(/^﻿?---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)([\s\S]*)$/);
  if (!m) return { data: {}, body: md, hasFrontmatter: false };
  return { data: parseYaml(m[1] ?? ''), body: m[2] ?? '', hasFrontmatter: true };
}

/**
 * Parse the YAML subset used in guide frontmatter.
 * @param {string} text
 * @returns {Record<string, unknown>}
 */
export function parseYaml(text) {
  const p = { lines: text.split(/\r?\n/), i: 0 };
  const v = parseNode(p, -1);
  return v && typeof v === 'object' && !Array.isArray(v)
    ? /** @type {Record<string, unknown>} */ (v)
    : {};
}

/** @param {string} line */
function indentOf(line) {
  return (line.match(/^ */) ?? [''])[0].length;
}
/** @param {string} line */
function isSkippable(line) {
  return line.trim() === '' || /^\s*#/.test(line);
}
/** @param {{ lines: string[], i: number }} p */
function peek(p) {
  while (p.i < p.lines.length && isSkippable(/** @type {string} */ (p.lines[p.i]))) p.i++;
  return p.i < p.lines.length ? /** @type {string} */ (p.lines[p.i]) : null;
}

const KEY_RE = /^("(?:[^"\\]|\\.)*"|'(?:[^']|'')*'|[^:#'"][^:#]*?)\s*:(?:\s+(.*))?$/;

/**
 * @param {{ lines: string[], i: number }} p
 * @param {number} parentIndent
 * @returns {unknown}
 */
function parseNode(p, parentIndent) {
  const line = peek(p);
  if (line === null) return null;
  const ind = indentOf(line);
  if (ind <= parentIndent) return null;
  const text = line.slice(ind);
  if (text.startsWith('- ') || text === '-') return parseSequence(p, ind);
  return parseMapping(p, ind);
}

/**
 * @param {{ lines: string[], i: number }} p
 * @param {number} indent
 * @returns {Record<string, unknown>}
 */
function parseMapping(p, indent) {
  /** @type {Record<string, unknown>} */
  const obj = {};
  for (;;) {
    const line = peek(p);
    if (line === null) break;
    const ind = indentOf(line);
    if (ind < indent) break;
    if (ind > indent) {
      p.i++;
      continue;
    }
    const text = line.slice(indent);
    if (text.startsWith('- ') || text === '-') break;
    const km = text.match(KEY_RE);
    if (!km) {
      p.i++;
      continue;
    }
    const key = unquote((km[1] ?? '').trim());
    const rest = (km[2] ?? '').trim();
    p.i++;
    if (rest === '') {
      obj[key] = parseNode(p, indent);
    } else if (/^[|>][+-]?$/.test(rest)) {
      obj[key] = parseBlockScalar(p, indent, rest);
    } else {
      obj[key] = parseScalar(rest);
    }
  }
  return obj;
}

/**
 * @param {{ lines: string[], i: number }} p
 * @param {number} indent
 * @returns {unknown[]}
 */
function parseSequence(p, indent) {
  /** @type {unknown[]} */
  const arr = [];
  for (;;) {
    const line = peek(p);
    if (line === null) break;
    const ind = indentOf(line);
    if (ind < indent) break;
    if (ind > indent) {
      p.i++;
      continue;
    }
    const text = line.slice(indent);
    if (!(text.startsWith('- ') || text === '-')) break;
    const rest = text === '-' ? '' : text.slice(2).trim();
    if (rest === '') {
      p.i++;
      arr.push(parseNode(p, indent));
      continue;
    }
    if (!/^["'[{]/.test(rest) && KEY_RE.test(rest)) {
      // "- key: value" — an object item; re-indent the first line and parse it as a mapping.
      p.lines[p.i] = ' '.repeat(indent + 2) + rest;
      arr.push(parseMapping(p, indent + 2));
      continue;
    }
    p.i++;
    arr.push(parseScalar(rest));
  }
  return arr;
}

/**
 * @param {{ lines: string[], i: number }} p
 * @param {number} indent
 * @param {string} marker
 */
function parseBlockScalar(p, indent, marker) {
  const fold = marker.startsWith('>');
  /** @type {string[]} */
  const out = [];
  let blockIndent = -1;
  while (p.i < p.lines.length) {
    const line = /** @type {string} */ (p.lines[p.i]);
    if (line.trim() === '') {
      out.push('');
      p.i++;
      continue;
    }
    const ind = indentOf(line);
    if (blockIndent < 0) {
      if (ind <= indent) break;
      blockIndent = ind;
    }
    if (ind < blockIndent) break;
    out.push(line.slice(blockIndent));
    p.i++;
  }
  while (out.length && out[out.length - 1] === '') out.pop();
  if (!fold) return out.join('\n');
  let s = '';
  for (const l of out) {
    if (l === '') s += '\n';
    else s += (s === '' || s.endsWith('\n') ? '' : ' ') + l;
  }
  return s;
}

/** @param {string} s */
function unquote(s) {
  if (s.startsWith('"') && s.endsWith('"') && s.length >= 2) {
    return s.slice(1, -1).replace(/\\(["\\/bfnrt])/g, (_, c) => {
      const map = { '"': '"', '\\': '\\', '/': '/', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' };
      return /** @type {Record<string, string>} */ (map)[c] ?? c;
    });
  }
  if (s.startsWith("'") && s.endsWith("'") && s.length >= 2) {
    return s.slice(1, -1).replace(/''/g, "'");
  }
  return s;
}

/**
 * Parse an inline YAML scalar / flow collection.
 * @param {string} raw
 * @returns {unknown}
 */
export function parseScalar(raw) {
  let s = raw.trim();
  if (s.startsWith('"')) {
    const m = s.match(/^"(?:[^"\\]|\\.)*"/);
    if (m) return unquote(m[0]);
  }
  if (s.startsWith("'")) {
    const m = s.match(/^'(?:[^']|'')*'/);
    if (m) return unquote(m[0]);
  }
  s = s.replace(/\s+#.*$/, '').trim();
  if (s.startsWith('[') && s.endsWith(']')) return splitFlow(s.slice(1, -1)).map(parseScalar);
  if (s.startsWith('{') && s.endsWith('}')) {
    /** @type {Record<string, unknown>} */
    const o = {};
    for (const part of splitFlow(s.slice(1, -1))) {
      const idx = part.indexOf(':');
      if (idx > 0) o[unquote(part.slice(0, idx).trim())] = parseScalar(part.slice(idx + 1));
    }
    return o;
  }
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (s === 'null' || s === '~' || s === '') return null;
  if (/^-?\d+(?:\.\d+)?$/.test(s)) return Number(s);
  return s;
}

/** @param {string} s */
function splitFlow(s) {
  /** @type {string[]} */
  const out = [];
  let cur = '';
  /** @type {string | null} */
  let q = null;
  let depth = 0;
  for (const ch of s) {
    if (q) {
      cur += ch;
      if (ch === q) q = null;
    } else if (ch === '"' || ch === "'") {
      q = ch;
      cur += ch;
    } else if (ch === '[' || ch === '{') {
      depth++;
      cur += ch;
    } else if (ch === ']' || ch === '}') {
      depth--;
      cur += ch;
    } else if (ch === ',' && depth === 0) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  if (cur.trim() !== '') out.push(cur);
  return out.map((x) => x.trim()).filter((x) => x !== '');
}

/* -------------------------------------------------------------------------------------------- */
/* Markdown helpers                                                                              */
/* -------------------------------------------------------------------------------------------- */

/**
 * Markdown → plain text (rough, good enough for counting words and finding keywords).
 * @param {string} body
 */
export function stripMarkdown(body) {
  return body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/gm, ' ')
    .replace(/\|/g, ' ')
    .replace(/[*_~]{1,3}/g, '');
}

const WORD_RE = /[\p{L}\p{N}]+(?:[-'’][\p{L}\p{N}]+)*/gu;

/** @param {string} text */
export function wordCount(text) {
  return (stripMarkdown(text).match(WORD_RE) ?? []).length;
}

/**
 * First `n` words of the plain text.
 * @param {string} body
 * @param {number} n
 */
export function firstWords(body, n) {
  return (stripMarkdown(body).match(WORD_RE) ?? []).slice(0, n).join(' ');
}

/**
 * @param {string} body
 * @returns {{ depth: number, text: string }[]}
 */
export function extractHeadings(body) {
  /** @type {{ depth: number, text: string }[]} */
  const out = [];
  const noCode = body.replace(/```[\s\S]*?```/g, '');
  for (const m of noCode.matchAll(/^ {0,3}(#{1,6})[ \t]+(.+?)[ \t]*#*[ \t]*$/gm)) {
    out.push({ depth: (m[1] ?? '').length, text: stripMarkdown(m[2] ?? '').trim() });
  }
  return out;
}

/**
 * Inline links `[text](href)` (images excluded).
 * @param {string} body
 * @returns {{ text: string, href: string }[]}
 */
export function extractLinks(body) {
  /** @type {{ text: string, href: string }[]} */
  const out = [];
  for (const m of body.matchAll(/(!?)\[([^\]]*)\]\(\s*<?([^\s)>]+)>?(?:\s+"[^"]*")?\s*\)/g)) {
    if (m[1] === '!') continue;
    out.push({ text: m[2] ?? '', href: m[3] ?? '' });
  }
  return out;
}

/**
 * @param {string} body
 * @returns {{ alt: string, src: string }[]}
 */
export function extractImages(body) {
  /** @type {{ alt: string, src: string }[]} */
  const out = [];
  for (const m of body.matchAll(/!\[([^\]]*)\]\(\s*<?([^\s)>]+)>?(?:\s+"[^"]*")?\s*\)/g)) {
    out.push({ alt: m[1] ?? '', src: m[2] ?? '' });
  }
  for (const m of body.matchAll(/<img\b([^>]*)>/gi)) {
    const attrs = m[1] ?? '';
    const alt = attrs.match(/\balt\s*=\s*"([^"]*)"/i);
    const src = attrs.match(/\bsrc\s*=\s*"([^"]*)"/i);
    out.push({ alt: alt ? (alt[1] ?? '') : '', src: src ? (src[1] ?? '') : '' });
  }
  return out;
}

/**
 * Case-insensitive "phrase appears in text" that tolerates punctuation and ё/е.
 * @param {string} haystack
 * @param {string} needle
 */
export function containsPhrase(haystack, needle) {
  const norm = (/** @type {string} */ s) =>
    s
      .toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim();
  const h = ` ${norm(haystack)} `;
  const n = norm(needle);
  return n.length > 0 && h.includes(` ${n} `);
}

/* -------------------------------------------------------------------------------------------- */
/* TypeScript literal scanner                                                                     */
/* -------------------------------------------------------------------------------------------- */

/** @typedef {{ raw: string }} RawToken */

/**
 * Extract every `const NAME = <literal>` from a TypeScript source as plain JS values.
 * Objects, arrays, strings, numbers and booleans are converted; anything else (identifiers,
 * calls, spreads) becomes `{ raw }`. Type annotations, `as const` and `satisfies X` are skipped.
 * @param {string} source
 * @returns {{ name: string, value: unknown }[]}
 */
export function parseTsLiterals(source) {
  /** @type {{ name: string, value: unknown }[]} */
  const out = [];
  const re = /(?:^|[\n;])[ \t]*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::\s*[^=;]+?)?\s*=\s*/g;
  for (const m of source.matchAll(re)) {
    const start = m.index + m[0].length;
    try {
      const { value } = parseValue(source, start);
      out.push({ name: m[1] ?? '', value });
    } catch {
      // Not a literal we can read (e.g. a function) — skip silently.
    }
  }
  return out;
}

/**
 * @param {string} s
 * @param {number} i
 * @returns {number}
 */
function skipWs(s, i) {
  for (;;) {
    while (i < s.length && /\s/.test(/** @type {string} */ (s[i]))) i++;
    if (s.startsWith('//', i)) {
      const nl = s.indexOf('\n', i);
      i = nl < 0 ? s.length : nl + 1;
      continue;
    }
    if (s.startsWith('/*', i)) {
      const end = s.indexOf('*/', i + 2);
      i = end < 0 ? s.length : end + 2;
      continue;
    }
    return i;
  }
}

/**
 * @param {string} s
 * @param {number} i
 * @returns {{ value: unknown, end: number }}
 */
function parseValue(s, i) {
  i = skipWs(s, i);
  const ch = s[i];
  if (ch === '{') return parseObject(s, i);
  if (ch === '[') return parseArray(s, i);
  if (ch === "'" || ch === '"' || ch === '`') return parseString(s, i);
  return parseRaw(s, i);
}

/**
 * @param {string} s
 * @param {number} i
 */
function parseString(s, i) {
  const q = /** @type {string} */ (s[i]);
  let j = i + 1;
  let out = '';
  while (j < s.length && s[j] !== q) {
    if (s[j] === '\\' && j + 1 < s.length) {
      const n = /** @type {string} */ (s[j + 1]);
      out += n === 'n' ? '\n' : n === 't' ? '\t' : n;
      j += 2;
      continue;
    }
    out += s[j];
    j++;
  }
  return { value: out, end: j + 1 };
}

/**
 * Read a non-literal token up to the next delimiter at depth 0.
 * @param {string} s
 * @param {number} i
 */
function parseRaw(s, i) {
  let depth = 0;
  let j = i;
  while (j < s.length) {
    const c = /** @type {string} */ (s[j]);
    if (c === "'" || c === '"' || c === '`') {
      j = parseString(s, j).end;
      continue;
    }
    if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') {
      if (depth === 0) break;
      depth--;
    } else if ((c === ',' || c === ';' || c === '\n') && depth === 0) break;
    j++;
  }
  const raw = s.slice(i, j).trim();
  if (/^-?\d+(?:\.\d+)?$/.test(raw)) return { value: Number(raw), end: j };
  if (raw === 'true') return { value: true, end: j };
  if (raw === 'false') return { value: false, end: j };
  if (raw === 'null' || raw === 'undefined') return { value: null, end: j };
  return { value: { raw }, end: j };
}

/**
 * Skip trailing `as const` / `satisfies T` / whitespace until `,` or a closing bracket.
 * @param {string} s
 * @param {number} i
 */
function skipToDelimiter(s, i) {
  let depth = 0;
  while (i < s.length) {
    i = skipWs(s, i);
    const c = /** @type {string} */ (s[i]);
    if (c === "'" || c === '"' || c === '`') {
      i = parseString(s, i).end;
      continue;
    }
    if (c === '(' || c === '[' || c === '{' || c === '<') depth++;
    else if (c === ')' || c === ']' || c === '}' || c === '>') {
      if (depth === 0) return i;
      depth--;
    } else if (c === ',' && depth === 0) return i;
    i++;
  }
  return i;
}

/**
 * @param {string} s
 * @param {number} i
 */
function parseObject(s, i) {
  /** @type {Record<string, unknown>} */
  const obj = {};
  i++; // {
  for (;;) {
    i = skipWs(s, i);
    if (i >= s.length) break;
    if (s[i] === '}') return { value: obj, end: i + 1 };
    if (s[i] === ',') {
      i++;
      continue;
    }
    if (s.startsWith('...', i)) {
      i = parseValue(s, i + 3).end;
      i = skipToDelimiter(s, i);
      continue;
    }
    let key = '';
    if (s[i] === "'" || s[i] === '"') {
      const r = parseString(s, i);
      key = /** @type {string} */ (r.value);
      i = r.end;
    } else if (s[i] === '[') {
      const r = parseArray(s, i);
      key = JSON.stringify(r.value);
      i = r.end;
    } else {
      const m = s.slice(i).match(/^[A-Za-z_$][\w$]*/);
      if (!m) {
        i = skipToDelimiter(s, i + 1);
        continue;
      }
      key = m[0];
      i += key.length;
    }
    i = skipWs(s, i);
    if (s[i] !== ':') {
      // shorthand property / method — skip it
      i = skipToDelimiter(s, i);
      continue;
    }
    const r = parseValue(s, i + 1);
    obj[key] = r.value;
    i = skipToDelimiter(s, r.end);
  }
  return { value: obj, end: i };
}

/**
 * @param {string} s
 * @param {number} i
 */
function parseArray(s, i) {
  /** @type {unknown[]} */
  const arr = [];
  i++; // [
  for (;;) {
    i = skipWs(s, i);
    if (i >= s.length) break;
    if (s[i] === ']') return { value: arr, end: i + 1 };
    if (s[i] === ',') {
      i++;
      continue;
    }
    if (s.startsWith('...', i)) {
      i = parseValue(s, i + 3).end;
      i = skipToDelimiter(s, i);
      continue;
    }
    const r = parseValue(s, i);
    arr.push(r.value);
    i = skipToDelimiter(s, r.end);
  }
  return { value: arr, end: i };
}

/**
 * Walk a parsed value and collect every object that has a string `id`.
 * @param {unknown} value
 * @param {Record<string, unknown>[]} [out]
 * @returns {Record<string, unknown>[]}
 */
export function collectObjectsWithId(value, out = []) {
  if (Array.isArray(value)) {
    for (const v of value) collectObjectsWithId(v, out);
  } else if (value && typeof value === 'object') {
    const o = /** @type {Record<string, unknown>} */ (value);
    if (typeof o.id === 'string') out.push(o);
    for (const v of Object.values(o)) collectObjectsWithId(v, out);
  }
  return out;
}

/**
 * @param {unknown} v
 * @returns {{ ru?: string, en?: string }}
 */
function pickL10n(v) {
  /** @type {{ ru?: string, en?: string }} */
  const out = {};
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const o = /** @type {Record<string, unknown>} */ (v);
    if (typeof o.ru === 'string') out.ru = o.ru;
    if (typeof o.en === 'string') out.en = o.en;
  }
  return out;
}

/* -------------------------------------------------------------------------------------------- */
/* Content readers                                                                                */
/* -------------------------------------------------------------------------------------------- */

/**
 * @param {string} root
 * @param {string} p
 */
function rel(root, p) {
  return relative(root, p).split(sep).join('/');
}

/**
 * Read exercise and course ids/slugs/names by scanning the TypeScript content files.
 * @param {string} root Project root.
 * @returns {ContentIndex}
 */
export function loadContentIndex(root) {
  /** @type {ContentIndex} */
  const index = { exercises: new Map(), courses: new Map(), issues: [] };
  /** @type {[string, Map<string, ContentEntry>, string][]} */
  const groups = [
    ['exercises', index.exercises, 'exercise'],
    ['courses', index.courses, 'course'],
  ];
  for (const [dir, map, label] of groups) {
    const d = join(root, 'content', dir);
    if (!existsSync(d)) continue;
    const files = readdirSync(d)
      .filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f))
      .sort();
    for (const f of files) {
      const full = join(d, f);
      const file = rel(root, full);
      const src = readFileSync(full, 'utf8');
      for (const { value } of parseTsLiterals(src)) {
        for (const obj of collectObjectsWithId(value)) {
          if (!obj.slug || typeof obj.slug !== 'object') continue; // workouts / blocks / nodes
          const id = /** @type {string} */ (obj.id);
          const entry = { id, slug: pickL10n(obj.slug), name: pickL10n(obj.name), file };
          const prev = map.get(id);
          if (prev) {
            index.issues.push({
              level: 'error',
              file,
              message: `duplicate ${label} id "${id}" (also in ${prev.file})`,
            });
          } else map.set(id, entry);
        }
      }
    }
  }
  return index;
}

/**
 * Read GUIDE_CLUSTERS from src/content.config.ts (falls back to the built-in list).
 * @param {string} root
 * @returns {string[]}
 */
export function loadGuideClusters(root) {
  for (const rel of ['src/lib/seo/clusters.ts', 'src/content.config.ts']) {
    const file = join(root, rel);
    if (!existsSync(file)) continue;
    const found = parseTsLiterals(readFileSync(file, 'utf8')).find((x) => x.name === 'GUIDE_CLUSTERS');
    if (found && Array.isArray(found.value) && found.value.every((v) => typeof v === 'string')) {
      return /** @type {string[]} */ (found.value);
    }
  }
  return DEFAULT_GUIDE_CLUSTERS;
}

/**
 * Read every guide markdown file under content/guides/{ru,en}.
 * @param {string} root
 * @returns {GuideFile[]}
 */
export function loadGuides(root) {
  /** @type {GuideFile[]} */
  const out = [];
  for (const locale of LOCALES) {
    const d = join(root, 'content', 'guides', locale);
    if (!existsSync(d)) continue;
    for (const f of readdirSync(d)
      .filter((x) => x.endsWith('.md') || x.endsWith('.mdx'))
      .sort()) {
      const full = join(d, f);
      if (!statSync(full).isFile()) continue;
      out.push(readGuideFile(readFileSync(full, 'utf8'), locale, f, rel(root, full)));
    }
  }
  return out;
}

/**
 * Build a GuideFile from a markdown source (exported for tests).
 * @param {string} md
 * @param {Locale} locale
 * @param {string} fileName e.g. "my-slug.md"
 * @param {string} [file] path for messages
 * @returns {GuideFile}
 */
export function readGuideFile(md, locale, fileName, file = `content/guides/${locale}/${fileName}`) {
  const { data, body } = parseFrontmatter(md);
  return {
    locale,
    slug: fileName.replace(/\.mdx?$/, ''),
    file,
    data,
    body,
    words: wordCount(body),
    headings: extractHeadings(body),
    links: extractLinks(body),
    images: extractImages(body),
  };
}

/* -------------------------------------------------------------------------------------------- */
/* Content links                                                                                  */
/* -------------------------------------------------------------------------------------------- */

export const CONTENT_LINK_RE = /^(exercise|course|guide):([A-Za-z0-9_-]+)$/;

/** @param {string} cluster */
export function clusterSlug(cluster) {
  return cluster.replace(/_/g, '-');
}

/**
 * Resolve a content href to a locale-specific site path (without locale prefix or base).
 * @param {string} href
 * @param {Locale} locale
 * @param {{ exercises: Map<string, ContentEntry>, courses: Map<string, ContentEntry>, guides: Pick<GuideFile, 'locale' | 'slug' | 'data'>[] }} ctx
 * @returns {{ kind: 'exercise' | 'course' | 'guide', id: string, sitePath: string } | { kind: 'exercise' | 'course' | 'guide', id: string, error: string } | null}
 */
export function resolveContentLink(href, locale, ctx) {
  const m = href.match(CONTENT_LINK_RE);
  if (!m) return null;
  const kind = /** @type {'exercise' | 'course' | 'guide'} */ (m[1]);
  const id = /** @type {string} */ (m[2]);
  if (kind === 'guide') {
    const g = ctx.guides.find((x) => x.locale === locale && x.data.translationKey === id);
    if (g) return { kind, id, sitePath: `/guides/${g.slug}/` };
    const other = ctx.guides.find((x) => x.data.translationKey === id);
    return { kind, id, error: other ? `guide "${id}" has no ${locale} version` : `unknown guide "${id}"` };
  }
  const map = kind === 'exercise' ? ctx.exercises : ctx.courses;
  const entry = map.get(id);
  if (!entry) return { kind, id, error: `unknown ${kind} "${id}"` };
  const slug = entry.slug[locale];
  if (!slug) return { kind, id, error: `${kind} "${id}" has no ${locale} slug` };
  return { kind, id, sitePath: `/${kind === 'exercise' ? 'exercises' : 'courses'}/${slug}/` };
}

/**
 * Locale prefix + base path, mirroring src/lib/util/paths.ts (kept here so config-time code
 * that cannot use Vite aliases gets identical URLs).
 * @param {Locale} locale
 * @param {string} sitePath
 * @param {string} [base]
 */
export function localizedHref(locale, sitePath, base = '/') {
  const p = sitePath.startsWith('/') ? sitePath : `/${sitePath}`;
  const withSlash = p.endsWith('/') || /\.[a-z0-9]+$/i.test(p) ? p : `${p}/`;
  const prefixed = locale === 'ru' ? withSlash : `/${locale}${withSlash}`;
  let b = base || '/';
  if (!b.startsWith('/')) b = `/${b}`;
  if (!b.endsWith('/')) b = `${b}/`;
  return `${b}${prefixed.slice(1)}`;
}

/* -------------------------------------------------------------------------------------------- */
/* Audit rules                                                                                    */
/* -------------------------------------------------------------------------------------------- */

/**
 * @param {string} value
 * @param {{ min: number, max: number, hardMin?: number, hardMax?: number }} limits
 * @param {string} label
 * @returns {{ level: 'error' | 'warning', message: string } | null}
 */
export function checkLength(value, limits, label) {
  const len = [...value.trim()].length;
  if (limits.hardMax !== undefined && len > limits.hardMax)
    return { level: 'error', message: `${label} is ${len} chars (max ${limits.hardMax})` };
  if (limits.hardMin !== undefined && len < limits.hardMin)
    return { level: 'error', message: `${label} is ${len} chars (min ${limits.hardMin})` };
  if (len > limits.max)
    return { level: 'warning', message: `${label} is ${len} chars (aim ≤ ${limits.max})` };
  if (len < limits.min)
    return { level: 'warning', message: `${label} is ${len} chars (aim ≥ ${limits.min})` };
  return null;
}

/**
 * Audit exercise/course content: both locales, slug uniqueness and format.
 * @param {ContentIndex} index
 * @returns {Issue[]}
 */
export function auditContentIndex(index) {
  /** @type {Issue[]} */
  const issues = [...index.issues];
  const slugRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  /** @type {[string, Map<string, ContentEntry>][]} */
  const groups = [
    ['exercise', index.exercises],
    ['course', index.courses],
  ];
  for (const [label, map] of groups) {
    for (const locale of LOCALES) {
      /** @type {Map<string, string>} */
      const seen = new Map();
      for (const e of map.values()) {
        const slug = e.slug[locale];
        if (!slug) {
          issues.push({ level: 'error', file: e.file, message: `${label} "${e.id}" has no ${locale} slug` });
          continue;
        }
        if (!slugRe.test(slug))
          issues.push({ level: 'error', file: e.file, message: `${label} "${e.id}" ${locale} slug "${slug}" is not kebab-case` });
        const prev = seen.get(slug);
        if (prev)
          issues.push({ level: 'error', file: e.file, message: `${label} "${e.id}" duplicates ${locale} slug "${slug}" of "${prev}"` });
        else seen.set(slug, e.id);
        if (!e.name[locale])
          issues.push({ level: 'error', file: e.file, message: `${label} "${e.id}" has no ${locale} name` });
      }
    }
  }
  return issues;
}

/**
 * Audit guides against the writing checklist (docs/SEO.md) and link resolution.
 * @param {GuideFile[]} guides
 * @param {ContentIndex} index
 * @param {string[]} [clusters]
 * @returns {Issue[]}
 */
export function auditGuides(guides, index, clusters = DEFAULT_GUIDE_CLUSTERS) {
  /** @type {Issue[]} */
  const issues = [];
  const clusterSlugs = new Set(clusters.map(clusterSlug));
  const ctx = { exercises: index.exercises, courses: index.courses, guides };
  const published = guides.filter((g) => g.data.draft !== true);

  for (const locale of LOCALES) {
    /** @type {Record<'title' | 'h1' | 'translationKey' | 'slug', Map<string, string>>} */
    const seen = { title: new Map(), h1: new Map(), translationKey: new Map(), slug: new Map() };
    for (const g of published.filter((x) => x.locale === locale)) {
      const d = g.data;
      const str = (/** @type {unknown} */ v) => (typeof v === 'string' ? v : '');
      const title = str(d.title);
      const description = str(d.description);
      const h1 = str(d.h1);
      const keyword = str(d.targetKeyword);
      const push = (/** @type {'error' | 'warning'} */ level, /** @type {string} */ message) =>
        issues.push({ level, file: g.file, message });

      for (const field of ['title', 'description', 'h1', 'targetKeyword', 'cluster', 'translationKey', 'publishedAt', 'updatedAt']) {
        if (!str(d[field])) push('error', `frontmatter "${field}" is missing`);
      }
      if (d.cluster && !clusters.includes(str(d.cluster)))
        push('error', `unknown cluster "${str(d.cluster)}"`);
      for (const field of ['publishedAt', 'updatedAt']) {
        const v = str(d[field]);
        if (v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) push('error', `"${field}" must be YYYY-MM-DD`);
      }
      if (clusterSlugs.has(g.slug)) push('error', `slug "${g.slug}" collides with a cluster hub URL`);

      const tl = title && checkLength(title, { min: 10, max: LIMITS.titleMax, hardMin: 10, hardMax: LIMITS.titleHardMax }, 'title');
      if (tl) push(tl.level, tl.message);
      const dl =
        description &&
        checkLength(
          description,
          { min: LIMITS.descriptionMin, max: LIMITS.descriptionMax, hardMin: LIMITS.descriptionHardMin, hardMax: LIMITS.descriptionHardMax },
          'description',
        );
      if (dl) push(dl.level, dl.message);

      for (const [key, value] of /** @type {[keyof typeof seen, string][]} */ ([
        ['title', title.toLowerCase()],
        ['h1', h1.toLowerCase()],
        ['translationKey', str(d.translationKey)],
        ['slug', g.slug],
      ])) {
        if (!value) continue;
        const prev = seen[key].get(value);
        if (prev) push('error', `${key} duplicates ${prev}`);
        else seen[key].set(value, g.file);
      }

      if (keyword) {
        if (!containsPhrase(title, keyword)) push('warning', `target keyword "${keyword}" not in title`);
        if (!containsPhrase(h1, keyword)) push('warning', `target keyword "${keyword}" not in h1`);
        if (!containsPhrase(description, keyword)) push('warning', `target keyword "${keyword}" not in description`);
        if (!containsPhrase(firstWords(g.body, 100), keyword)) push('warning', `target keyword "${keyword}" not in the first 100 words`);
        if (!g.headings.some((h) => h.depth === 2 && containsPhrase(h.text, keyword)))
          push('warning', `target keyword "${keyword}" not in any H2`);
      }

      if (g.words < LIMITS.guideWordsHardMin) push('error', `${g.words} words (min ${LIMITS.guideWordsHardMin})`);
      else if (g.words < LIMITS.guideWordsMin) push('warning', `${g.words} words (aim ≥ ${LIMITS.guideWordsMin})`);
      const h2s = g.headings.filter((h) => h.depth === 2).length;
      if (h2s < LIMITS.h2Min) push('warning', `${h2s} H2 sections (aim ≥ ${LIMITS.h2Min})`);
      if (g.headings.some((h) => h.depth === 1)) push('warning', 'body contains an H1 (the template renders h1 from frontmatter)');

      const faq = Array.isArray(d.faq) ? d.faq : [];
      if (faq.length < LIMITS.faqMin || faq.length > LIMITS.faqMax)
        push('warning', `${faq.length} FAQ items (aim ${LIMITS.faqMin}–${LIMITS.faqMax})`);
      for (const [i, item] of faq.entries()) {
        const it = /** @type {Record<string, unknown>} */ (item ?? {});
        if (!str(it.q) || !str(it.a)) push('error', `faq[${i}] needs both q and a`);
      }

      let contentLinks = 0;
      let courseLinks = 0;
      for (const link of g.links) {
        const r = resolveContentLink(link.href, locale, ctx);
        if (!r) continue;
        if ('error' in r) push('error', `link "${link.href}": ${r.error}`);
        else {
          contentLinks++;
          if (r.kind === 'course') courseLinks++;
        }
      }
      for (const field of ['relatedExercises', 'relatedCourses', 'relatedGuides']) {
        const list = Array.isArray(d[field]) ? d[field] : [];
        for (const ref of list) {
          const id = str(ref);
          const kind = field === 'relatedExercises' ? 'exercise' : field === 'relatedCourses' ? 'course' : 'guide';
          const r = resolveContentLink(`${kind}:${id}`, locale, ctx);
          if (!r || 'error' in r) push('error', `${field} "${id}": ${r && 'error' in r ? r.error : 'invalid id'}`);
        }
      }
      const cta = d.cta && typeof d.cta === 'object' ? /** @type {Record<string, unknown>} */ (d.cta) : {};
      if (str(cta.courseId) && !index.courses.has(str(cta.courseId)))
        push('error', `cta.courseId "${str(cta.courseId)}" is unknown`);
      if (contentLinks < LIMITS.internalLinksMin)
        push('warning', `${contentLinks} internal content links (aim ≥ ${LIMITS.internalLinksMin})`);
      if (courseLinks < 1 && !str(cta.courseId)) push('warning', 'no course link and no cta.courseId');

      for (const img of g.images) if (!img.alt.trim()) push('warning', `image "${img.src}" has no alt text`);

      const key = str(d.translationKey);
      if (key) {
        const other = locale === 'ru' ? 'en' : 'ru';
        if (!guides.some((x) => x.locale === other && x.data.translationKey === key))
          push('warning', `no ${other} translation with translationKey "${key}"`);
      }
    }
  }
  for (const g of guides.filter((x) => x.data.draft === true))
    issues.push({ level: 'info', file: g.file, message: 'draft — skipped' });
  return issues;
}

/* -------------------------------------------------------------------------------------------- */
/* Built site audit                                                                               */
/* -------------------------------------------------------------------------------------------- */

/**
 * @param {string} dir
 * @param {string[]} [out]
 */
function walkHtml(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walkHtml(p, out);
    else if (name === 'index.html' || name.endsWith('.html')) out.push(p);
  }
  return out;
}

/**
 * @param {string} html
 * @param {string} name
 */
function metaContent(html, name) {
  const m =
    html.match(new RegExp(`<meta\\s+name="${name}"\\s+content="([^"]*)"`, 'i')) ??
    html.match(new RegExp(`<meta\\s+content="([^"]*)"\\s+name="${name}"`, 'i'));
  return m ? decodeEntities(m[1] ?? '') : null;
}

/** @param {string} s */
function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/**
 * Parse `<url>` entries of a sitemap.
 * @param {string} xml
 * @returns {{ loc: string, lastmod?: string }[]}
 */
export function parseSitemap(xml) {
  /** @type {{ loc: string, lastmod?: string }[]} */
  const out = [];
  for (const m of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const block = m[1] ?? '';
    const loc = block.match(/<loc>([^<]+)<\/loc>/);
    if (!loc) continue;
    const lastmod = block.match(/<lastmod>([^<]+)<\/lastmod>/);
    out.push({ loc: decodeEntities((loc[1] ?? '').trim()), lastmod: lastmod ? (lastmod[1] ?? '').trim() : undefined });
  }
  return out;
}

/**
 * Check one rendered HTML document (exported for tests).
 * @param {string} html
 * @param {string} file
 * @param {{ allowNoindex?: boolean }} [opts]
 * @returns {{ issues: Issue[], title: string | null, description: string | null }}
 */
export function auditHtml(html, file, opts = {}) {
  /** @type {Issue[]} */
  const issues = [];
  const push = (/** @type {'error' | 'warning'} */ level, /** @type {string} */ message) =>
    issues.push({ level, file, message });
  const titles = [...html.matchAll(/<title[^>]*>([\s\S]*?)<\/title>/gi)];
  const title = titles.length ? decodeEntities((titles[0]?.[1] ?? '').trim()) : null;
  if (titles.length !== 1) push('error', `${titles.length} <title> tags`);
  else {
    const tl = checkLength(title ?? '', { min: 10, max: LIMITS.titleMax, hardMin: 5, hardMax: LIMITS.titleHardMax }, '<title>');
    if (tl) push(tl.level, tl.message);
  }
  const h1s = (html.match(/<h1[\s>]/gi) ?? []).length;
  if (h1s === 0) push('error', 'no <h1>');
  else if (h1s > 1) push('warning', `${h1s} <h1> tags`);
  if (!/<link\s+rel="canonical"/i.test(html)) push('error', 'no canonical link');
  const alternates = (html.match(/<link\s+rel="alternate"\s+hreflang=/gi) ?? []).length;
  if (alternates === 0) push('warning', 'no hreflang alternates');
  else if (!/hreflang="x-default"/i.test(html)) push('warning', 'no x-default alternate');
  const robots = metaContent(html, 'robots');
  if (robots && /noindex/i.test(robots) && !opts.allowNoindex) push('error', 'noindex on a public page');
  const description = metaContent(html, 'description');
  if (description === null) push('error', 'no meta description');
  else {
    const dl = checkLength(description, { min: 80, max: LIMITS.descriptionMax, hardMin: 20, hardMax: 200 }, 'meta description');
    if (dl) push(dl.level, dl.message);
  }
  if (!/<html[^>]*\slang="/i.test(html)) push('error', 'no lang attribute on <html>');
  return { issues, title, description };
}

/**
 * Audit the built site in `dist/`: sitemap coverage and per-page checks.
 * @param {string} dist
 * @param {{ base?: string }} [opts]
 * @returns {Issue[]}
 */
export function auditDist(dist, opts = {}) {
  /** @type {Issue[]} */
  const issues = [];
  if (!existsSync(dist)) return issues;
  const base = normalizeBase(opts.base ?? process.env.BASE_PATH ?? '/');
  const sitemapPath = join(dist, 'sitemap.xml');
  const htmlFiles = walkHtml(dist);
  const relHtml = (/** @type {string} */ p) => rel(dist, p);
  const isApp = (/** @type {string} */ p) => /^app\//.test(relHtml(p));
  const is404 = (/** @type {string} */ p) => /^404\.html$|^404\/index\.html$/.test(relHtml(p));

  /** @type {Set<string>} */
  const inSitemap = new Set();
  if (existsSync(sitemapPath)) {
    const entries = parseSitemap(readFileSync(sitemapPath, 'utf8'));
    if (entries.length === 0) issues.push({ level: 'error', file: 'dist/sitemap.xml', message: 'sitemap has no URLs' });
    for (const { loc } of entries) {
      let pathname;
      try {
        pathname = decodeURI(new URL(loc).pathname);
      } catch {
        issues.push({ level: 'error', file: 'dist/sitemap.xml', message: `invalid URL ${loc}` });
        continue;
      }
      let sitePath = pathname;
      if (base !== '/' && sitePath.startsWith(base)) sitePath = `/${sitePath.slice(base.length)}`;
      const target = join(dist, sitePath, 'index.html');
      if (!existsSync(target)) {
        issues.push({ level: 'error', file: 'dist/sitemap.xml', message: `${loc} has no dist${sitePath}index.html` });
      } else inSitemap.add(target);
    }
  } else {
    issues.push({ level: 'warning', file: 'dist/sitemap.xml', message: 'sitemap.xml not found' });
  }
  for (const name of ['robots.txt', 'llms.txt', 'rss.xml']) {
    if (!existsSync(join(dist, name)))
      issues.push({ level: 'warning', file: `dist/${name}`, message: 'file not found in dist' });
  }

  /** @type {Map<string, string>} */
  const titles = new Map();
  /** @type {Map<string, string>} */
  const descriptions = new Map();
  for (const file of htmlFiles) {
    if (isApp(file) || is404(file)) continue;
    const html = readFileSync(file, 'utf8');
    const label = `dist/${relHtml(file)}`;
    const r = auditHtml(html, label);
    issues.push(...r.issues);
    if (r.title) {
      const prev = titles.get(r.title);
      if (prev) issues.push({ level: 'error', file: label, message: `title duplicates ${prev}` });
      else titles.set(r.title, label);
    }
    if (r.description) {
      const prev = descriptions.get(r.description);
      if (prev) issues.push({ level: 'warning', file: label, message: `meta description duplicates ${prev}` });
      else descriptions.set(r.description, label);
    }
    if (existsSync(sitemapPath) && !inSitemap.has(file))
      issues.push({ level: 'warning', file: label, message: 'page is not in the sitemap' });
  }
  return issues;
}

/** @param {string} b */
export function normalizeBase(b) {
  let base = (b || '/').trim();
  if (!base.startsWith('/')) base = `/${base}`;
  if (!base.endsWith('/')) base = `${base}/`;
  return base;
}

/* -------------------------------------------------------------------------------------------- */
/* Reporting                                                                                     */
/* -------------------------------------------------------------------------------------------- */

/**
 * Render issues as an aligned text table.
 * @param {Issue[]} issues
 */
export function formatIssues(issues) {
  if (issues.length === 0) return '  (no issues)';
  const order = { error: 0, warning: 1, info: 2 };
  const sorted = [...issues].sort(
    (a, b) => order[a.level] - order[b.level] || a.file.localeCompare(b.file),
  );
  const fileWidth = Math.min(48, Math.max(...sorted.map((i) => i.file.length), 4));
  const rows = sorted.map((i) => {
    const level = i.level.toUpperCase().padEnd(7);
    const file = i.file.length > fileWidth ? `…${i.file.slice(-(fileWidth - 1))}` : i.file.padEnd(fileWidth);
    return `  ${level} ${file}  ${i.message}`;
  });
  return rows.join('\n');
}

/**
 * @param {Issue[]} issues
 */
export function summarize(issues) {
  const errors = issues.filter((i) => i.level === 'error').length;
  const warnings = issues.filter((i) => i.level === 'warning').length;
  const infos = issues.filter((i) => i.level === 'info').length;
  return { errors, warnings, infos };
}
