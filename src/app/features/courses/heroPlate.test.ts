import { describe, expect, it } from 'vitest';
import { courseCardFrame, heroPlateClasses } from './heroPlate';

describe('the course card’s frame', () => {
  it('makes the hero taller, on the card radius, with the scrim under the plate', () => {
    const hero = courseCardFrame(true);
    expect(hero.article).toContain('aspect-[347/400]');
    expect(hero.article).toContain('rounded-card');
    expect(hero.scrim).toBe('photo-scrim');
  });

  it('keeps the other cards nearly square with the scrim over the top third', () => {
    const card = courseCardFrame(false);
    expect(card.article).toContain('aspect-[347/345]');
    expect(card.article).toContain('rounded-tile');
    expect(card.scrim).toBe('photo-scrim-top');
  });

  it('draws the hero’s plate as glass retinted for a photograph, never as the blue field', () => {
    const plate = heroPlateClasses().split(' ');
    expect(plate).toContain('glass-card');
    expect(plate).toContain('glass-card-on-art');
    expect(plate).not.toContain('bg-field');
  });
});
