import { useState, useEffect } from "react";
import GoalScorerSheet from "../components/GoalScorerSheet";
import AssistSelectorSheet from "../components/AssistSelectorSheet";
import BottomSheet from "../components/BottomSheet";
import Toast from "../components/Toast";
import Button from "../components/Button";



export default function GameScreen({ selectedTeam, setScreen }) {
  //
  // ===========================
  // GAME + TIMER STATE
  // ===========================
  //
  const [half, setHalf] = useState(1);
  const [toast, setToast] = useState(null);

  // Timestamp-based timer (accurate even after sleep/background)
  const [running, setRunning] = useState(false);
  const [startTimestamp, setStartTimestamp] = useState(null);
  const [pausedTimestamp, setPausedTimestamp] = useState(null);
  const [totalPausedTime, setTotalPausedTime] = useState(0);
  const [initialTime, setInitialTime] = useState(20 * 60 * 1000); // 20 min in ms

  const [isOvertime, setIsOvertime] = useState(false);

  // For smooth UI ticking (store current timestamp)
  const [now, setNow] = useState(() => Date.now());

  //
  // SCORE + FOULS
  //
  const [teamScore, setTeamScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);
  const [teamFouls, setTeamFouls] = useState(0);
  const [oppFouls, setOppFouls] = useState(0);

  //
  // PLAYER STATS + GOAL EVENTS
  //
  const [playerStats, setPlayerStats] = useState({});
  const [goalEvents, setGoalEvents] = useState([]);
  const [goalTimeline, setGoalTimeline] = useState([]);

  //
  // GUEST PLAYERS
  //
  const [guestPlayers, setGuestPlayers] = useState([]);
  const [showGuestPlayerSheet, setShowGuestPlayerSheet] = useState(false);
  const [guestNumber, setGuestNumber] = useState("");
  const [guestName, setGuestName] = useState("");

  //
  // FIRST HALF SNAPSHOT
  //
  const [firstHalfTeamScore, setFirstHalfTeamScore] = useState(0);
  const [firstHalfOppScore, setFirstHalfOppScore] = useState(0);
  const [firstHalfTeamFouls, setFirstHalfTeamFouls] = useState(0);
  const [firstHalfOppFouls, setFirstHalfOppFouls] = useState(0);

  //
  // UI STATE
  //
  const [showScorerSheet, setShowScorerSheet] = useState(false);
  const [showAssistSheet, setShowAssistSheet] = useState(false);
  const [pendingScorer, setPendingScorer] = useState(null);
  const [showTimeChanger, setShowTimeChanger] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [opponentName, setOpponentName] = useState("");
  const [opponentNameSet, setOpponentNameSet] = useState(false);

  //
  // TIMEOUTS
  //
  const [teamTimeoutUsed, setTeamTimeoutUsed] = useState(false);
  const [oppTimeoutUsed, setOppTimeoutUsed] = useState(false);

  //
  // ===========================
  // AUTO-RESTORE GAME
  // ===========================
  //
  useEffect(() => {
    const lastCompleted = localStorage.getItem("lastGameCompleted");
    if (lastCompleted === "true") {
      localStorage.removeItem("lastGameCompleted");
      // Force fresh state (defer to avoid setState-in-effect lint rule)
      setTimeout(() => {
        setStartTimestamp(null);
        setPausedTimestamp(null);
        setTotalPausedTime(0);
        setInitialTime(20 * 60 * 1000);
        setRunning(false);
        setHalf(1);
        setTeamScore(0);
        setOppScore(0);
        setTeamFouls(0);
        setOppFouls(0);
        setPlayerStats({});
        setGoalEvents([]);
        setGoalTimeline([]);
        setGuestPlayers([]);
        setOpponentName("");
        setTeamTimeoutUsed(false);
        setOppTimeoutUsed(false);
      }, 0);
      return;
    }

    const saved = localStorage.getItem("activeGameState");
    if (!saved) {
      // Defer state reset to avoid setState-in-effect lint rule
      setTimeout(() => {
        setStartTimestamp(null);
        setPausedTimestamp(null);
        setTotalPausedTime(0);
        setInitialTime(20 * 60 * 1000);
        setRunning(false);
        setHalf(1);
      }, 0);
      return;
    }

    const s = JSON.parse(saved);
    if (s.selectedTeamName !== selectedTeam.name) {
      // Defer state reset to avoid setState-in-effect lint rule
      setTimeout(() => {
        setStartTimestamp(null);
        setPausedTimestamp(null);
        setTotalPausedTime(0);
        setInitialTime(20 * 60 * 1000);
        setRunning(false);
        setHalf(1);
      }, 0);
      return;
    }

    // Defer multiple state updates to avoid setState-in-effect lint rule
    setTimeout(() => {
      setHalf(s.half);
      setRunning(false);
      setStartTimestamp(s.startTimestamp);
      setPausedTimestamp(s.pausedTimestamp);
      setTotalPausedTime(s.totalPausedTime);
      setInitialTime(s.initialTime);

      setTeamScore(s.teamScore);
      setOppScore(s.oppScore);
      setTeamFouls(s.teamFouls);
      setOppFouls(s.oppFouls);
      setOpponentName(s.opponentName || "");

      setPlayerStats(s.playerStats || {});
      setGoalEvents(s.goalEvents || []);
      setGoalTimeline(s.goalTimeline || []);

      setFirstHalfTeamScore(s.firstHalfTeamScore || 0);
      setFirstHalfOppScore(s.firstHalfOppScore || 0);
      setFirstHalfTeamFouls(s.firstHalfTeamFouls || 0);
      setFirstHalfOppFouls(s.firstHalfOppFouls || 0);

      setTeamTimeoutUsed(s.teamTimeoutUsed);
      setOppTimeoutUsed(s.oppTimeoutUsed);
      setGuestPlayers(s.guestPlayers || []);
    }, 0);
  }, [selectedTeam.name]);

  //
  // ===========================
  // AUTO-SAVE GAME STATE
  // ===========================
  //
  useEffect(() => {
    const gameState = {
      selectedTeamName: selectedTeam.name,
      half,
      running,
      startTimestamp,
      pausedTimestamp,
      totalPausedTime,
      initialTime,
      teamScore,
      oppScore,
      teamFouls,
      oppFouls,
      opponentName,
      playerStats,
      goalEvents,
      goalTimeline,
      firstHalfTeamScore,
      firstHalfOppScore,
      firstHalfTeamFouls,
      firstHalfOppFouls,
      teamTimeoutUsed,
      oppTimeoutUsed,
      guestPlayers,
    };

    localStorage.setItem("activeGameState", JSON.stringify(gameState));
  }, [
    half, running, startTimestamp, pausedTimestamp, totalPausedTime,
    initialTime, teamScore, oppScore, teamFouls, oppFouls, opponentName,
    playerStats, goalEvents, goalTimeline, firstHalfTeamScore,
    firstHalfOppScore, firstHalfTeamFouls, firstHalfOppFouls,
    teamTimeoutUsed, oppTimeoutUsed, guestPlayers, selectedTeam.name
  ]);

  //
  // ===========================
  // TIMER FUNCTIONS
  // ===========================
  //
  function toggleTimer() {
    if (!running) {
      if (!startTimestamp) {
        setStartTimestamp(Date.now());
      } else if (pausedTimestamp) {
        setTotalPausedTime(totalPausedTime + (Date.now() - pausedTimestamp));
        setPausedTimestamp(null);
      }
      setRunning(true);
    } else {
      setPausedTimestamp(Date.now());
      setRunning(false);
    }
  }

  function setNewTime(minutes) {
    setInitialTime(minutes * 60 * 1000);
    setStartTimestamp(null);
    setPausedTimestamp(null);
    setTotalPausedTime(0);
    setRunning(false);
  }

  //
  // TIMER CALCULATION
  //
  function getRemainingTime(nowOverride) {
    if (!startTimestamp) return initialTime;

    const now = typeof nowOverride === 'number' ? nowOverride : (pausedTimestamp || startTimestamp);
    const elapsed = now - startTimestamp - totalPausedTime;
    return Math.max(initialTime - elapsed, 0);
  }

  const remaining = getRemainingTime(now);
  const min = String(Math.floor(remaining / 60000)).padStart(2, "0");
  const sec = String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0");
  const timeUp = remaining === 0;

  //
  // AUTO-PAUSE + HAPTIC WHEN TIME REACHES ZERO
  //
  useEffect(() => {
    if (timeUp && running) {
      // Defer stopping the timer to avoid setState-in-effect lint rule
      setTimeout(() => setRunning(false), 0);
      alert(`Time's up! End of ${half === 1 ? "First" : "Second"} Half`);

      if ("vibrator" in navigator || navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    }
  }, [timeUp, running, half]);

  //
  // SMOOTH SECOND-BY-SECOND TICKING (aligned to seconds)
  //
  useEffect(() => {
    if (!running || timeUp) return;

    let timeout;
    let interval;

    const tickNow = () => setNow(Date.now());

    tickNow();

    const msToNextSecond = 1000 - (Date.now() % 1000);

    timeout = setTimeout(() => {
      tickNow();
      interval = setInterval(tickNow, 1000);
    }, msToNextSecond);

    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [running, timeUp]);

  //
  // ===========================
  // END HALF / END GAME
  // ===========================
  //
  function endHalf() {
  if (half === 1) {
    // ----- END FIRST HALF -----
    setFirstHalfTeamScore(teamScore);
    setFirstHalfOppScore(oppScore);
    setFirstHalfTeamFouls(teamFouls);
    setFirstHalfOppFouls(oppFouls);

    setTeamFouls(0);
    setOppFouls(0);
    setTeamTimeoutUsed(false);
    setOppTimeoutUsed(false);

    setHalf(2);
    setNewTime(20); // Second half 20:00
    setToast("Start of Second Half");
    return;
  }

  if (half === 2 && !isOvertime) {
    // ----- END SECOND HALF -----

    // If NOT tied → end game immediately
    if (teamScore !== oppScore) {
      saveGameAndNavigate();
      return;
    }

    // Game IS tied → ask about overtime
    const goToOvertime = window.confirm(
      "The game is tied. Start Overtime (5:00)?\n\nCancel = End Game as a Tie"
    );

    if (goToOvertime) {
      setIsOvertime(true);
      setNewTime(5); // 5-minute overtime
      setToast("Overtime Started — First Goal Wins!");
    } else {
      saveGameAndNavigate();
    }

    return;
  }

  // ----- END OVERTIME -----
  saveGameAndNavigate();
}


  //
  // ===========================
  // SAVE GAME
  // ===========================
  //
  function saveGameAndNavigate() {
    // FIRST: Clear active game state immediately
    localStorage.removeItem("activeGameState");

    // Calculate and save the completed game
    const secondHalfTeamScore = teamScore - firstHalfTeamScore;
    const secondHalfOppScore = oppScore - firstHalfOppScore;

    const date = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    const game = {
      id: Date.now(),
      date,
      teamName: selectedTeam.name,
      opponent: opponentName || "Opponent",
      scoreTeam: teamScore,
      scoreOpp: oppScore,
      half1: {
        team: firstHalfTeamScore,
        opp: firstHalfOppScore,
        foulsTeam: firstHalfTeamFouls,
        foulsOpp: firstHalfOppFouls
      },
      half2: {
        team: secondHalfTeamScore,
        opp: secondHalfOppScore,
        foulsTeam: teamFouls,
        foulsOpp: oppFouls
      },
      players: [...selectedTeam.players, ...guestPlayers],
      playerStats,
      timeline: goalTimeline
    };

    localStorage.setItem("lastGame", JSON.stringify(game));

    const history = JSON.parse(localStorage.getItem("gameHistory") || "[]");
    history.unshift(game);
    localStorage.setItem("gameHistory", JSON.stringify(history));

    localStorage.setItem("lastGameCompleted", "true");

    // Fix: Delay navigation to ensure save completes
    setTimeout(() => {
      setScreen("summary");
    }, 100);
  }

  //
  // ===========================
  // RENDER UI
  // ===========================
  //
  return (
    <div className="p-4 pb-24">
      {/* HALF LABEL */}
      <div className="text-center mb-4">
        <h2 className="text-3xl font-bold">
          {half === 1 ? "1st Half" : "2nd Half"}
        </h2>
      </div>

      {isOvertime && (
        <div className="text-center mb-2">
          <p className="text-2xl font-bold text-orange-500 animate-pulse">
            OVERTIME
          </p>
        </div>
      )}

      {/* TIMER + TIMEOUTS */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-6 mb-3">
          {/* TEAM TIMEOUT */}
          <button
            className={`text-3xl ${
              teamTimeoutUsed ? "text-gray-400 opacity-50"
                              : "text-blue-600 dark:text-blue-400"
            }`}
            disabled={teamTimeoutUsed || timeUp}
            onClick={() => {
              if (!teamTimeoutUsed) {
                setTeamTimeoutUsed(true);
                setPausedTimestamp(Date.now());
                setRunning(false);
              }
            }}
          >
            ⏱
          </button>

          {/* TIMER */}
          <div className={`text-6xl font-bold font-mono tracking-wider tabular-nums transition-all ${
            timeUp ? "text-red-600 animate-pulse" : ""
          }`}>
            {min}:{sec}
          </div>

          {/* OPP TIMEOUT */}
          <button
            className={`text-3xl ${
              oppTimeoutUsed ? "text-gray-400 opacity-50"
                             : "text-blue-600 dark:text-blue-400"
            }`}
            disabled={oppTimeoutUsed || timeUp}
            onClick={() => {
              if (!oppTimeoutUsed) {
                setOppTimeoutUsed(true);
                setPausedTimestamp(Date.now());
                setRunning(false);
              }
            }}
          >
            ⏱
          </button>
        </div>

        {/* TIMER CONTROLS */}
        <div className="flex justify-center gap-4 mb-3">
          <button
            className="w-32 px-4 py-2 bg-blue-600 text-white rounded-xl text-lg"
            onClick={toggleTimer}
          >
            {running ? "Pause" : "Start"}
          </button>

          <button
            className="w-32 px-4 py-2 bg-yellow-500 text-black rounded-xl text-lg font-medium"
            onClick={() => {
              const input = prompt("Enter game time as MM:SS \n(ex: 20:00 or 15:30):");
              if (input === null) return; // canceled
              const trimmed = input.trim();
              const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
              if (!match) {
                alert("Please enter time in MM:SS format (e.g. 20:00)");
                return;
              }
              const minutes = parseInt(match[1], 10);
              const seconds = parseInt(match[2], 10);
              if (minutes < 0 || minutes > 99 || seconds < 0 || seconds > 59) {
                alert("Minutes must be 0-99, seconds 0-59.");
                return;
              }
              const totalSeconds = minutes * 60 + seconds;
              setInitialTime(totalSeconds * 1000); // convert to ms
              setStartTimestamp(null);
              setPausedTimestamp(null);
              setTotalPausedTime(0);
              setRunning(false);
            }}
          >
            Set Time
          </button>
        </div>
      </div>

      {/* END HALF BUTTON */}
      <div className="text-center mb-6">
        <button
          className="px-6 py-3 bg-yellow-500 text-black font-bold rounded-xl text-lg"
          onClick={endHalf}
        >
          {half === 1 
            ? "End First Half" 
            : isOvertime 
              ? "End Overtime" 
              : "End Second Half"
          }
        </button>
      </div>

      {/* OPPONENT INPUT - hide only after typing and tapping away */}
      {!opponentNameSet && (
        <div className="text-center mb-6">
          <label className="block text-xl font-semibold mb-2">Opponent:</label>
          <input
            value={opponentName}
            onChange={(e) => setOpponentName(e.target.value)}
            onBlur={() => {
              const trimmed = opponentName.trim();
              if (trimmed.length > 0) {
                setOpponentName(trimmed); // clean up whitespace
                setOpponentNameSet(true); // hide input only after blur + has name
              }
            }}
            className="w-full max-w-xs mx-auto block bg-gray-100 dark:bg-gray-800 text-black dark:text-white p-2 rounded-xl text-lg text-center"
            placeholder="(Optional) Enter Opponent"
            autoFocus // optional: nice touch, focuses when screen loads
          />
        </div>
      )}

      {/* ULTRA-COMPACT SCOREBOARD + FOULS */}
      <div className="mb-6">
        {/* Team Names */}
        <div className="relative flex justify-between items-center px-4 mb-3 h-12"> {/* fixed height for consistency */}
          {/* My Team Name - wrap, left aligned */}
          <h2 className="text-lg font-bold max-w-40 text-left leading-tight">
            {selectedTeam.name}
          </h2>

          {/* VS - absolutely centered both horizontally and vertically */}
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-semibold bg-white dark:bg-gray-900 px-3">
            vs
          </span>

          {/* Opponent Name - wrap, right aligned */}
          <h2 
            className="text-lg font-bold text-right cursor-pointer hover:opacity-70"
            onClick={() => setOpponentNameSet(false)}
          >
            {opponentName || "Opponent"}
          </h2>
        </div>

        {/* GOALS ROW - + and – side by side */}
        <div className="flex justify-center items-center gap-6 mb-5">
          {/* My Team Goal Buttons */}
          <div className="flex gap-2">
              <button
                aria-label="Add team goal"
                className="bg-green-600 text-white w-12 h-12 rounded-full text-3xl font-bold shadow-lg active:scale-95"
                onClick={() => setShowScorerSheet(true)}
              >
                +
              </button>
            <button
              aria-label="Remove last team goal"
              className="bg-gray-600 text-white w-12 h-12 rounded-full text-2xl font-bold shadow active:scale-95"
              onClick={() => {
                if (goalTimeline.length === 0) return;

                // Only allow subtracting if the LAST goal was YOUR TEAM's
                const lastEvent = goalTimeline[goalTimeline.length - 1];
                if (lastEvent.opponentGoal) {
                  alert("Cannot delete your team's goal — the most recent goal was the opponent's. Delete opponent's goal first.");
                  return;
                }

                // Safe: last event is a team goal
                const lastGoal = goalEvents[goalEvents.length - 1];
                const { scorerId, assistId } = lastGoal;

                // Undo player stats
                setPlayerStats(prev => {
                  const updated = { ...prev };
                  if (updated[scorerId]) {
                    const g = (updated[scorerId].goal || 0) - 1;
                    if (g >= 0) updated[scorerId].goal = g;
                    else delete updated[scorerId].goal;
                  }
                  if (assistId && updated[assistId]) {
                    const a = (updated[assistId].assist || 0) - 1;
                    if (a >= 0) updated[assistId].assist = a;
                    else delete updated[assistId].assist;
                  }
                  return updated;
                });

                // Remove from events and timeline
                setGoalEvents(prev => prev.slice(0, -1));
                setGoalTimeline(prev => prev.slice(0, -1));

                // Subtract score
                setTeamScore(s => Math.max(0, s - 1));
              }}
            >
              –
            </button>




          </div>

          {/* Scores */}
          <div className="text-7xl font-bold font-mono tabular-nums w-28 text-center">
            <span aria-live="polite" aria-atomic="true" aria-label={`Team score ${teamScore}`}>{teamScore}</span>
          </div>
          <div className="text-7xl font-bold font-mono tabular-nums w-28 text-center">
            <span aria-live="polite" aria-atomic="true" aria-label={`Opponent score ${oppScore}`}>{oppScore}</span>
          </div>

          {/* Opponent Goal Buttons */}
          <div className="flex gap-2">
           <button
            aria-label="Remove last opponent goal"
            className="bg-gray-600 text-white w-12 h-12 rounded-full text-2xl font-bold shadow active:scale-95 order-2"
            onClick={() => {
              if (goalTimeline.length === 0) return;

              // Only allow subtracting if the LAST goal was OPPONENT's
              const lastEvent = goalTimeline[goalTimeline.length - 1];
              if (!lastEvent.opponentGoal) {
                alert("Cannot delete opponent's goal — the most recent goal was your team's. Delete your goal first.");
                return;
              }

              // Remove from timeline (no player stats to undo for opponent)
              setGoalTimeline(prev => prev.slice(0, -1));

              // Subtract opponent score
              setOppScore(s => Math.max(0, s - 1));
            }}
          >
            –
          </button>
            <button
              aria-label="Add opponent goal"
              className="bg-green-600 text-white w-12 h-12 rounded-full text-3xl font-bold shadow-lg active:scale-95 order-1"
              onClick={() => {
                setOppScore(s => s + 1);
                const elapsed = `${min}:${sec}`;

                setGoalTimeline(prev => [
                ...prev,
                { 
                  time: elapsed, 
                  opponentGoal: true, 
                  half, 
                  period: isOvertime ? "OT" : (half === 1 ? "1H" : "2H")
                }
              ]);

              }}
            >
              +
            </button>
          </div>
        </div>
{/* HORIZONTAL DIVIDER */}
  <div className="w-full max-w-md mx-auto border-t border-gray-300 dark:border-gray-600 mb-5"></div>
  {/* FOULS ROW - tighter gap, no overflow */}
  <div className="flex justify-center items-center gap-4">
    {/* My Team Foul Buttons */}
    <div className="flex gap-2">
      <button aria-label="Add team foul" className="bg-yellow-500 text-black w-10 h-10 rounded-full text-2xl font-bold shadow active:scale-95" onClick={() => setTeamFouls(teamFouls + 1)}>+</button>
      <button aria-label="Remove team foul" className="bg-gray-600 text-white w-10 h-10 rounded-full text-xl font-bold shadow active:scale-95" onClick={() => setTeamFouls(Math.max(0, teamFouls - 1))}>–</button>
    </div>

    {/* My Team Fouls */}
    <div aria-live="polite" aria-atomic="true" className="text-4xl font-bold font-mono w-20 text-center" aria-label={`Team fouls ${teamFouls}`}>{teamFouls}</div>

    {/* "FOULS" Label */}
    <div className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold tracking-wider">
      FOULS
    </div>

    {/* Opponent Fouls */}
    <div aria-live="polite" aria-atomic="true" className="text-4xl font-bold font-mono w-20 text-center" aria-label={`Opponent fouls ${oppFouls}`}>{oppFouls}</div>

    {/* Opponent Foul Buttons */}
    <div className="flex gap-2">
      <button
        className="bg-gray-600 text-white w-10 h-10 rounded-full text-xl font-bold shadow active:scale-95 order-2"
        onClick={() => setOppFouls(Math.max(0, oppFouls - 1))}
      >
        –
      </button>
      <button
        className="bg-yellow-500 text-black w-10 h-10 rounded-full text-2xl font-bold shadow active:scale-95 order-1"
        onClick={() => setOppFouls(oppFouls + 1)}
      >
        +
      </button>
    </div>
  </div>

  
</div>
      {/* LIVE GOAL TIMELINE */}
      <div className="mt-8 max-w-sm mx-auto bg-gray-100 dark:bg-gray-800 p-4 rounded-xl shadow">
        <h2 className="text-xl font-bold mb-3 text-center">Goal Timeline</h2>
        {goalTimeline.length === 0 ? (
          <p className="text-center text-gray-700 dark:text-gray-300">No goals yet.</p>
        ) : (
          <div className="space-y-3">
            {goalTimeline.map((event, index) => {
              const allPlayers = [...selectedTeam.players, ...guestPlayers];
              const scorer = allPlayers.find(p => String(p.id) === String(event.scorerId));
              const assister = event.assistId ? allPlayers.find(p => String(p.id) === String(event.assistId)) : null;
              const showPeriodChange = index === 0 || 
                goalTimeline[index - 1].period !== event.period;

              return (
                <div key={index}>
                  {showPeriodChange && (
                    <div className="my-4 flex items-center justify-center">
                      <div className="flex-grow border-t border-gray-400 dark:border-gray-500"></div>
                      <span className="px-4 text-lg font-bold text-orange-500 bg-gray-900 rounded-full">
                        {event.period === "OT" ? "OVERTIME" : event.period === "1H" ? "FIRST HALF" : "SECOND HALF"}
                      </span>
                      <div className="flex-grow border-t border-gray-400 dark:border-gray-500"></div>
                    </div>
                  )}
                  {event.opponentGoal ? (
                    <div className="bg-red-200 dark:bg-red-700 p-3 rounded-xl shadow">
                      <div className="flex justify-between text-lg">
                        <span className="font-semibold">{event.time}</span>
                        <span>🟥 Opponent Goal</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-200 dark:bg-gray-700 p-3 rounded-xl shadow">
                      <div className="flex justify-between text-lg">
                        <span className="font-semibold">{event.time}</span>
                        <span>⚽ #{scorer?.id} {scorer?.name}</span>
                      </div>
                      <div className="mt-1 text-right text-sm text-gray-700 dark:text-gray-300">
                        {assister ? <>🎯 Assist: #{assister.id} {assister.name}</> : "(Unassisted)"}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* EXIT GAME BUTTON */}
      <div className="mt-10 mx-auto w-full max-w-sm">
        <Button className="w-full bg-red-700 hover:bg-red-800 text-white" onClick={() => {
          localStorage.removeItem("activeGameState");
          setShowExitConfirm(true);
        }}>Exit Game</Button>
      </div>

      {/* SHEETS */}
      {showScorerSheet && (
        <GoalScorerSheet
          players={[...(selectedTeam?.players || []), ...guestPlayers]}
          onSelect={(playerId) => {
            setPendingScorer(playerId);
            setShowScorerSheet(false);
            setShowAssistSheet(true);
          }}
          onAddGuestPlayer={() => setShowGuestPlayerSheet(true)}
          onClose={() => setShowScorerSheet(false)}
        />
      )}

      {showAssistSheet && (
        <AssistSelectorSheet
          players={[...(selectedTeam?.players || []), ...guestPlayers]}
          scorerId={pendingScorer}
          onSelect={(assistId) => {
            setPlayerStats(prev => ({
              ...prev,
              [pendingScorer]: {
                ...(prev[pendingScorer] || {}),
                goal: (prev[pendingScorer]?.goal || 0) + 1,
              },
              ...(assistId && {
                [assistId]: {
                  ...(prev[assistId] || {}),
                  assist: (prev[assistId]?.assist || 0) + 1,
                }
              }),
            }));

            const elapsed = `${min}:${sec}`;
            setGoalTimeline(prev => [
              ...prev,
              { time: elapsed, scorerId: pendingScorer, assistId, half,
                period: isOvertime ? "OT" : (half === 1 ? "1H" : "2H")
               }
            ]);

            setGoalEvents(prev => [...prev, { scorerId: pendingScorer, assistId }]);
            setTeamScore(s => s + 1);

            setShowAssistSheet(false);
            setPendingScorer(null);
          }}
          onAddGuestPlayer={() => setShowGuestPlayerSheet(true)}
          onClose={() => setShowAssistSheet(false)}
        />
      )}

      {showTimeChanger && (
        <BottomSheet onClose={() => setShowTimeChanger(false)}>
          <h2 className="text-xl font-bold mb-4 text-center">Set Game Time</h2>
          <div className="grid grid-cols-2 gap-3">
            {[24, 20, 15, 12, 10, 5].map(minOpt => (
              <Button key={minOpt} className="bg-gray-200 dark:bg-gray-700 py-3 rounded-xl text-lg" onClick={() => {
                setNewTime(minOpt);
                setShowTimeChanger(false);
              }}>{minOpt}:00</Button>
            ))}
          </div>
          <button
            className="mt-4 w-full py-3 rounded-xl bg-gray-400 dark:bg-gray-600"
            onClick={() => setShowTimeChanger(false)}
          >
            Cancel
          </button>
        </BottomSheet>
      )}

      {showExitConfirm && (
        <BottomSheet onClose={() => setShowExitConfirm(false)}>
          <h2 className="text-xl font-bold mb-4 text-center">Exit Game?</h2>
          <p className="text-center mb-4">
            This will return you to the main menu.<br />
            Your current game will NOT be saved.
          </p>
          <button
            className="w-full py-3 mb-3 bg-red-600 text-white rounded-xl text-lg"
            onClick={() => {
              localStorage.removeItem("activeGameState");
              setShowExitConfirm(false);
              setScreen("manager");
            }}
          >
            Exit Without Saving
          </button>
          <button
            className="w-full py-3 bg-gray-400 dark:bg-gray-600 rounded-xl text-lg"
            onClick={() => setShowExitConfirm(false)}
          >
            Cancel
          </button>
        </BottomSheet>
      )}

      {showGuestPlayerSheet && (
        <BottomSheet onClose={() => setShowGuestPlayerSheet(false)}>
          <h2 className="text-xl font-bold text-center mb-4">Guest Players</h2>

          {/* Existing guests list with edit/remove */}
          <div className="space-y-3 mb-4">
            {(guestPlayers.length === 0) ? (
              <div className="text-center text-gray-600">No guest players yet.</div>
            ) : (
              guestPlayers.map(g => (
                <div key={g.id} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-xl">
                  <div>
                    <div className="font-semibold">#{g.id} — {g.name}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1 bg-yellow-400 rounded-lg"
                      onClick={() => {
                        setGuestNumber(g.id);
                        setGuestName(g.name);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="px-3 py-1 bg-red-600 text-white rounded-lg"
                      onClick={() => {
                        setGuestPlayers(prev => prev.filter(x => String(x.id) !== String(g.id)));
                        setPlayerStats(prev => {
                          const copy = { ...prev };
                          delete copy[g.id];
                          return copy;
                        });
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <h3 className="text-lg font-semibold mb-2">Add / Edit Guest</h3>
          <div className="space-y-4">
            <div>
              <label className="block mb-1 font-semibold">Number</label>
              <input
                type="text"
                className="w-full p-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-black dark:text-white"
                value={guestNumber}
                onChange={(e) => setGuestNumber(e.target.value)}
                aria-label="Guest number"
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold">Name</label>
              <input
                type="text"
                className="w-full p-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-black dark:text-white"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                aria-label="Guest name"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="primary" className="flex-1" onClick={() => {
                if (!guestNumber || !guestName) {
                  setToast('Enter both number and name');
                  return;
                }
                const normalized = String(guestNumber).trim();
                const existsOnTeam = (selectedTeam?.players || []).some(p => String(p.id) === normalized);
                if (existsOnTeam) { setToast('Number already on team roster'); return; }

                const existingIndex = guestPlayers.findIndex(p => String(p.id) === normalized);
                const newGuest = { id: normalized, name: guestName.trim() };

                if (existingIndex !== -1) {
                  setGuestPlayers(prev => prev.map(p => String(p.id) === normalized ? newGuest : p));
                } else {
                  setGuestPlayers(prev => [...prev, newGuest]);
                }

                setPlayerStats(prev => ({ ...prev, [normalized]: prev[normalized] || { goal: 0, assist: 0 } }));
                setGuestNumber("");
                setGuestName("");
              }}>Save Guest</Button>
              <Button variant="secondary" className="flex-1" onClick={() => { setGuestNumber(''); setGuestName(''); }}>Clear</Button>
            </div>
            <button
              className="w-full bg-gray-400 dark:bg-gray-600 text-white py-3 rounded-xl text-lg"
              onClick={() => setShowGuestPlayerSheet(false)}
            >
              Done
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