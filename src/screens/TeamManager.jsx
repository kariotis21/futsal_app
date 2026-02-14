import { useState, useEffect } from "react";
import BottomSheet from "../components/BottomSheet";
import Toast from "../components/Toast";


export default function TeamManager({ setScreen, setSelectedTeam }) {
  const [toast, setToast] = useState(null);
  const [teams, setTeams] = useState([]);
  const [sheetTeam, setSheetTeam] = useState(null);

  // Load saved teams
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("teams") || "[]");
    setTeams(saved);
  }, []);

  // Save teams anytime they change
  useEffect(() => {
    localStorage.setItem("teams", JSON.stringify(teams));
  }, [teams]);

  function addTeam() {
    const name = prompt("Enter team name:");
    if (!name?.trim()) return;

    const newTeam = {
      name: name.trim(),
      players: []
    };

    setTeams([...teams, newTeam]);
  }

  return (
    <div className="p-6 pb-32 min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* APP LOGO */}
      <div className="flex justify-center mb-8 mt-8">
        <img
          src="/app_logo.png"
          alt="Futsal Coach Pro"
          className="h-40 object-contain drop-shadow-2xl"
        />
      </div>

      <h1 className="text-4xl font-bold text-center mb-10">
        My Teams
      </h1>

      {teams.length === 0 ? (
        /* =============== NO TEAMS — FIRST-TIME SETUP =============== */
        <div className="text-center mt-20 space-y-6 max-w-md mx-auto">
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">
            Welcome to Futsal Coach Pro!<br />
            Get started by creating a team or importing a backup.
          </p>

          <button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl text-2xl font-bold shadow-lg transition active:scale-95"
            onClick={addTeam}
          >
            Create First Team
          </button>

          <label className="w-full block bg-purple-600 hover:bg-purple-700 text-white py-5 rounded-2xl text-2xl font-bold text-center cursor-pointer shadow-lg transition">
            Import Backup
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (event) => {
                  try {
                    const backup = JSON.parse(event.target.result);

                    if (!backup || typeof backup !== "object") throw new Error();

                    if (Array.isArray(backup.teams)) {
                      localStorage.setItem("teams", JSON.stringify(backup.teams));
                    }
                    if (Array.isArray(backup.gameHistory)) {
                      localStorage.setItem("gameHistory", JSON.stringify(backup.gameHistory));
                    }
                    if (backup.lastGame) {
                      localStorage.setItem("lastGame", backup.lastGame);
                    }

                    setToast("Backup restored successfully!\nThe app will now refresh.");
                    setTimeout(() => window.location.reload(),1000);
                  } catch {
                    alert("Invalid backup file. Please select a valid Futsal Coach Pro backup.");
                  }
                };
                reader.readAsText(file);
              }}
            />
          </label>
        </div>
      ) : (
        /* =============== TEAMS EXIST — NORMAL VIEW =============== */
        <>
          <div className="space-y-4 max-w-md mx-auto">
            {teams.map((team) => (
              <button
                key={team.name}
                className="w-full bg-white dark:bg-gray-800 rounded-2xl p-5 text-left flex justify-between items-center shadow-lg hover:shadow-xl transition"
                onClick={() => setSheetTeam(team)}
              >
                <span className="text-2xl font-semibold">
                  {team.name}
                </span>
                <span className="text-3xl text-gray-400">›</span>
              </button>
            ))}

            <button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl text-2xl font-bold shadow-lg transition active:scale-95"
              onClick={addTeam}
            >
              + Add New Team
            </button>
          </div>

          {/* EXPORT ONLY — Safe from accidental import */}
          <div className="mt-12 max-w-md mx-auto">
            <button
              className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl text-xl font-medium shadow-lg transition"
              onClick={() => {
                const backupData = {
                  teams: JSON.parse(localStorage.getItem("teams") || "[]"),
                  gameHistory: JSON.parse(localStorage.getItem("gameHistory") || "[]"),
                  lastGame: localStorage.getItem("lastGame") || null,
                };

                const dataStr = JSON.stringify(backupData, null, 2);
                const blob = new Blob([dataStr], { type: "application/json" });
                const url = URL.createObjectURL(blob);

                const link = document.createElement("a");
                link.href = url;
                link.download = `futsal_coach_pro_backup_${new Date().toISOString().slice(0,10)}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                setToast("Backup created!\n\n" +
                  "On iPhone: The file will open in a new tab.\n" +
                  "Tap the Share button → 'Save to Files' (or Downloads) to keep it.\n\n" +
                  "On Android/Desktop: It downloads automatically.");
              }}
            >
              Export All Data (Backup)
            </button>
          </div>
        </>
      )}

      {/* Action Sheet */}
      {sheetTeam && (
        <BottomSheet onClose={() => setSheetTeam(null)}>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center mb-6">
              {sheetTeam.name}
            </h2>

            <button
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl text-lg font-medium transition"
              onClick={() => {
                const newName = prompt("Rename team:", sheetTeam.name);
                if (newName && newName.trim() && newName.trim() !== sheetTeam.name) {
                  setTeams(prev => prev.map(t => 
                    t === sheetTeam ? { ...t, name: newName.trim() } : t
                  ));
                }
                setSheetTeam(null);
              }}
            >
              Rename Team
            </button>

            <button
              className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 py-4 rounded-xl text-lg font-medium transition"
              onClick={() => {
                setSelectedTeam(sheetTeam);
                setScreen("editor");
                setSheetTeam(null);
              }}
            >
              Edit Players
            </button>

            <button
              className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl text-lg font-medium transition active:scale-95"
              onClick={() => {
                setSelectedTeam(sheetTeam);
                setScreen("game");
                setSheetTeam(null);
              }}
            >
              Start Game
            </button>

            <button
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl text-lg font-medium transition"
              onClick={() => {
                setSelectedTeam(sheetTeam);
                setScreen("history");
                setSheetTeam(null);
              }}
            >
              View Game History
            </button>

            <button
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-xl text-lg font-medium transition"
              onClick={() => {
                setSelectedTeam(sheetTeam);
                setScreen("season");
                setSheetTeam(null);
              }}
            >
              Season Summary
            </button>

            <button
              className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl text-lg font-medium transition"
              onClick={() => {
                if (confirm(`Delete "${sheetTeam.name}" and all its games? This cannot be undone.`)) {
                  setTeams(teams.filter(t => t !== sheetTeam));
                  setSheetTeam(null);
                }
              }}
            >
              Delete Team
            </button>

            <button
              className="w-full bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 py-4 rounded-xl text-lg font-medium transition"
              onClick={() => setSheetTeam(null)}
            >
              Cancel
            </button>
          </div>
        </BottomSheet>
      )}

      <Toast
      message={toast}
      onClose={() => setToast(null)}
    />
    </div>
    
  );


}