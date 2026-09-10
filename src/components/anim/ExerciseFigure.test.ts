/**
 * SSR contract: Astro renders ExerciseFigure on the server for landing cards, so the first render
 * must not touch browser APIs and must produce the t = 0 frame deterministically.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ExerciseFigure from './ExerciseFigure';
import { resetAnimationWarnings } from './lookup';

describe('ExerciseFigure (server render)', () => {
  afterEach(() => {
    resetAnimationWarnings();
    vi.restoreAllMocks();
  });

  it('renders a card tile with the course tile variable and an accessible label', () => {
    const html = renderToStaticMarkup(
      createElement(ExerciseFigure, {
        animation: 'air_squat',
        variant: 'card',
        tile: '#20293C',
        label: 'Air squat',
      }),
    );
    expect(html).toContain('hero-art');
    expect(html).toContain('size-[200px]');
    expect(html).toContain('--course-tile:#20293C');
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Air squat"');
    expect(html).toContain('viewBox="0 0 200 200"');
    expect(html).toContain('stroke="currentColor"');
    // The figure is drawn with `currentColor` — no ink value is ever baked into the markup.
    expect(html).not.toContain('#DCE9FA');
  });

  it('renders the hero variant filling its container', () => {
    const html = renderToStaticMarkup(
      createElement(ExerciseFigure, { animation: 'air_squat', variant: 'hero' }),
    );
    expect(html).toContain('w-full aspect-square');
    expect(html).toContain('aria-hidden="true"');
  });

  it('renders the thumb as a bare 72px svg with a tight viewBox', () => {
    const html = renderToStaticMarkup(
      createElement(ExerciseFigure, { animation: 'air_squat', variant: 'thumb' }),
    );
    expect(html.startsWith('<svg')).toBe(true);
    expect(html).toContain('width="72"');
    expect(html).not.toContain('hero-art');
    expect(html).not.toContain('viewBox="0 0 200 200"');
  });

  it('falls back to the standing pose for unknown ids and warns once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const a = renderToStaticMarkup(createElement(ExerciseFigure, { animation: 'nope_nope' }));
    const b = renderToStaticMarkup(createElement(ExerciseFigure, { animation: 'nope_nope' }));
    expect(a).toContain('<circle');
    expect(a).toBe(b);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('is deterministic for the same input (hydration-safe first frame)', () => {
    const el = () => createElement(ExerciseFigure, { animation: 'air_squat', speed: 2 });
    expect(renderToStaticMarkup(el())).toBe(renderToStaticMarkup(el()));
  });
});
