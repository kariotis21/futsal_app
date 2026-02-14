export function addOrUpdateGuest(guestPlayers, guest, teamPlayers) {
  const normalized = String(guest.id).trim();
  if (!normalized || !guest.name) {
    throw new Error('Invalid guest');
  }
  const existsOnTeam = (teamPlayers || []).some(p => String(p.id) === normalized);
  if (existsOnTeam) {
    throw new Error('Number already on team');
  }

  const existingIndex = guestPlayers.findIndex(p => String(p.id) === normalized);
  const newGuest = { id: normalized, name: guest.name };
  if (existingIndex !== -1) {
    const next = guestPlayers.map(p => String(p.id) === normalized ? newGuest : p);
    return next;
  }
  return [...guestPlayers, newGuest];
}
