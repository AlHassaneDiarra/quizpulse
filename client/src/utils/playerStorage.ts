const PLAYER_ID_KEY = "quizpulse_player_id";

export function savePlayerId(playerId: string): void {
  localStorage.setItem(PLAYER_ID_KEY, playerId);
}

export function getPlayerId(): string | null {
  return localStorage.getItem(PLAYER_ID_KEY);
}

export function removePlayerId(): void {
  localStorage.removeItem(PLAYER_ID_KEY);
}