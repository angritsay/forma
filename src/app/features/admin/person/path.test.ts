import { describe, expect, it } from 'vitest';
import { emailFromParam, personPath } from './path';

describe('personPath', () => {
  it('encodes the address and normalises case', () => {
    expect(personPath(' Nastia+club@Example.com ')).toBe(
      '/admin/people/nastia%2Bclub%40example.com',
    );
  });
});

describe('emailFromParam', () => {
  it('round-trips through personPath', () => {
    for (const email of ['a@b.co', 'nastia+club@example.com', 'first.last@mail.example.org']) {
      const param = personPath(email).slice('/admin/people/'.length);
      expect(emailFromParam(param)).toBe(email);
    }
  });

  it('accepts a parameter the router has already decoded', () => {
    expect(emailFromParam('Nastia+club@example.com')).toBe('nastia+club@example.com');
  });

  it('rejects what is not an address, and malformed escapes, without throwing', () => {
    expect(emailFromParam(undefined)).toBeNull();
    expect(emailFromParam('')).toBeNull();
    expect(emailFromParam('nobody')).toBeNull();
    expect(emailFromParam('%E0%A4%A')).toBeNull();
    expect(emailFromParam('%zz@example.com')).toBeNull();
  });
});
