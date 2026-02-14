import React, { useState, useMemo, useRef, useEffect } from "react";
import BottomSheet from "./BottomSheet";

export default function GoalScorerSheet({
  players,
  onSelect,
  onClose,
  onAddGuestPlayer,
  preselectedId
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return players;
    return players.filter(p => `${p.id} ${p.name}`.toLowerCase().includes(q));
  }, [players, query]);

  const [focused, setFocused] = useState(-1);
  const itemRefs = useRef([]);

  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, filtered.length);
    if (focused >= 0 && itemRefs.current[focused]) {
      itemRefs.current[focused].focus();
    }
  }, [filtered, focused]);

  function handleListKey(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocused(i => Math.min(filtered.length - 1, Math.max(0, i + 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocused(i => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      if (focused >= 0 && filtered[focused]) {
        onSelect(filtered[focused].id);
      }
    }
  }

  return (
    <BottomSheet onClose={onClose} labelledById="scorer-sheet-title">
      <div className="text-center space-y-4">
        <h2 id="scorer-sheet-title" className="text-xl font-bold">Select Goal Scorer</h2>

        <input
          aria-label="Search players"
          placeholder="Search players..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        />

        {/* PLAYER LIST */}
        <div tabIndex={0} onKeyDown={handleListKey} className="space-y-2 max-h-[55vh] overflow-y-auto px-2 pointer-events-auto">
          {filtered.map((p, index) => (
            <button
              key={p.id}
              ref={el => itemRefs.current[index] = el}
              tabIndex={-1}
              className={`w-full py-3 rounded-xl text-lg text-left px-4 ${String(p.id) === String(preselectedId) ? 'bg-yellow-200 dark:bg-yellow-700' : 'bg-gray-200 dark:bg-gray-700'} text-black dark:text-white cursor-pointer touch-manipulation active:bg-gray-300 dark:active:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
              onClick={() => onSelect(p.id)}
              type="button"
            >
              #{p.id} — {p.name}
            </button>
          ))}

          {/* ⭐ ADD PLAYER BUTTON */}
          <button
            className="w-full bg-blue-600 text-white py-3 rounded-xl text-lg mt-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            onClick={() => {
              onClose();
              onAddGuestPlayer();
            }}
            type="button"
          >
            + Add Player
          </button>
        </div>

        {/* CANCEL BUTTON */}
        <button
          className="w-full bg-gray-400 dark:bg-gray-600 py-3 rounded-xl text-lg text-white mt-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          onClick={onClose}
          type="button"
        >
          Cancel
        </button>
      </div>
    </BottomSheet>
  );
}
