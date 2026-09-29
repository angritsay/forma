import { describe, expect, it } from 'vitest';
import { SITE_COURSES } from '@/content/published';
import { appHref } from '@/lib/util/paths';
import {
  notFoundAliases,
  notFoundConfig,
  notFoundScript,
  resolveNotFound,
  type NotFoundConfig,
} from './notFoundRedirect';

const start = SITE_COURSES.find((c) => c.id === 'start')!;
const COURSE_RU = `/courses/${start.slug.ru}/`;
const COURSE_EN = `/en/courses/${start.slug.en}/`;

const cfg: NotFoundConfig = notFoundConfig([
  '/',
  '/en/',
  '/about/',
  '/en/about/',
  '/subscribe/',
  '/en/subscribe/',
  '/courses/',
  '/en/courses/',
  COURSE_RU,
  COURSE_EN,
]);

function go(url: string, config: NotFoundConfig = cfg): string | null {
  const u = new URL(url, 'https://forma-app.co');
  return resolveNotFound({ pathname: u.pathname, search: u.search, hash: u.hash }, config);
}

describe('resolveNotFound', () => {
  it('maps the short links to their pages', () => {
    expect(go('/start')).toBe(appHref('/start', { locale: 'ru' }));
    expect(go('/APP')).toBe('/app/');
    expect(go('/club')).toBe('/subscribe/');
    expect(go('/coach')).toBe('/about/');
    expect(go('/trainer/')).toBe('/about/');
    expect(go('/together')).toBe('/#together');
    expect(go('/courses/start/')).toBe(COURSE_RU);
    expect(go('/course')).toBe(COURSE_RU);
    expect(go('/kurs')).toBe(COURSE_RU);
  });

  it('maps the English short links to the English pages', () => {
    expect(go('/en/start')).toBe(appHref('/start', { locale: 'en' }));
    expect(go('/en/app')).toBe(appHref('', { locale: 'en' }));
    expect(go('/en/club')).toBe('/en/subscribe/');
    expect(go('/en/coach')).toBe('/en/about/');
    expect(go('/en/together')).toBe('/en/#together');
    expect(go('/en/courses/start/')).toBe(COURSE_EN);
  });

  it('forgives case, a missing slash and index.html', () => {
    expect(go('/About')).toBe('/about/');
    expect(go('/CLUB/')).toBe('/subscribe/');
    expect(go('/EN/About')).toBe('/en/about/');
    expect(go('/about/index.html')).toBe('/about/');
    expect(go('/about.html')).toBe('/about/');
    expect(go(COURSE_RU.slice(0, -1).toUpperCase())).toBe(COURSE_RU);
  });

  it('drops a /ru/ prefix: Russian has none', () => {
    expect(go('/ru/about/')).toBe('/about/');
    expect(go('/ru/')).toBe('/');
    expect(go('/RU/start')).toBe(appHref('/start', { locale: 'ru' }));
  });

  it('drops the old /forma/ project prefix', () => {
    expect(go('/forma/')).toBe('/');
    expect(go('/forma/about/')).toBe('/about/');
    expect(go('/forma/en/club')).toBe('/en/subscribe/');
  });

  it('keeps the query and the hash', () => {
    expect(go('/Club?utm_source=ig&fbclid=x#faq')).toBe('/subscribe/?utm_source=ig&fbclid=x#faq');
    expect(go('/start?utm_source=ig')).toBe('/app/?lang=ru&utm_source=ig#/start');
    expect(go('/start?lang=en')).toBe('/app/?lang=ru#/start');
    expect(go('/together?fbclid=1#x')).toBe('/?fbclid=1#together');
  });

  it('stays on the 404 for unknown paths, off pages and the page itself', () => {
    expect(go('/nope/')).toBeNull();
    expect(go('/en/nope')).toBeNull();
    expect(go('/fr/about/')).toBeNull();
    expect(go('/%E0%A4%A/')).toBeNull();
    const noPlans = { ...cfg, routes: cfg.routes.filter((r) => !r.includes('subscribe')) };
    expect(go('/club', noPlans)).toBeNull();
    expect(go('/about/')).toBeNull();
  });

  it('strips a deploy base and never points outside it', () => {
    const based = { ...cfg, base: '/forma-preview/' };
    expect(go('/forma-preview/About', based)).toBe('/forma-preview/about/');
    expect(go('/forma-preview', based)).toBe('/forma-preview/');
    expect(go('/forma-preview/club?x=1', based)).toBe('/forma-preview/subscribe/?x=1');
    expect(go('/forma-preview/about/', based)).toBeNull();
  });
});

describe('notFoundAliases', () => {
  it('has the same keys in every locale', () => {
    expect(Object.keys(notFoundAliases('en'))).toEqual(Object.keys(notFoundAliases('ru')));
  });
});

describe('notFoundScript', () => {
  it('runs the serialised resolver and redirects', () => {
    let replaced: string | null = null;
    const location = {
      pathname: '/Coach',
      search: '?utm_source=ig',
      hash: '',
      replace: (to: string) => {
        replaced = to;
      },
    };
    new Function('location', notFoundScript(cfg))(location);
    expect(replaced).toBe('/about/?utm_source=ig');
  });

  it('does nothing for an unknown path', () => {
    let replaced: string | null = null;
    const location = {
      pathname: '/nope',
      search: '',
      hash: '',
      replace: (to: string) => (replaced = to),
    };
    new Function('location', notFoundScript(cfg))(location);
    expect(replaced).toBeNull();
  });

  it('cannot close its own script element', () => {
    const evil = { ...cfg, routes: [...cfg.routes, '/</script><b>/'] };
    expect(notFoundScript(evil)).not.toContain('</script>');
  });
});
