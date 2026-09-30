const express = require("express");

const {
  getPlayerStats,
} = require("../services/playerStatsService");

const router = express.Router();

router.get("/:playerId/stats", async (req, res) => {
  try {
    const { playerId } = req.params;

    const stats =
      await getPlayerStats(playerId);

    if (!stats) {
      return res.status(404).json({
        message: "Player not found.",
      });
    }

    return res.status(200).json(stats);
  } catch (error) {
    console.error(
      "Error retrieving player stats:",
      error
    );

    return res.status(500).json({
      message: "Unable to retrieve player statistics.",
    });
  }
});

module.exports = router;