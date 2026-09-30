export interface RecentGame {
  gameId: string;
  roomCode: string;
  score: number;
  rank: number | null;
  totalQuestions: number;
  isWinner: boolean;
  startedAt: string;
  finishedAt: string;
}

export interface PlayerStats {
  player: {
    id: string;
    username: string;
    totalScore: number;
    gamesPlayed: number;
    gamesWon: number;
    winRate: number;
  };

  recentGames: RecentGame[];
}