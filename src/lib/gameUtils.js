export function recalcScoresFromTimeline(timeline = []) {
  let team = 0;
  let opp = 0;
  timeline.forEach(ev => {
    if (ev.opponentGoal) opp += 1;
    else team += 1;
  });
  return { team, opp };
}

export function recalcPlayerStatsFromTimeline(timeline = []) {
  const stats = {};
  timeline.forEach(ev => {
    if (ev.opponentGoal) return;
    const sId = String(ev.scorerId);
    const aId = ev.assistId ? String(ev.assistId) : null;
    if (sId) {
      stats[sId] = stats[sId] || { goal: 0, assist: 0 };
      stats[sId].goal += 1;
    }
    if (aId) {
      stats[aId] = stats[aId] || { goal: 0, assist: 0 };
      stats[aId].assist += 1;
    }
  });
  return stats;
}

export function updatePlayerStatsForEdit(currentStats = {}, oldEvent = {}, newScorerId, newAssistId) {
  // clone
  const updated = JSON.parse(JSON.stringify(currentStats || {}));

  // remove old event stats
  if (!oldEvent.opponentGoal) {
    if (oldEvent.scorerId) {
      const s = updated[String(oldEvent.scorerId)] || { goal: 0 };
      updated[String(oldEvent.scorerId)] = { ...(s || {}), goal: Math.max(0, (s.goal || 0) - 1) };
    }
    if (oldEvent.assistId) {
      const a = updated[String(oldEvent.assistId)] || { assist: 0 };
      updated[String(oldEvent.assistId)] = { ...(a || {}), assist: Math.max(0, (a.assist || 0) - 1) };
    }
  }

  // add new stats
  if (newScorerId) {
    const ns = updated[String(newScorerId)] || { goal: 0, assist: 0 };
    updated[String(newScorerId)] = { ...(ns || {}), goal: (ns.goal || 0) + 1 };
  }
  if (newAssistId) {
    const na = updated[String(newAssistId)] || { goal: 0, assist: 0 };
    updated[String(newAssistId)] = { ...(na || {}), assist: (na.assist || 0) + 1 };
  }

  return updated;
}
