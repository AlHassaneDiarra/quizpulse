const Game = require("../models/Game");
const {
  updatePlayerStats,
} = require("./playerService");

async function saveCompletedGame(room) {
  if (!room || !room.quiz) {
    throw new Error("Invalid room or quiz.");
  }

  const leaderboard = [...room.players]
    .sort((a, b) => b.score - a.score)
    .map((player, index) => ({
      ...player,
      rank: index + 1,
    }));

  const winner = leaderboard[0];

  const game = await Game.create({
    roomCode: room.code,

    players: leaderboard.map((player) => ({
      playerId: player.playerId,
      username: player.username,
      score: player.score,
      rank: player.rank,
    })),

    totalQuestions: room.quiz.questions.length,

    status: "finished",

    winner: winner
      ? {
          playerId: winner.playerId,
          username: winner.username,
          score: winner.score,
        }
      : undefined,

    startedAt: new Date(room.quiz.startedAt || Date.now()),

    finishedAt: new Date(),
  });

  for (const player of leaderboard) {
    await updatePlayerStats(
      player.playerId,
      player.score,
      player.rank === 1
    );
  }

  return game;
}

module.exports = {
  saveCompletedGame,
};