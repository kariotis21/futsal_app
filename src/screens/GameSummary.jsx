import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import GoalScorerSheet from "../components/GoalScorerSheet";
import AssistSelectorSheet from "../components/AssistSelectorSheet";
import BottomSheet from "../components/BottomSheet";
import Toast from "../components/Toast";
import Button from "../components/Button";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../context/ThemeContext";




function ErrorBoundary({ children }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (hasError) {
      console.error("Error in edit sheet - check console for details");
    }
  }, [hasError]);

  // REMOVE or COMMENT THIS BLOCK — it references undefined variables from parent
  // useEffect(() => {
  //   console.log("Edit state changed:", { editingIndex, pendingScorer, showAssistInEdit });
  // }, [editingIndex, pendingScorer, showAssistInEdit]);

  if (hasError) {
    return (
      <div className="p-6 text-center text-red-600">
        <h3 className="text-xl font-bold mb-2">Something went wrong while editing</h3>
        <p>Please try again or close and reopen the sheet.</p>
        <button
          className="mt-4 bg-gray-600 text-white py-2 px-6 rounded-xl"
          onClick={() => setHasError(false)}
        >
          Retry
        </button>
      </div>
    );
  }

  return children;
}

export default function GameSummary({ setScreen }) {
  const { isDark } = useTheme();
  const [showAssistInEdit, setShowAssistInEdit] = useState(false);
  const [toast, setToast] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  let lastGame = null;

  // Safe parse of lastGame with error handling
  try {
    const raw = localStorage.getItem("lastGame");
    if (raw) {
      lastGame = JSON.parse(raw);
    }
  } catch (err) {
    console.error("Corrupted lastGame data - clearing it", err);
    localStorage.removeItem("lastGame"); // Remove bad data
    lastGame = null;
  }

  useEffect(() => {
    if (!lastGame) {
      const history = JSON.parse(localStorage.getItem("gameHistory") || "[]");
      if (history.length > 0) {
        const mostRecent = history[0];
        localStorage.setItem("lastGame", JSON.stringify(mostRecent));
        window.location.reload(); // Force refresh to show recovered game
      }
    }
  }, [lastGame]);

  const [showEditGoals, setShowEditGoals] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [pendingScorer, setPendingScorer] = useState(null);
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState(null);
  

  if (!lastGame) {
    return (
      <div className="p-6 text-center min-h-screen">
        <h1 className="text-3xl font-bold mb-4">No Recent Game</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          The last game may not have saved properly.<br />
          Check your Game History or start a new game.
        </p>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white py-4 px-8 rounded-2xl text-xl shadow-lg transition"
          onClick={() => setScreen("manager")}
        >
          Back to Teams
        </button>
      </div>
    );
  }

  // Calculate overtime stats if present
  const hasOvertime = lastGame.timeline?.some(t => t.period === "OT") || false;

  const otGoalsTeam = hasOvertime
    ? lastGame.timeline.filter(t => t.period === "OT" && !t.opponentGoal).length
    : 0;
  const otGoalsOpp = hasOvertime
    ? lastGame.timeline.filter(t => t.period === "OT" && t.opponentGoal).length
    : 0;

  const otFoulsTeam = lastGame.half2?.foulsTeam || 0;
  const otFoulsOpp = lastGame.half2?.foulsOpp || 0;

  const half1GoalsTeam = lastGame.half1?.team || 0;
  const half1GoalsOpp = lastGame.half1?.opp || 0;
  const half2GoalsTeam = lastGame.half2?.team - otGoalsTeam || 0;
  const half2GoalsOpp = lastGame.half2?.opp - otGoalsOpp || 0;

  let totalGoals = 0;
  let totalAssists = 0;

  Object.values(lastGame.playerStats || {}).forEach(stats => {
    totalGoals += stats.goal || 0;
    totalAssists += stats.assist || 0;
  });

  // === Edit Goal Function ===
  const updateGoal = (index, newScorerId, newAssistId) => {
    console.log("Updating goal at index", index, "to scorer:", newScorerId, "assist:", newAssistId);
    const oldEvent = lastGame.timeline[index];
    console.log("Old event:", oldEvent);
    // Subtract old stats
    const updatedStats = { ...lastGame.playerStats };
    if (oldEvent.scorerId) {
      const oldS = updatedStats[oldEvent.scorerId] || { goal: 0 };
      updatedStats[oldEvent.scorerId] = {
        ...oldS,
        goal: Math.max(0, oldS.goal - 1)
      };
    }
    if (oldEvent.assistId) {
      const oldA = updatedStats[oldEvent.assistId] || { assist: 0 };
      updatedStats[oldEvent.assistId] = {
        ...oldA,
        assist: Math.max(0, oldA.assist - 1)
      };
    }

    // Add new stats
    if (newScorerId) {
      const newS = updatedStats[newScorerId] || { goal: 0 };
      updatedStats[newScorerId] = {
        ...newS,
        goal: newS.goal + 1
      };
    }
    if (newAssistId) {
      const newA = updatedStats[newAssistId] || { assist: 0 };
      updatedStats[newAssistId] = {
        ...newA,
        assist: newA.assist + 1
      };
    }

    // Update timeline (keep time!)
    const newTimeline = [...lastGame.timeline];
    newTimeline[index] = {
    ...oldEvent,
    scorerId: String(newScorerId),  // ← Force string
    assistId: newAssistId ? String(newAssistId) : null
  };

    // RECALCULATE SCORES from timeline (handles any change)
    let newTeamScore = 0;
    let newOppScore = 0;

    newTimeline.forEach(ev => {
      if (ev.opponentGoal) {
        newOppScore += 1;
      } else {
        newTeamScore += 1;
      }
    });

    // Save
    const updatedGame = {
      ...lastGame,
      scoreTeam: newTeamScore,
      scoreOpp: newOppScore,
      playerStats: updatedStats,
      timeline: newTimeline
    };

    // push undo snapshot
    try { setUndoStack(s => [JSON.parse(JSON.stringify(lastGame)), ...s].slice(0,10)); } catch { /* ignore */ }

    localStorage.setItem("lastGame", JSON.stringify(updatedGame));

    // Update history
    const history = JSON.parse(localStorage.getItem("gameHistory") || "[]");
    const gameIndex = history.findIndex(g => g.id === updatedGame.id);
    if (gameIndex !== -1) {
      history[gameIndex] = updatedGame;
      localStorage.setItem("gameHistory", JSON.stringify(history));
    }
    console.log("Updated game saved. Refreshing...");
    setToast({ text: "✅ Goal updated", actionLabel: 'Undo', onAction: () => undoLast() });
    setShowAssistInEdit(false);
    setEditingIndex(null);
    setPendingScorer(null);
  
  };

  // === Delete Goal Function ===
  const deleteGoal = (index) => {
    const event = lastGame.timeline[index];

    // Subtract player stats (if team goal)
    const updatedStats = { ...lastGame.playerStats };
    if (!event.opponentGoal) {
      if (event.scorerId) {
        const s = updatedStats[event.scorerId] || { goal: 0 };
        updatedStats[event.scorerId] = {
          ...s,
          goal: Math.max(0, s.goal - 1)
        };
      }
      if (event.assistId) {
        const a = updatedStats[event.assistId] || { assist: 0 };
        updatedStats[event.assistId] = {
          ...a,
          assist: Math.max(0, a.assist - 1)
        };
      }
    }

    // Remove from timeline
    const newTimeline = lastGame.timeline.filter((_, i) => i !== index);

    // RECALCULATE SCORES from the updated timeline
    let newTeamScore = 0;
    let newOppScore = 0;

    newTimeline.forEach(ev => {
      if (ev.opponentGoal) {
        newOppScore += 1;
      } else {
        newTeamScore += 1;
      }
    });

    // Save updated game with new scores
    const updatedGame = {
      ...lastGame,
      scoreTeam: newTeamScore,
      scoreOpp: newOppScore,
      playerStats: updatedStats,
      timeline: newTimeline
    };

    // push undo snapshot
    try { setUndoStack(s => [JSON.parse(JSON.stringify(lastGame)), ...s].slice(0,10)); } catch { /* ignore */ }

    localStorage.setItem("lastGame", JSON.stringify(updatedGame));

    // Update history
    const history = JSON.parse(localStorage.getItem("gameHistory") || "[]");
    const gameIndex = history.findIndex(g => g.id === updatedGame.id);
    if (gameIndex !== -1) {
      history[gameIndex] = updatedGame;
      localStorage.setItem("gameHistory", JSON.stringify(history));
    }

    setToast({ text: "🗑️ Goal deleted", actionLabel: 'Undo', onAction: () => undoLast() });
    setShowEditGoals(false);
    setDeleteConfirmIndex(null);
  };

  function undoLast() {
    const prev = (undoStack && undoStack.length > 0) ? undoStack[0] : null;
    if (!prev) {
      setToast('Nothing to undo');
      return;
    }
    try {
      localStorage.setItem('lastGame', JSON.stringify(prev));
      const history = JSON.parse(localStorage.getItem('gameHistory') || '[]');
      const gameIndex = history.findIndex(g => g.id === prev.id);
      if (gameIndex !== -1) { history[gameIndex] = prev; localStorage.setItem('gameHistory', JSON.stringify(history)); }
      setUndoStack(s => s.slice(1));
      setToast('Restored previous state — reloading');
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      console.error('Undo failed', err);
      setToast('Undo failed');
    }
  }

  function exportCSV() {
    if (!lastGame) return;

    const rows = [];

    // Header Info
    rows.push(["Futsal Coach Pro - Game Summary"]);
    rows.push(["Date", lastGame.date]);
    rows.push(["Teams", `${lastGame.teamName} vs ${lastGame.opponent}`]);
    rows.push(["Final Score", `${lastGame.scoreTeam} — ${lastGame.scoreOpp}`]);
    if (hasOvertime) rows.push(["Result", "Overtime"]);
    rows.push([]); // blank line

    // Scoring by Period
    rows.push(["Scoring by Period"]);
    rows.push(["Period", "Team Goals", "Opponent Goals"]);
    rows.push(["1st Half", half1GoalsTeam, half1GoalsOpp]);
    rows.push(["2nd Half", half2GoalsTeam, half2GoalsOpp]);
    if (hasOvertime) rows.push(["Overtime", otGoalsTeam, otGoalsOpp]);
    rows.push([]); // blank line

    // Goal Timeline with Period Labels
    rows.push(["Goal Timeline"]);
    rows.push(["Period", "Time", "Event", "Assist"]);

    let currentPeriod = null;
    lastGame.timeline.forEach((ev) => {
      const periodLabel = ev.period === "OT" ? "OT" : ev.period === "1H" ? "1H" : "2H";

      // Add period header row when period changes
      if (currentPeriod !== periodLabel) {
        rows.push([periodLabel + " ———————", "", "", ""]);
        currentPeriod = periodLabel;
      }

      if (ev.opponentGoal) {
        rows.push(["", ev.time, "Opponent Goal", ""]);
      } else {
        const scorer = lastGame.players.find(p => String(p.id) === String(ev.scorerId));
        const assister = ev.assistId
          ? lastGame.players.find(p => String(p.id) === String(ev.assistId))
          : null;

        rows.push([
          "",
          ev.time,
          scorer ? `#${scorer.id} ${scorer.name}` : "Unknown",
          assister ? `#${assister.id} ${assister.name}` : ""
        ]);
      }
    });

    rows.push([]); // blank line

    // Player Stats
    rows.push(["Player Stats"]);
    rows.push(["Player", "Goals", "Assists"]);

    const activePlayers = Object.entries(lastGame.playerStats || {})
      .filter(([, stats]) => (stats.goal || 0) > 0 || (stats.assist || 0) > 0);

    if (activePlayers.length === 0) {
      rows.push(["No goals or assists recorded", "", ""]);
    } else {
      activePlayers.forEach(([pid, stats]) => {
        const player = lastGame.players.find(p => String(p.id) === pid);
        if (player) {
          rows.push([
            `#${player.id} ${player.name}`,
            stats.goal || 0,
            stats.assist || 0
          ]);
        }
      });
    }

    // Convert to CSV
    const csv = rows.map(row => 
      row.map(cell => `"${(cell || "").toString().replace(/"/g, '""')}"`).join(",")
    ).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `futsal_summary_${lastGame.date.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function exportPDF() {
    if (!lastGame) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Center content with margins - use only middle 50% of page
    const contentWidth = pageWidth * 0.5;
    const leftMargin = pageWidth * 0.25;
    const rightMargin = leftMargin + contentWidth;
    
    let y = 15;

    // Color palette based on theme
    const colors = {
      primary: isDark ? [59, 130, 246] : [37, 99, 235], // blue
      success: [34, 197, 94], // green
      danger: [239, 68, 68], // red
      warning: [249, 115, 22], // orange
      gray: isDark ? [75, 85, 99] : [156, 163, 175],
      lightBg: isDark ? [31, 41, 55] : [243, 244, 246],
      text: isDark ? [229, 231, 235] : [17, 24, 39],
      textSecondary: isDark ? [156, 163, 175] : [107, 114, 128],
    };

    // Background
    doc.setFillColor(...(isDark ? [17, 24, 39] : [255, 255, 255]));
    doc.rect(0, 0, pageWidth, 297, 'F');

    // Header with gradient effect (simulate with rectangles)
    doc.setFillColor(...colors.primary);
    doc.rect(leftMargin, 0, contentWidth, 35, 'F');
    
    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('GAME SUMMARY', pageWidth / 2, 13, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(lastGame.date, pageWidth / 2, 21, { align: 'center' });
    
    if (hasOvertime) {
      doc.setTextColor(...colors.warning);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('OVERTIME', pageWidth / 2, 28, { align: 'center' });
    }

    y = 42;

    // Final Score Card
    doc.setFillColor(...colors.lightBg);
    doc.roundedRect(leftMargin, y, contentWidth, 32, 3, 3, 'F');
    
    doc.setTextColor(...colors.text);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('FINAL SCORE', pageWidth / 2, y + 6, { align: 'center' });
    
    const teamWon = lastGame.scoreTeam > lastGame.scoreOpp;
    const oppWon = lastGame.scoreOpp > lastGame.scoreTeam;
    
    // Team names
    doc.setFontSize(11);
    if (teamWon) {
      doc.setTextColor(...colors.success);
      doc.text(`★ ${lastGame.teamName}`, pageWidth / 2, y + 14, { align: 'center' });
    } else {
      doc.setTextColor(...colors.text);
      doc.text(lastGame.teamName, pageWidth / 2, y + 14, { align: 'center' });
    }
    
    // Score
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.primary);
    doc.text(`${lastGame.scoreTeam} - ${lastGame.scoreOpp}`, pageWidth / 2, y + 22, { align: 'center' });
    
    // Opponent
    doc.setFontSize(11);
    if (oppWon) {
      doc.setTextColor(...colors.danger);
      doc.text(`★ ${lastGame.opponent}`, pageWidth / 2, y + 29, { align: 'center' });
    } else {
      doc.setTextColor(...colors.text);
      doc.text(lastGame.opponent, pageWidth / 2, y + 29, { align: 'center' });
    }

    y += 38;

    // Two column layout for stats (within centered content)
    const colWidth = (contentWidth - 6) / 2;
    const col1X = leftMargin + 3;
    const col2X = col1X + colWidth + 3;

    // Scoring by Period (Left Column)
    doc.setFillColor(...colors.lightBg);
    doc.roundedRect(leftMargin, y, colWidth, 32, 2, 2, 'F');
    
    doc.setTextColor(...colors.text);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Scoring by Period', col1X, y + 6);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`1st Half:`, col1X, y + 13);
    doc.text(`${half1GoalsTeam} - ${half1GoalsOpp}`, leftMargin + colWidth - 3, y + 13, { align: 'right' });
    
    doc.text(`2nd Half:`, col1X, y + 20);
    doc.text(`${half2GoalsTeam} - ${half2GoalsOpp}`, leftMargin + colWidth - 3, y + 20, { align: 'right' });
    
    if (hasOvertime) {
      doc.setTextColor(...colors.warning);
      doc.text(`Overtime:`, col1X, y + 27);
      doc.text(`${otGoalsTeam} - ${otGoalsOpp}`, leftMargin + colWidth - 3, y + 27, { align: 'right' });
    }

    // Team Totals (Right Column)
    doc.setFillColor(...colors.lightBg);
    doc.roundedRect(col2X - 3, y, colWidth, 32, 2, 2, 'F');
    
    doc.setTextColor(...colors.text);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Team Totals', col2X, y + 6);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Goals:`, col2X, y + 13);
    doc.text(`${totalGoals}`, rightMargin - 3, y + 13, { align: 'right' });
    
    doc.text(`Assists:`, col2X, y + 20);
    doc.text(`${totalAssists}`, rightMargin - 3, y + 20, { align: 'right' });
    
    doc.text(`Fouls:`, col2X, y + 27);
    doc.text(`${(lastGame.half1?.foulsTeam || 0) + (lastGame.half2?.foulsTeam || 0)}`, rightMargin - 3, y + 27, { align: 'right' });

    y += 38;

    // Goal Timeline
    doc.setFillColor(...colors.lightBg);
    const timelineHeight = 85;
    doc.roundedRect(leftMargin, y, contentWidth, timelineHeight, 2, 2, 'F');
    
    doc.setTextColor(...colors.text);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Goal Timeline', leftMargin + 3, y + 6);
    
    y += 12;
    
    if (!lastGame.timeline || lastGame.timeline.length === 0) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...colors.textSecondary);
      doc.text('No goals recorded.', leftMargin + 3, y);
    } else {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      let currentPeriod = null;
      let lineCount = 0;
      const maxLines = 12;

      lastGame.timeline.forEach((ev, idx) => {
        if (lineCount >= maxLines) return;
        
        const periodLabel = ev.period === "OT" ? "OT" : ev.period === "1H" ? "1H" : "2H";
        
        if (currentPeriod !== periodLabel) {
          if (currentPeriod !== null && lineCount < maxLines) {
            y += 2;
            lineCount++;
          }
          if (lineCount < maxLines) {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...colors.primary);
            doc.text(periodLabel === "OT" ? "OVERTIME" : periodLabel === "1H" ? "FIRST HALF" : "SECOND HALF", leftMargin + 3, y);
            y += 5;
            lineCount++;
            currentPeriod = periodLabel;
          }
        }
        
        if (lineCount >= maxLines) return;

        doc.setFont('helvetica', 'normal');
        if (ev.opponentGoal) {
          doc.setTextColor(...colors.danger);
          doc.text(`${ev.time} - Opponent Goal`, leftMargin + 6, y);
        } else {
          const scorer = lastGame.players.find(p => String(p.id) === String(ev.scorerId));
          const assister = ev.assistId
            ? lastGame.players.find(p => String(p.id) === String(ev.assistId))
            : null;

          doc.setTextColor(...colors.text);
          const goalText = `${ev.time} - #${scorer?.id || "?"} ${scorer?.name || "Unknown"}`;
          const assistText = assister ? ` (A: #${assister.id} ${assister.name})` : '';
          
          doc.text(goalText + assistText, leftMargin + 6, y);
        }
        
        y += 4.5;
        lineCount++;
      });
    }

    y = 42 + 38 + 85 + 6;

    // Player Stats
    doc.setFillColor(...colors.lightBg);
    doc.roundedRect(leftMargin, y, contentWidth, 45, 2, 2, 'F');
    
    doc.setTextColor(...colors.text);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Player Stats', leftMargin + 3, y + 6);
    
    y += 12;

    const activePlayers = Object.entries(lastGame.playerStats || {})
      .filter(([, stats]) => (stats.goal || 0) > 0 || (stats.assist || 0) > 0)
      .slice(0, 8); // Limit to 8 players to fit on page

    if (activePlayers.length === 0) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...colors.textSecondary);
      doc.text('No goals or assists recorded.', leftMargin + 3, y);
    } else {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      
      // Two column layout for players (within centered content)
      const playerCol1X = leftMargin + 3;
      const playerCol2X = pageWidth / 2 + 3;
      let playerY = y;
      
      activePlayers.forEach(([pid, stats], idx) => {
        const player = lastGame.players.find(p => String(p.id) === pid);
        if (!player) return;

        const isLeftCol = idx % 2 === 0;
        const x = isLeftCol ? playerCol1X : playerCol2X;
        
        if (idx > 0 && idx % 2 === 0) playerY += 5;

        doc.setTextColor(...colors.text);
        doc.setFont('helvetica', 'bold');
        doc.text(`#${player.id} ${player.name}`, x, isLeftCol ? playerY : playerY);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colors.textSecondary);
        const statsText = `G: ${stats.goal || 0}  A: ${stats.assist || 0}`;
        doc.text(statsText, x + 25, isLeftCol ? playerY : playerY);
      });
    }

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(...colors.textSecondary);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 285, { align: 'center' });

    doc.save(`futsal_summary_${lastGame.date.replace(/\s+/g, "_")}.pdf`);
    setToast('PDF exported successfully!');
  }

  // Share summary: try Web Share API with files, otherwise copy CSV to clipboard
  async function shareSummary() {
    if (!lastGame) return;

    // Build CSV (same as exportCSV)
    const rows = [];
    rows.push(["Futsal Coach Pro - Game Summary"]);
    rows.push(["Date", lastGame.date]);
    rows.push(["Teams", `${lastGame.teamName} vs ${lastGame.opponent}`]);
    rows.push(["Final Score", `${lastGame.scoreTeam} — ${lastGame.scoreOpp}`]);
    rows.push([]);

    rows.push(["Goal Timeline"]);
    rows.push(["Period", "Time", "Event", "Assist"]);

    let currentPeriod = null;
    lastGame.timeline.forEach((ev) => {
      const periodLabel = ev.period === "OT" ? "OT" : ev.period === "1H" ? "1H" : "2H";
      if (currentPeriod !== periodLabel) {
        rows.push([periodLabel + " ———————", "", "", ""]);
        currentPeriod = periodLabel;
      }
      if (ev.opponentGoal) {
        rows.push(["", ev.time, "Opponent Goal", ""]);
      } else {
        const scorer = lastGame.players.find(p => String(p.id) === String(ev.scorerId));
        const assister = ev.assistId ? lastGame.players.find(p => String(p.id) === String(ev.assistId)) : null;
        rows.push(["", ev.time, scorer ? `#${scorer.id} ${scorer.name}` : "Unknown", assister ? `#${assister.id} ${assister.name}` : ""]);
      }
    });

    const csv = rows.map(row => row.map(cell => `"${(cell||"").toString().replace(/"/g,'""')}"`).join(",")).join("\n");

    try {
      const blob = new Blob([csv], { type: 'text/csv' });
      const file = new File([blob], `futsal_summary_${lastGame.date.replace(/\s+/g, '_')}.csv`, { type: 'text/csv' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Game Summary', text: `${lastGame.teamName} vs ${lastGame.opponent} — ${lastGame.scoreTeam}—${lastGame.scoreOpp}` });
        setToast('Shared summary');
        return;
      }

      // Fallback: copy CSV to clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(csv);
        setToast('CSV copied to clipboard — paste into email or Notes');
        return;
      }

      setToast('Share not available on this browser — try downloading');
    } catch (err) {
      console.error('Share failed', err);
      setToast('Share failed');
    }
  }

  return (
    <div className="p-6 pb-24 text-black dark:text-white bg-white dark:bg-gray-900 min-h-screen space-y-6">

      {/* TITLE */}
      <h1 className="text-3xl font-bold text-center">Game Summary</h1>
      <p className="text-center text-gray-600 dark:text-gray-300">
        {lastGame.date}
        {hasOvertime && <span className="block text-orange-500 font-bold mt-1">Overtime</span>}
      </p>

      {/* FINAL SCORE CARD */}
      <div className="p-6 rounded-2xl shadow text-center 
                      bg-gradient-to-b from-gray-200 to-gray-300 
                      dark:bg-gradient-to-b dark:from-gray-800 dark:to-gray-900">
        <h2 className="text-xl font-semibold mb-4">Final Score</h2>

        {(() => {
          const teamWon = lastGame.scoreTeam > lastGame.scoreOpp;
          const oppWon = lastGame.scoreOpp > lastGame.scoreTeam;

          return (
            <>
              <div className="text-2xl font-bold mb-2">
                {teamWon ? (
                  <span className="px-3 py-1 rounded-full bg-green-600 text-white">
                    {lastGame.teamName}
                  </span>
                ) : (
                  lastGame.teamName
                )}
              </div>

              <div className="text-5xl font-extrabold mb-2">
                <span aria-live="polite" aria-atomic="true" aria-label={`Team score ${lastGame.scoreTeam}`}>{lastGame.scoreTeam}</span>
                <span className="mx-4" aria-hidden="true"> — </span>
                <span aria-live="polite" aria-atomic="true" aria-label={`Opponent score ${lastGame.scoreOpp}`}>{lastGame.scoreOpp}</span>
              </div>

              <div className="text-2xl font-bold">
                {oppWon ? (
                  <span className="px-3 py-1 rounded-full bg-red-600 text-white">
                    {lastGame.opponent}
                  </span>
                ) : (
                  lastGame.opponent
                )}
              </div>

              {hasOvertime && (
                <div className="mt-3 text-orange-500 font-bold text-xl">
                  OVERTIME
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* SCORING BY PERIOD */}
      <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-2xl shadow">
        <h2 className="text-xl font-semibold mb-4">Scoring by Period</h2>

        <div className="flex justify-between text-lg mb-2">
          <span>1st Half</span>
          <span>
            <span aria-live="polite" aria-atomic="true" aria-label={`1st half team goals ${half1GoalsTeam}`}>{half1GoalsTeam}</span>
            <span className="mx-2" aria-hidden="true"> — </span>
            <span aria-live="polite" aria-atomic="true" aria-label={`1st half opponent goals ${half1GoalsOpp}`}>{half1GoalsOpp}</span>
          </span>
        </div>

        <div className="flex justify-between text-lg mb-2">
          <span>2nd Half</span>
          <span>
            <span aria-live="polite" aria-atomic="true" aria-label={`2nd half team goals ${half2GoalsTeam}`}>{half2GoalsTeam}</span>
            <span className="mx-2" aria-hidden="true"> — </span>
            <span aria-live="polite" aria-atomic="true" aria-label={`2nd half opponent goals ${half2GoalsOpp}`}>{half2GoalsOpp}</span>
          </span>
        </div>

        {hasOvertime && (
          <div className="flex justify-between text-lg text-orange-500 font-bold">
            <span>Overtime</span>
            <span>{otGoalsTeam} — {otGoalsOpp}</span>
          </div>
        )}
      </div>

      {/* FOULS BY PERIOD */}
      <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-2xl shadow">
        <h2 className="text-xl font-semibold mb-4">Team Fouls by Period</h2>

        <div className="flex justify-between mb-2">
          <span>1st Half</span>
          <span>{lastGame.half1.foulsTeam} — {lastGame.half1.foulsOpp}</span>
        </div>

        <div className="flex justify-between mb-2">
          <span>2nd Half + Overtime</span>
          <span>{lastGame.half2.foulsTeam} — {lastGame.half2.foulsOpp}</span>
        </div>

        {hasOvertime && (
          <div className="flex justify-between text-orange-500 font-bold mt-2">
            <span>Of which Overtime</span>
            <span>{otFoulsTeam} — {otFoulsOpp}</span>
          </div>
        )}
      </div>

      {/* GOAL TIMELINE */}
      <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-2xl shadow">
        <h2 className="text-xl font-semibold mb-4 text-center">Goal Timeline</h2>

        {(!lastGame.timeline || lastGame.timeline.length === 0) ? (
          <p className="text-center text-gray-600 dark:text-gray-300">
            No goals recorded.
          </p>
        ) : (
          <div className="space-y-4">
            {lastGame.timeline.map((event, index) => {
              const scorer = lastGame.players.find(
                (p) => String(p.id) === String(event.scorerId)
              );
              const assister = event.assistId
                ? lastGame.players.find(
                    (p) => String(p.id) === String(event.assistId)
                  )
                : null;

              const showPeriodChange = index === 0 ||
                lastGame.timeline[index - 1].period !== event.period;

              return (
                <div key={index}>
                  {showPeriodChange && (
                    <div className="my-6 flex items-center justify-center">
                      <div className="flex-grow border-t border-gray-400 dark:border-gray-500"></div>
                      <span className="px-6 py-2 text-lg font-bold text-orange-500 bg-gray-900 rounded-full">
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

      {/* PLAYER STATS */}
      <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-2xl shadow">
        <h2 className="text-xl font-semibold mb-4 text-center">Player Stats</h2>

        {Object.entries(lastGame.playerStats || {})
          .filter(([, stats]) => (stats.goal || 0) > 0 || (stats.assist || 0) > 0)
          .length === 0 ? (
          <p className="text-center text-gray-600 dark:text-gray-300">
            No goals or assists recorded.
          </p>
        ) : (
          <div className="space-y-4">
            {Object.entries(lastGame.playerStats || {})
              .filter(([, stats]) => (stats.goal || 0) > 0 || (stats.assist || 0) > 0)
              .map(([pid, stats]) => {
                const player = lastGame.players.find(
                  (p) => String(p.id) === pid
                );

                if (!player) return null;

                return (
                  <div
                    key={pid}
                    className="bg-gray-200 dark:bg-gray-700 p-4 rounded-xl shadow"
                  >
                    <h3 className="font-bold text-lg mb-2">
                      #{player.id} — {player.name}
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>⚽ Goals: {stats.goal || 0}</div>
                      <div>🎯 Assists: {stats.assist || 0}</div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* TEAM TOTALS */}
      <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-2xl shadow">
        <h2 className="text-xl font-semibold mb-4">Team Totals</h2>

        <div className="grid grid-cols-2 gap-2 text-lg">
          <div>Goals: {totalGoals}</div>
          <div>Assists: {totalAssists}</div>
          <div>Fouls: {(lastGame.half1?.foulsTeam || 0) + (lastGame.half2?.foulsTeam || 0)}</div>
        </div>
      </div>

      {/* EXPORT / SHARE ACTIONS */}
      <div className="space-y-3">
        <Button variant="primary" className="w-full" onClick={exportCSV}>Export as CSV</Button>
        <Button variant="purple" className="w-full" onClick={exportPDF}>Export as PDF</Button>
        <Button variant="secondary" className="w-full" onClick={shareSummary}>Share Summary</Button>
      </div>

      {/* NEW: Edit/Delete Goals Button */}
      <div className="space-y-3">
        <Button variant="orange" className="w-full mt-4" onClick={() => setShowEditGoals(true)}>Edit / Delete Goals</Button>
        <Button variant="blue" className="w-full mt-4" onClick={() => setScreen("history")}>Back to History</Button>
        <Button variant="gray" className="w-full mt-2" onClick={() => setScreen("manager")}>Back to Teams</Button>
      </div>

      {/* Edit Goals Sheet */}
      {showEditGoals && (
        <BottomSheet onClose={() => {
          setShowEditGoals(false);
          setDeleteConfirmIndex(null);
        }}>
          <h2 className="text-2xl font-bold text-center mb-6">Edit or Delete Goals</h2>

          {lastGame.timeline
            .map((event, index) => ({ event, index }))
            .filter(({ event }) => !event.opponentGoal)
            .map(({ event, index }) => {
              const scorer = lastGame.players.find(p => String(p.id) === String(event.scorerId));
              const assister = event.assistId 
                ? lastGame.players.find(p => String(p.id) === String(event.assistId)) 
                : null;

              return (
                <div 
                  key={index}
                  className="bg-gray-100 dark:bg-gray-700 p-4 rounded-xl mb-3"
                >
                  <div className="font-semibold mb-2">{event.time}</div>
                  <div className="mb-1">Scorer: {scorer ? `#${scorer.id} ${scorer.name}` : "Unknown (tap Edit to assign)"}</div>
                  <div className="mb-3">Assist: {assister ? `#${assister.id} ${assister.name}` : "(none)"}</div>
                  
                  <div className="flex gap-3">
                    <button
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm"
                      onClick={() => {
                        setEditingIndex(index);
                        setPendingScorer(event.scorerId);
                        setShowEditGoals(false);
                      }}
                    >
                      Edit
                    </button>
                    
                    <button
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm"
                      onClick={() => setDeleteConfirmIndex(index)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}

          {lastGame.timeline.filter(e => !e.opponentGoal).length === 0 && (
            <p className="text-center text-gray-600">No team goals to edit or delete yet.</p>
          )}

          {/* Delete Confirmation Overlay */}
          {deleteConfirmIndex !== null && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl max-w-sm w-full mx-4">
                <h3 className="text-xl font-bold mb-4">Delete Goal?</h3>
                <p className="mb-6">This will remove the goal and any assist permanently. This cannot be undone.</p>
                <div className="flex gap-4">
                  <button
                    className="flex-1 bg-gray-500 text-white py-3 rounded-xl"
                    onClick={() => setDeleteConfirmIndex(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 bg-red-600 text-white py-3 rounded-xl"
                    onClick={() => {
                      deleteGoal(deleteConfirmIndex);
                      setDeleteConfirmIndex(null);
                      setShowEditGoals(false);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          <button
            className="w-full mt-6 bg-gray-400 text-black py-4 rounded-xl"
            onClick={() => setShowEditGoals(false)}
          >
            Close
          </button>
        </BottomSheet>
      )}

{/* Edit Flow: Scorer Sheet */}
{editingIndex !== null && !showAssistInEdit && (

  <ErrorBoundary>
    <GoalScorerSheet
      players={lastGame?.players || []}
      onSelect={(newScorerId) => {
        console.log("Scorer selected in edit:", newScorerId);
        // First update scorer (needed for assist sheet)
        setPendingScorer(newScorerId);
        // Then trigger assist and close scorer by resetting pending
          setShowAssistInEdit(true);
         
       
      }}
      onAddGuestPlayer={() => setToast("Guests can't be added in edit mode.")}
      onClose={() => {
        setEditingIndex(null);
        setPendingScorer(null);
        setShowAssistInEdit(false);
      }}
      preselectedId={pendingScorer}
    />
  </ErrorBoundary>
)}

{/* Assist Sheet - show after scorer is chosen in edit mode */}
{editingIndex !== null && showAssistInEdit && (
  <ErrorBoundary>
    <AssistSelectorSheet
      players={lastGame?.players || []}
      scorerId={pendingScorer}  // Use the newly selected scorer
      onSelect={(newAssistId) => {
        console.log("Assist selected:", newAssistId);
        updateGoal(editingIndex, pendingScorer, newAssistId);
        setEditingIndex(null);
        setPendingScorer(null);
        setShowAssistInEdit(false);
      }}
      onAddGuestPlayer={() => setToast("Guests can't be added in edit mode.")}
      onClose={() => {
        console.log("Assist sheet closed");
        setEditingIndex(null);
        setPendingScorer(null);
        setShowAssistInEdit(false);
      }}
      preselectedId={lastGame?.timeline?.[editingIndex]?.assistId}
    />
  </ErrorBoundary>
)}
  <Toast
  message={toast}
  onClose={() => setToast(null)}
/>

    </div>
  );



}