import { describe, expect, it } from 'vitest';
import { splitDisplay } from './displayTitle';

describe('splitDisplay', () => {
  it('puts the first word in the heavy half and the rest in the light half', () => {
    expect(splitDisplay('Присед без боли')).toEqual({ head: 'Присед', tail: 'без боли' });
    expect(splitDisplay('28 дней')).toEqual({ head: '28', tail: 'дней' });
  });
  it('keeps a one-word title all heavy', () => {
    expect(splitDisplay('База')).toEqual({ head: 'База', tail: '' });
  });
  it('normalises stray whitespace and empties', () => {
    expect(splitDisplay('  Корпус   и  планка ')).toEqual({ head: 'Корпус', tail: 'и планка' });
    expect(splitDisplay('   ')).toEqual({ head: '', tail: '' });
  });
});
