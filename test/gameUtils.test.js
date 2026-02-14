import { describe, it, expect } from 'vitest';
import { recalcScoresFromTimeline, recalcPlayerStatsFromTimeline } from '../src/lib/gameUtils';

describe('gameUtils', () => {
  it('recalculates scores correctly', () => {
    const timeline = [
      { opponentGoal: false },
      { opponentGoal: true },
      { opponentGoal: false }
    ];
    const res = recalcScoresFromTimeline(timeline);
    expect(res).toEqual({ team: 2, opp: 1 });
  });

  it('recalculates player stats correctly', () => {
    const timeline = [
      { opponentGoal: false, scorerId: 10, assistId: 9 },
      { opponentGoal: false, scorerId: 10, assistId: null },
      { opponentGoal: true },
      { opponentGoal: false, scorerId: 11, assistId: 9 }
    ];

    const stats = recalcPlayerStatsFromTimeline(timeline);
    expect(stats['10'].goal).toBe(2);
    expect(stats['9'].assist).toBe(2);
    expect(stats['11'].goal).toBe(1);
  });
});
