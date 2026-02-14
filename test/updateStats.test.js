import { describe, it, expect } from 'vitest';
import { updatePlayerStatsForEdit } from '../src/lib/gameUtils';

describe('updatePlayerStatsForEdit', () => {
  it('updates stats by removing old event and adding new', () => {
    const current = { '10': { goal: 2, assist: 0 }, '9': { assist: 1 } };
    const oldEvent = { scorerId: 10, assistId: 9, opponentGoal: false };
    const updated = updatePlayerStatsForEdit(current, oldEvent, 11, 12);
    expect(updated['10'].goal).toBe(1);
    expect(updated['9'].assist).toBe(0);
    expect(updated['11'].goal).toBe(1);
    expect(updated['12'].assist).toBe(1);
  });
});
