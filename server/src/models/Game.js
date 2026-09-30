const mongoose = require("mongoose");

const gamePlayerSchema = new mongoose.Schema(
  {
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },

    username: {
      type: String,
      required: true,
    },

    score: {
      type: Number,
      default: 0,
      min: 0,
    },

    rank: {
      type: Number,
      min: 1,
    },
  },
  {
    _id: false,
  }
);

const gameSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    players: {
      type: [gamePlayerSchema],
      required: true,
    },

    totalQuestions: {
      type: Number,
      required: true,
      min: 1,
    },

    status: {
      type: String,
      enum: ["finished"],
      default: "finished",
    },

    winner: {
      playerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Player",
      },

      username: String,

      score: {
        type: Number,
        min: 0,
      },
    },

    startedAt: {
      type: Date,
      required: true,
    },

    finishedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Game", gameSchema);