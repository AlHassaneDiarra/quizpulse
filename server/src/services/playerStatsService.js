const Player = require("../models/Player");
const Game = require("../models/Game");

async function getPlayerStats(playerId) {
  const player = await Player.findById(playerId).lean();

  if (!player) {
    return null;
  }

  const recentGames = await Game.find({
    "players.playerId": player._id,
  })
    .sort({ finishedAt: -1 })
    .limit(10)
    .select(
      "roomCode players winner totalQuestions startedAt finishedAt"
    )
    .lean();

  const gamesPlayed = player.gamesPlayed || 0;
  const gamesWon = player.gamesWon || 0;

  const winRate =
    gamesPlayed > 0
      ? Math.round((gamesWon / gamesPlayed) * 100)
      : 0;

  const formattedGames = recentGames.map((game) => {
    const playerResult = game.players.find(
      (gamePlayer) =>
        gamePlayer.playerId.toString() ===
        player._id.toString()
    );

    return {
      gameId: game._id,
      roomCode: game.roomCode,
      score: playerResult?.score || 0,
      rank: playerResult?.rank || null,
      totalQuestions: game.totalQuestions,
      isWinner:
        game.winner?.playerId?.toString() ===
        player._id.toString(),
      startedAt: game.startedAt,
      finishedAt: game.finishedAt,
    };
  });

  return {
    player: {
      id: player._id,
      username: player.username,
      totalScore: player.totalScore,
      gamesPlayed,
      gamesWon,
      winRate,
    },

    recentGames: formattedGames,
  };
}

module.exports = {
  getPlayerStats,
};