const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 30,
      unique: true,
    },

    totalScore: {
      type: Number,
      default: 0,
      min: 0,
    },

    gamesPlayed: {
      type: Number,
      default: 0,
      min: 0,
    },

    gamesWon: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Player", playerSchema);