import { useState, useEffect } from "react";
import BottomSheet from "../components/BottomSheet";

export default function TeamEditor({ selectedTeam, setScreen }) {
  const [players, setPlayers] = useState([]);
  const [sheetPlayer, setSheetPlayer] = useState(null); // null = add new, object = edit existing

  // Load players from selected team
  useEffect(() => {
    if (selectedTeam?.players) {
      // Sort by number (treat as string to keep leading zeros)
      const sorted = [...selectedTeam.players].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
      // Defer setState slightly to avoid synchronous-setState-in-effect lint rule
      setTimeout(() => setPlayers(sorted), 0);
    }
  }, [selectedTeam]);

  // Save updated players back to localStorage
  useEffect(() => {
    if (!selectedTeam) return;

    const teams = JSON.parse(localStorage.getItem("teams") || "[]");
    const updatedTeams = teams.map((t) =>
      t.name === selectedTeam.name ? { ...t, players } : t
    );
    localStorage.setItem("teams", JSON.stringify(updatedTeams));
  }, [players, selectedTeam]);

  function deletePlayer(playerToDelete) {
    if (confirm(`Delete player #${playerToDelete.id} — ${playerToDelete.name}?`)) {
      setPlayers(players.filter((p) => p !== playerToDelete));
    }
  }

  // Improved CSV Import - handles quoted fields and extra commas
  function handleCSV(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.trim().split(/\r?\n/);

      if (lines.length < 2) {
        alert("CSV must have headers and at least one player.");
        return;
      }

      // Simple CSV parser that respects quotes
      const parseCSVLine = (line) => {
        const result = [];
        let current = "";
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === "," && !inQuotes) {
            result.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const headers = parseCSVLine(lines[0].toLowerCase());
      const numIndex = headers.indexOf("number");
      const nameIndex = headers.indexOf("name");

      if (numIndex === -1 || nameIndex === -1) {
        alert("CSV must have 'number' and 'name' columns (case-insensitive).");
        return;
      }

      const imported = lines.slice(1)
        .map(line => parseCSVLine(line))
        .filter(cols => cols[numIndex] && cols[nameIndex])
        .map(cols => ({
          id: cols[numIndex].trim(),
          name: cols[nameIndex].trim()
        }));

      if (imported.length === 0) {
        alert("No valid players found in CSV.");
        return;
      }

      if (confirm(`Import ${imported.length} players? This will replace current roster.`)) {
        setPlayers(imported);
      }
    };

    reader.readAsText(file);
  }

  return (
    <div className="p-6 pb-32 min-h-screen">
      {/* Header */}
      <h1 className="text-3xl font-bold text-center mb-8">
        {selectedTeam?.name}
      </h1>

      
            {/* Player List */}
      {players.length === 0 ? (
        <div className="text-center mt-20">
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-8">
            No players yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-w-lg mx-auto pb-48">
          {players.map((player) => (
            <div
              key={player.id}
              className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg flex items-center justify-between hover:shadow-xl transition"
            >
              {/* Number + Name on same line */}
              <div className="flex items-baseline gap-3">
                <span className="text-xl font-bold text-gray-800 dark:text-gray-200">
                  #{player.id}
                </span>
                <span className="text-xl font-medium text-black dark:text-white">
                  {player.name}
                </span>
              </div>

              {/* Edit / Delete buttons */}
              <div className="flex gap-6">
                <button
                  className="text-blue-600 font-medium text-lg"
                  onClick={() => setSheetPlayer({
                    ...player,
                    originalId: player.id
                  })}
                >
                  Edit
                </button>
                <button
                  className="text-red-600 font-medium text-lg"
                  onClick={() => deletePlayer(player)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}





      {/* Add Player Button */}
      <div className="fixed bottom-6 left-6 right-6 space-y-3">
        <button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl text-xl font-medium shadow-lg transition active:scale-95"
          onClick={() => setSheetPlayer({ id: "", name: "" })} // empty = add mode
        >
          + Add Player
        </button>

        <label className="w-full block bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl text-xl font-medium text-center cursor-pointer shadow-lg transition">
          Import from CSV
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleCSV}
          />
        </label>

        <button
          className="w-full bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-black dark:text-white py-4 rounded-2xl text-xl font-medium shadow-lg transition"
          onClick={() => setScreen("manager")}
        >
          ← Back to Teams
        </button>
      </div>

      {/* SINGLE PLAYER SHEET — Add or Edit */}
      {sheetPlayer && (
        <BottomSheet onClose={() => setSheetPlayer(null)}>
          <h2 className="text-2xl font-bold text-center mb-6">
            {sheetPlayer.id ? "Edit Player" : "Add New Player"}
          </h2>

          <div className="space-y-5">
            {/* Number */}
            <div>
              <label className="block text-lg font-semibold mb-2">Number</label>
              <input
                type="text"
                value={sheetPlayer.id}
                onChange={(e) =>
                  setSheetPlayer({ ...sheetPlayer, id: e.target.value })
                }
                className="w-full p-4 rounded-xl bg-gray-100 dark:bg-gray-800 text-lg text-center"
                placeholder="e.g. 10"
                autoFocus
              />
            </div>

            {/* Name */}
              <div>
                <label className="block text-lg font-semibold mb-2">Name</label>
                <input
                  type="text"
                  value={sheetPlayer.name}
                  onChange={(e) => {
                    let value = e.target.value;

                    // Capitalize after space or at start
                    value = value
                      .split(' ')
                      .map(word => word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : '')
                      .join(' ');

                    setSheetPlayer({ ...sheetPlayer, name: value });
                  }}
                  className="w-full p-4 rounded-xl bg-gray-100 dark:bg-gray-800 text-lg"
                  placeholder="Player name"
                />
              </div>

            {/* Save Button */}
<button
  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl text-xl font-medium shadow-lg transition active:scale-95"
  onClick={() => {
    const trimmedId = sheetPlayer.id.trim();
    const trimmedName = sheetPlayer.name.trim();

    if (!trimmedId || !trimmedName) {
      alert("Both number and name are required.");
      return;
    }

    // Check for duplicate number (except self when editing)
    const isDuplicate = players.some(p => 
      p.id === trimmedId && 
      (!sheetPlayer.originalId || p.id !== sheetPlayer.originalId)
    );

    if (isDuplicate) {
      alert("A player with this number already exists.");
      return;
    }

    if (sheetPlayer.originalId) {
      // EDITING: find by original ID (stored when opening edit)
      setPlayers(players.map(p => 
        p.id === sheetPlayer.originalId 
          ? { id: trimmedId, name: trimmedName }
          : p
      ));
    } else {
      // ADDING new player
      setPlayers([...players, { id: trimmedId, name: trimmedName }]);
    }

    setSheetPlayer(null);
  }}
>
  {sheetPlayer.originalId ? "Save Changes" : "Add Player"}
</button>





            <button
              className="w-full bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 py-4 rounded-xl text-xl font-medium transition"
              onClick={() => setSheetPlayer(null)}
            >
              Cancel
            </button>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}