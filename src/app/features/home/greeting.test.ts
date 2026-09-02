import { describe, expect, it } from 'vitest';
import { dayPart, greetingName } from './greeting';

describe('dayPart', () => {
  it('maps hours to parts of the day', () => {
    expect(dayPart(5)).toBe('morning');
    expect(dayPart(11)).toBe('morning');
    expect(dayPart(12)).toBe('afternoon');
    expect(dayPart(16)).toBe('afternoon');
    expect(dayPart(17)).toBe('evening');
    expect(dayPart(22)).toBe('evening');
    expect(dayPart(23)).toBe('night');
    expect(dayPart(3)).toBe('night');
  });
});

describe('greetingName', () => {
  it('uses the first word of the display name', () => {
    expect(greetingName('Anna Petrova', 'anna@example.com')).toBe('Anna');
    expect(greetingName('  Иван ', 'x@y.z')).toBe('Иван');
  });
  it('falls back to the email local part', () => {
    expect(greetingName(null, 'coach.max@example.com')).toBe('coach.max');
    expect(greetingName('', 'x@y.z')).toBe('x');
  });
});
