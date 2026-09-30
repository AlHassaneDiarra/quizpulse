const Player = require("../models/Player");

async function findOrCreatePlayer(username) {
  const normalizedUsername = username.trim();

  let player = await Player.findOne({
    username: normalizedUsername,
  });

  if (!player) {
    player = await Player.create({
      username: normalizedUsername,
    });

    console.log(`New player created: ${normalizedUsername}`);
  }

  return player;
}

async function updatePlayerStats(playerId, score, isWinner) {
  const player = await Player.findById(playerId);

  if (!player) {
    return null;
  }

  player.totalScore += score;
  player.gamesPlayed += 1;

  if (isWinner) {
    player.gamesWon += 1;
  }

  await player.save();

  return player;
}

module.exports = {
  findOrCreatePlayer,
  updatePlayerStats,
};