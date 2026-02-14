import { describe, it, expect } from 'vitest';
import { addOrUpdateGuest } from '../src/lib/guestUtils';

describe('guestUtils', () => {
  it('adds a new guest', () => {
    const team = [{ id: 1, name: 'A' }];
    const guests = [];
    const next = addOrUpdateGuest(guests, { id: 99, name: 'Guest' }, team);
    expect(next.length).toBe(1);
    expect(next[0].id).toBe('99');
  });

  it('prevents duplicate team number', () => {
    const team = [{ id: 1, name: 'A' }];
    const guests = [];
    expect(() => addOrUpdateGuest(guests, { id: 1, name: 'X' }, team)).toThrow();
  });
});
