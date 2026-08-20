const NAME_KEY = 'contra-player-name';

export function loadPlayerName() {
  try { return localStorage.getItem(NAME_KEY) || ''; } catch { return ''; }
}

export function savePlayerName(name) {
  try { localStorage.setItem(NAME_KEY, name); } catch { /* ignore */ }
}

export async function fetchLeaderboard() {
  const res = await fetch('/api/leaderboard');
  if (!res.ok) throw new Error('failed to load leaderboard');
  return res.json();
}

export async function submitScore(name, score) {
  const res = await fetch('/api/leaderboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, score }),
  });
  if (!res.ok) throw new Error('failed to submit score');
  return res.json();
}
