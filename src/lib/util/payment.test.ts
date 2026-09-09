import { describe, expect, it } from 'vitest';
import { paymentTarget, withEmail } from './payment';

describe('paymentTarget', () => {
  it('accepts only absolute https links', () => {
    expect(paymentTarget('https://pay.example.com/p/1')?.href).toBe('https://pay.example.com/p/1');
    expect(paymentTarget('http://pay.example.com/p/1')).toBeNull();
    expect(paymentTarget('/pay')).toBeNull();
    expect(paymentTarget('javascript:alert(1)')).toBeNull();
    expect(paymentTarget('')).toBeNull();
    expect(paymentTarget(undefined)).toBeNull();
  });
});

describe('withEmail', () => {
  it('adds the email as a query parameter without touching the rest', () => {
    const target = paymentTarget('https://pay.example.com/p/1?utm=x')!;
    expect(withEmail(target, 'a+b@example.com')).toBe(
      'https://pay.example.com/p/1?utm=x&email=a%2Bb%40example.com',
    );
  });
  it('replaces an email already in the link', () => {
    const target = paymentTarget('https://pay.example.com/p/1?email=old@example.com')!;
    expect(withEmail(target, 'new@example.com')).toBe(
      'https://pay.example.com/p/1?email=new%40example.com',
    );
  });
});
