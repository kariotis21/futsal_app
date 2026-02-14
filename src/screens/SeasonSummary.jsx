import { useState, useEffect } from "react";
import jsPDF from "jspdf";

export default function SeasonSummary({ selectedTeam, setScreen }) {
  const [seasonStats, setSeasonStats] = useState(null);

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem("gameHistory") || "[]");
    const teamGames = history.filter(g => g.teamName === selectedTeam.name);

    if (teamGames.length === 0) {
      setSeasonStats({ games: 0 });
      return;
    }

    let wins = 0;
    let draws = 0;
    let losses = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;
    let foulsFor = 0;
    let foulsAgainst = 0;

    const playerStats = {};

    teamGames.forEach(game => {
        let gameGoalsFor = 0;
        let gameGoalsAgainst = 0;

        (game.timeline || []).forEach(ev => {
        if (ev.opponentGoal) {
            gameGoalsAgainst++;
        } else {
            gameGoalsFor++;
        }
        });

        goalsFor += gameGoalsFor;
        goalsAgainst += gameGoalsAgainst;

        // Determine win/draw/loss from recalculated goals
        if (gameGoalsFor > gameGoalsAgainst) wins++;
        else if (gameGoalsFor < gameGoalsAgainst) losses++;
        else draws++;

        (game.timeline || []).forEach(ev => {
            if (ev.opponentGoal) return;

            // Count goal
            if (ev.scorerId) {
                if (!playerStats[ev.scorerId]) {
                playerStats[ev.scorerId] = { goal: 0, assist: 0 };
                }
                playerStats[ev.scorerId].goal += 1;
            }

            // Count assist
            if (ev.assistId) {
                if (!playerStats[ev.assistId]) {
                playerStats[ev.assistId] = { goal: 0, assist: 0 };
                }
                playerStats[ev.assistId].assist += 1;
            }
            });


    });

    const contributors = Object.entries(playerStats)
      .filter(([, stats]) => (stats.goal || 0) > 0 || (stats.assist || 0) > 0)
      .map(([pid, stats]) => {
        const player = selectedTeam.players.find(p => String(p.id) === pid);
        return {
          name: player ? `#${player.id} ${player.name}` : `Unknown (${pid})`,
          goal: stats.goal,
          assist: stats.assist
        };
      })
      .sort((a, b) => b.goal - a.goal || b.assist - a.assist);

    setSeasonStats({
      games: teamGames.length,
      wins,
      draws,
      losses,
      winPct: teamGames.length ? ((wins / teamGames.length) * 100).toFixed(1) : "0.0",
      goalsFor,
      goalsAgainst,
      goalDiff: goalsFor - goalsAgainst,
      foulsFor,
      foulsAgainst,
      contributors
    });
  }, [selectedTeam]);

  // === EXPORT TO CSV ===
  const exportCSV = () => {
    if (!seasonStats) return;

    const rows = [];

    rows.push(["Futsal Coach Pro - Season Summary"]);
    rows.push(["Team", selectedTeam.name]);
    rows.push(["Games Played", seasonStats.games]);
    rows.push(["Record", `${seasonStats.wins}-${seasonStats.draws}-${seasonStats.losses}`]);
    rows.push(["Win %", `${seasonStats.winPct}%`]);
    rows.push(["Goals For", seasonStats.goalsFor]);
    rows.push(["Goals Against", seasonStats.goalsAgainst]);
    rows.push(["Goal Difference", seasonStats.goalDiff]);
    rows.push(["Fouls Committed", seasonStats.foulsFor]);
    rows.push(["Fouls Drawn", seasonStats.foulsAgainst]);
    rows.push([]);
    rows.push(["All Contributors"]);
    rows.push(["Player", "Goals", "Assists"]);

    seasonStats.contributors.forEach(p => {
      rows.push([p.name, p.goal, p.assist]);
    });

    const csv = rows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `season_summary_${selectedTeam.name.replace(/\s+/g, "_")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // === EXPORT TO PDF ===
  const exportPDF = () => {
    if (!seasonStats) return;

    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(20);
    doc.text("Season Summary", 14, y);
    y += 10;

    doc.setFontSize(14);
    doc.text(selectedTeam.name, 14, y);
    y += 10;

    doc.setFontSize(12);
    doc.text(`Games: ${seasonStats.games} | Record: ${seasonStats.wins}-${seasonStats.draws}-${seasonStats.losses} (${seasonStats.winPct}%)`, 14, y);
    y += 8;
    doc.text(`Goals: ${seasonStats.goalsFor} scored — ${seasonStats.goalsAgainst} conceded (Diff: ${seasonStats.goalDiff >= 0 ? "+" : ""}${seasonStats.goalDiff})`, 14, y);
    y += 8;
    doc.text(`Fouls: ${seasonStats.foulsFor} committed — ${seasonStats.foulsAgainst} drawn`, 14, y);
    y += 15;

    doc.setFontSize(14);
    doc.text("All Contributors", 14, y);
    y += 10;

    doc.setFontSize(12);
    seasonStats.contributors.forEach(p => {
      doc.text(`${p.name} — Goals: ${p.goal}, Assists: ${p.assist}`, 20, y);
      y += 8;
    });

    doc.save(`season_summary_${selectedTeam.name.replace(/\s+/g, "_")}.pdf`);
  };

  if (!seasonStats) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-3xl font-bold mb-4">Season Summary</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (seasonStats.games === 0) {
    return (
      <div className="p-6 text-center min-h-screen">
        <h1 className="text-3xl font-bold mb-4">Season Summary</h1>
        <h2 className="text-2xl mb-8">{selectedTeam.name}</h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          No games played yet this season.
        </p>
        <button
          className="mt-8 bg-blue-600 hover:bg-blue-700 text-white py-4 px-8 rounded-2xl text-xl shadow-lg transition"
          onClick={() => setScreen("manager")}
        >
          Back to Teams
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 pb-32 min-h-screen space-y-6">
      <h1 className="text-3xl font-bold text-center">Season Summary</h1>
      <h2 className="text-2xl text-center text-gray-600 dark:text-gray-400 mb-8">
        {selectedTeam.name}
      </h2>

      {/* RECORD CARD */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-900 dark:to-blue-950 p-6 rounded-2xl shadow-xl text-white">
        <h3 className="text-xl font-bold mb-4 text-center">Overall Record</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-4xl font-extrabold">{seasonStats.wins}</div>
            <div className="text-sm uppercase tracking-wider">Wins</div>
          </div>
          <div>
            <div className="text-4xl font-extrabold">{seasonStats.draws}</div>
            <div className="text-sm uppercase tracking-wider">Draws</div>
          </div>
          <div>
            <div className="text-4xl font-extrabold">{seasonStats.losses}</div>
            <div className="text-sm uppercase tracking-wider">Losses</div>
          </div>
        </div>
        <div className="text-center mt-6">
          <div className="text-2xl font-bold">
            {seasonStats.games} Games • {seasonStats.winPct}% Win Rate
          </div>
        </div>
      </div>

      {/* GOALS & FOULS */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-2xl shadow">
          <h3 className="text-xl font-semibold mb-4 text-center">Goals</h3>
          <div className="text-center">
            <div className="text-5xl font-bold">{seasonStats.goalsFor}</div>
            <div className="text-gray-600 dark:text-gray-400">Scored</div>
            <div className="text-3xl mt-4 font-bold text-red-600">– {seasonStats.goalsAgainst}</div>
            <div className="text-gray-600 dark:text-gray-400">Conceded</div>
            <div className={`text-2xl mt-4 font-bold ${seasonStats.goalDiff >= 0 ? "text-green-600" : "text-red-600"}`}>
              {seasonStats.goalDiff >= 0 ? "+" : ""}{seasonStats.goalDiff} Diff
            </div>
          </div>
        </div>

        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-2xl shadow">
          <h3 className="text-xl font-semibold mb-4 text-center">Fouls</h3>
          <div className="text-center">
            <div className="text-5xl font-bold">{seasonStats.foulsFor}</div>
            <div className="text-gray-600 dark:text-gray-400">Committed</div>
            <div className="text-3xl mt-4 font-bold text-orange-600">– {seasonStats.foulsAgainst}</div>
            <div className="text-gray-600 dark:text-gray-400">Drawn</div>
          </div>
        </div>
      </div>

      {/* ALL CONTRIBUTORS */}
      <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-2xl shadow">
        <h3 className="text-xl font-semibold mb-4 text-center">All Contributors</h3>
        {seasonStats.contributors.length === 0 ? (
          <p className="text-center text-gray-600 dark:text-gray-400">No goals or assists yet.</p>
        ) : (
          <div className="space-y-3">
            {seasonStats.contributors.map((player, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-700 p-4 rounded-xl shadow flex justify-between items-center"
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-gray-400">#{i + 1}</div>
                  <div className="font-bold text-lg">{player.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">⚽ {player.goal}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">🎯 {player.assist} assists</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* EXPORT BUTTONS */}
      <button
        className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl text-xl font-medium shadow-lg transition"
        onClick={exportCSV}
      >
        Export Season as CSV
      </button>

      <button
        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-2xl text-xl font-medium shadow-lg transition"
        onClick={exportPDF}
      >
        Export Season as PDF
      </button>

      {/* BACK BUTTON */}
      <button
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl text-xl font-medium shadow-lg transition"
        onClick={() => setScreen("manager")}
      >
        Back to Teams
      </button>
    </div>
  );
}