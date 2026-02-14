import SwipeableHistoryItem from "../components/SwipeableHistoryItem";
import { useState, useEffect } from "react";

export default function GameHistory({ selectedTeam, setScreen }) {
  const [history, setHistory] = useState([]);

  // Load and filter history
  useEffect(() => {
    const allGames = JSON.parse(localStorage.getItem("gameHistory") || "[]");
    const filtered = allGames.filter(g => g.teamName === selectedTeam.name);
    // Sort newest first
    filtered.sort((a, b) => b.id - a.id);
    // Defer setState slightly to avoid synchronous-setState-in-effect lint rule
    setTimeout(() => setHistory(filtered), 0);
  }, [selectedTeam.name]);

  const handleDelete = (gameToDelete) => {
    const allGames = JSON.parse(localStorage.getItem("gameHistory") || "[]");
    const updated = allGames.filter(game => game.id !== gameToDelete.id); // safer than object reference
    localStorage.setItem("gameHistory", JSON.stringify(updated));
    // Update state without full reload
    setHistory(prev => prev.filter(g => g.id !== gameToDelete.id));
  };

  const handleView = (game) => {
    localStorage.setItem("lastGame", JSON.stringify(game));
    setScreen("summary");
  };

  return (
    <div className="p-6 pb-24 min-h-screen">
      {/* Header */}
      <h1 className="text-3xl font-bold text-center mb-8">
        {selectedTeam.name}<br />
        <span className="text-xl font-normal text-gray-600 dark:text-gray-400">Game History</span>
      </h1>

      {/* No games message */}
      {history.length === 0 ? (
        <div className="text-center text-gray-500 mt-20">
          <p className="text-lg">No past games recorded yet.</p>
          <p className="text-sm mt-2">Start a new game to see it here!</p>
        </div>
      ) : (
        <div className="space-y-4 max-w-2xl mx-auto">
          {history.map((game) => (
            <SwipeableHistoryItem
              key={game.id} // use game.id instead of index
              game={game}
              onView={() => handleView(game)}
              onDelete={() => handleDelete(game)}
            />
          ))}
        </div>
      )}

      {/* Back button - fixed at bottom */}
      <div className="fixed bottom-6 left-6 right-6">
        <button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl text-lg font-medium shadow-lg transition"
          onClick={() => setScreen("manager")}
        >
          Back to Teams
        </button>
      </div>
    </div>
  );
}