/**
 * rehype plugin: rewrites `exercise:<id>`, `course:<id>` and `guide:<translationKey>` hrefs in
 * guide markdown to localized, base-prefixed URLs. The locale comes from the markdown file path
 * (content/guides/<ru|en>/…). Unknown targets are unwrapped to plain text and recorded in
 * CONTENT_LINK_WARNINGS (also printed with console.warn so the build log shows them).
 *
 * Registered in astro.config.mjs; deliberately free of Vite aliases and `import.meta.env`
 * because the config is evaluated outside the Astro/Vite alias context.
 */
import {
  CONTENT_LINK_RE,
  loadContentIndex,
  loadGuides,
  localizedHref,
  resolveContentLink,
} from '../../../scripts/seo/lib.mjs';

type Locale = 'ru' | 'en';

/** Minimal hast shape (structural; avoids depending on @types/hast). */
export interface HastNode {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
  value?: string;
}

interface VFileLike {
  path?: string;
  history?: string[];
}

export interface ContentLinkWarning {
  file: string;
  href: string;
  reason: string;
}

export interface RehypeContentLinksOptions {
  /** Project root containing content/ (default: process.cwd()). */
  root?: string;
  /** Site base path, e.g. "/forma/" (default: BASE_PATH env or "/"). */
  base?: string;
  /** How long the content index is cached between files, ms (default 2000). */
  ttlMs?: number;
}

/** Warnings collected during the build (unknown ids, missing locale versions). */
export const CONTENT_LINK_WARNINGS: ContentLinkWarning[] = [];

type Ctx = ReturnType<typeof loadContentIndex> & { guides: ReturnType<typeof loadGuides> };

let cache: { root: string; at: number; ctx: Ctx } | null = null;

function contentContext(root: string, ttlMs: number): Ctx {
  const now = Date.now();
  if (cache && cache.root === root && now - cache.at < ttlMs) return cache.ctx;
  const index = loadContentIndex(root);
  const ctx: Ctx = { ...index, guides: loadGuides(root) };
  cache = { root, at: now, ctx };
  return ctx;
}

/** Drop the cached content index (tests, watch mode). */
export function resetContentLinkCache(): void {
  cache = null;
}

export function localeFromPath(path: string): Locale {
  const m = path.match(/[\\/]guides[\\/](ru|en)[\\/]/);
  return m?.[1] === 'en' ? 'en' : 'ru';
}

function walk(
  node: HastNode,
  visit: (el: HastNode, parent: HastNode, index: number) => number | undefined,
): void {
  const children = node.children;
  if (!children) return;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (!child) continue;
    if (child.type === 'element') {
      const skip = visit(child, node, i);
      if (skip !== undefined) {
        i += skip - 1;
        continue;
      }
    }
    walk(child, visit);
  }
}

export default function rehypeContentLinks(options: RehypeContentLinksOptions = {}) {
  const root = options.root ?? process.cwd();
  const base = options.base ?? process.env.BASE_PATH ?? '/';
  const ttlMs = options.ttlMs ?? 2000;

  return function transformer(tree: HastNode, file: VFileLike): void {
    const path = file.path ?? file.history?.[0] ?? '';
    const locale = localeFromPath(path);
    let ctx: Ctx | null = null;

    walk(tree, (el, parent, index) => {
      if (el.tagName !== 'a') return undefined;
      const href = el.properties?.href;
      if (typeof href !== 'string' || !CONTENT_LINK_RE.test(href)) return undefined;
      ctx ??= contentContext(root, ttlMs);
      const resolved = resolveContentLink(href, locale, ctx);
      if (resolved && 'sitePath' in resolved) {
        el.properties = { ...el.properties, href: localizedHref(locale, resolved.sitePath, base) };
        return undefined;
      }
      const reason = resolved && 'error' in resolved ? resolved.error : `unresolvable "${href}"`;
      CONTENT_LINK_WARNINGS.push({ file: path, href, reason });
      console.warn(`[content-links] ${path}: ${reason}`);
      const replacement = el.children ?? [];
      parent.children?.splice(index, 1, ...replacement);
      return replacement.length;
    });
  };
}
