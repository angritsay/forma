/**
 * Component-level render of the slot picker (there is no browser in CI to screenshot it): every
 * state `SlotPickerView` can be handed, rendered to markup on the server.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SlotPickerView, type SlotPickerViewProps } from './SlotPicker';

const MSK = 'Europe/Moscow';
/** Monday 5 Oct 2026, 09:00 in Moscow. */
const NOW = Date.parse('2026-10-05T06:00:00Z');

const SLOTS = [
  { startsAt: '2026-10-05T07:00:00Z', endsAt: '2026-10-05T07:30:00Z' },
  { startsAt: '2026-10-05T07:30:00Z', endsAt: '2026-10-05T08:00:00Z' },
  { startsAt: '2026-10-07T15:00:00Z', endsAt: '2026-10-07T15:30:00Z' },
];

function render(patch: Partial<SlotPickerViewProps> = {}): string {
  const props: SlotPickerViewProps = {
    state: { kind: 'ready', slots: SLOTS },
    now: NOW,
    timeZone: MSK,
    day: null,
    onDay: () => {},
    value: null,
    onPick: () => {},
    onRetry: () => {},
    ...patch,
  };
  return renderToStaticMarkup(createElement(SlotPickerView, props));
}

const count = (html: string, needle: string) => html.split(needle).length - 1;

describe('SlotPickerView', () => {
  it('draws fourteen days, disables the empty ones, and opens the first day with time', () => {
    const html = render();
    expect(count(html, 'role="radio"')).toBe(14);
    expect(count(html, 'disabled=""')).toBe(12);
    expect(html).toContain('aria-checked="true"');
    // Today's two times, on the device's clock.
    expect(html).toContain('>10:00<');
    expect(html).toContain('>10:30<');
    expect(html).not.toContain('>18:00<');
  });

  it('shows the picked day and marks the picked time', () => {
    const html = render({ day: '2026-10-07', value: '2026-10-07T15:00:00Z' });
    expect(html).toContain('>18:00<');
    expect(html).not.toContain('>10:00<');
    expect(html).toContain('aria-pressed="true"');
  });

  it('says what is empty, what failed, and waits while loading', () => {
    expect(render({ state: { kind: 'ready', slots: [] }, empty: 'WRITE' })).toContain('WRITE');
    expect(render({ state: { kind: 'error' } })).toContain('<button');
    expect(render({ state: { kind: 'loading' } })).toContain('aria-busy="true"');
  });
});
