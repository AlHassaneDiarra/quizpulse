require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");

const connectDatabase = require("./config/database");

const { Server } = require("socket.io");

const socketHandler = require("./sockets/socketHandler");

const app = express();
const Player = require("./models/Player");
const playerRoutes = require("./routes/playerRoutes");

const PORT = process.env.PORT || 5000;
async function testDatabase() {
  try {
    const player = await Player.create({
      username: "TestPlayer",
    });

    console.log("Test player created:", player.username);

    await Player.deleteOne({ _id: player._id });

    console.log("Test player deleted.");
  } catch (error) {
    console.error("Database test failed:", error.message);
  }
}

app.use(cors());
app.use(express.json());
app.use("/players", playerRoutes);

connectDatabase();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

socketHandler(io);

app.get("/", (req, res) => {
  res.json({
    message: "QuizPulse API is running 🚀",
  });
});

server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});