import { describe, it, expect } from 'vitest';

describe('Undo Stack Functionality', () => {
  it('should store and retrieve undo snapshots', () => {
    let undoStack = [];
    
    // Simulate state changes and undo snapshots
    const state1 = { goals: 0 };
    const state2 = { goals: 1 };
    const state3 = { goals: 2 };
    
    // Push snapshots to undo stack (keep last 10)
    undoStack = [state1, ...undoStack].slice(0, 10);
    undoStack = [state2, ...undoStack].slice(0, 10);
    undoStack = [state3, ...undoStack].slice(0, 10);
    
    expect(undoStack.length).toBe(3);
    expect(undoStack[0]).toEqual(state3);
    expect(undoStack[undoStack.length - 1]).toEqual(state1);
  });

  it('should limit undo history to 10 entries', () => {
    let undoStack = [];
    
    // Add 15 entries
    for (let i = 0; i < 15; i++) {
      undoStack = [{ value: i }, ...undoStack].slice(0, 10);
    }
    
    expect(undoStack.length).toBe(10);
    expect(undoStack[0].value).toBe(14); // Most recent
    expect(undoStack[9].value).toBe(5);  // Oldest (after trimming)
  });

  it('should handle undo pop correctly', () => {
    const undoStack = [
      { goals: 3 },
      { goals: 2 },
      { goals: 1 },
      { goals: 0 }
    ];
    
    const nextState = undoStack[0];
    const remainingStack = undoStack.slice(1);
    
    expect(nextState.goals).toBe(3);
    expect(remainingStack.length).toBe(3);
  });
});
