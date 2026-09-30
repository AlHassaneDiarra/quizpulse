const {
  findOrCreatePlayer,
  updatePlayerStats,
} = require("../services/playerService");

const {
  saveCompletedGame,
} = require("../services/gameService");

const generateRoomCode = require("../utils/generateRoomCode");

const {
  rooms,
  createRoom,
  getRoom,
} = require("../services/roomService");

const {
  createQuiz,
  startQuestion,
  getPublicQuestion,
  getRemainingTime,
  isQuestionExpired,
  submitAnswer,
  allPlayersAnswered,
  getResults,
  moveToNextQuestion,
  isQuizFinished,
  finishQuiz,
} = require("../services/quizService");

function getPublicRoom(room) {
  return {
    code: room.code,
    status: room.status,
    players: room.players.map((player) => ({
      id: player.id,
      playerId: player.playerId,
      username: player.username,
      isHost: player.isHost,
      score: player.score,
    })),
  };
}

function createLeaderboard(players) {
  const sortedPlayers = [...players].sort(
    (a, b) => b.score - a.score
  );

  let previousScore = null;
  let currentRank = 0;

  return sortedPlayers.map((player, index) => {
    if (player.score !== previousScore) {
      currentRank = index + 1;
      previousScore = player.score;
    }

    return {
      rank: currentRank,
      playerId: player.id,
      username: player.username,
      score: player.score,
    };
  });
}


async function finishQuestion(io, roomCode, room) {
  if (!room.quiz) {
    return;
  }

  // Empêche une double exécution
  if (room.quiz.questionFinished) {
    return;
  }

  room.quiz.questionFinished = true;

  if (room.quiz.questionTimer) {
    clearTimeout(room.quiz.questionTimer);
    room.quiz.questionTimer = null;
  }

  const results = getResults(
    room.quiz,
    room.players
  );

  const leaderboard =
    createLeaderboard(room.players);

  io.to(roomCode).emit(
    "question-results",
    {
      results,
      questionNumber:
        room.quiz.currentQuestionIndex + 1,
      totalQuestions:
        room.quiz.questions.length,
      leaderboard,
    }
  );

  console.log(
    `Question ${
      room.quiz.currentQuestionIndex + 1
    } finished in room ${roomCode}`
  );

  // Dernière question
  if (isQuizFinished(room.quiz)) {
    room.status = "finished";

    finishQuiz(room.quiz);

    try {
    await saveCompletedGame(room);

    console.log(
      `Game ${roomCode} saved successfully.`
    );
    } catch (error) {
      console.error(
        "Error saving completed game:",
        error
      );
    }

    io.to(roomCode).emit(
      "game-finished",
        leaderboard,
    );

    return;
  }

  // Pause de 3 secondes avant la prochaine question
  setTimeout(() => {
    if (
      !room.quiz ||
      room.status !== "playing"
    ) {
      return;
    }

    moveToNextQuestion(room.quiz);

    const nextQuestion =
      getPublicQuestion(room.quiz);

    io.to(roomCode).emit(
      "question-started",
      nextQuestion
    );

    scheduleQuestionEnd(
      io,
      roomCode,
      room
    );

    console.log(
      `Question ${
        room.quiz.currentQuestionIndex + 1
      } started in room ${roomCode}`
    );
  }, 3000);
}


function scheduleQuestionEnd(
  io,
  roomCode,
  room
) {
  if (!room.quiz) {
    return;
  }

  if (room.quiz.questionTimer) {
    clearTimeout(room.quiz.questionTimer);
  }

  room.quiz.questionTimer = setTimeout(() => {
    if (
      !room.quiz ||
      room.status !== "playing"
    ) {
      return;
    }

    if (room.quiz.questionFinished) {
      return;
    }

    if (!isQuestionExpired(room.quiz)) {
      return;
    }

    finishQuestion(
      io,
      roomCode,
      room
    );
  }, 15000);
}


function socketHandler(io) {
  io.on("connection", (socket) => {
    console.log(
      `User connected: ${socket.id}`
    );


    // =========================
    // CREATE ROOM
    // =========================

    socket.on(
      "create-room",
      async ({ username }) => {
        if (
          !username ||
          typeof username !== "string"
        ) {
          socket.emit(
            "error-message",
            "Username is required."
          );

          return;
        }

        const cleanUsername =
          username.trim();

        if (!cleanUsername) {
          socket.emit(
            "error-message",
            "Username is required."
          );

          return;
        }

        try {
          // Find existing player or create a new one in MongoDB
          const databasePlayer =
            await findOrCreatePlayer(
              cleanUsername
            );

          const roomCode =
            generateRoomCode();

          const hostPlayer = {
            id: socket.id,
            playerId:
              databasePlayer._id.toString(),
            username:
              databasePlayer.username,
            isHost: true,
            score: 0,
          };

          const room = createRoom(
            roomCode,
            hostPlayer
          );

          socket.join(roomCode);

          socket.emit(
            "room-created",
            getPublicRoom(room)
          );

          console.log(
            `Room ${roomCode} created by ${cleanUsername}`
          );
        } catch (error) {
          console.error(
            "Error creating player:",
            error
          );

          socket.emit(
            "error-message",
            "Unable to create player."
          );
        }
      }
    );


    // =========================
    // JOIN ROOM
    // =========================

    socket.on(
      "join-room",
      async ({ username, roomCode }) => {
        if (
          !username ||
          typeof username !== "string"
        ) {
          socket.emit(
            "error-message",
            "Username is required."
          );

          return;
        }

        if (
          !roomCode ||
          typeof roomCode !== "string"
        ) {
          socket.emit(
            "error-message",
            "Room code is required."
          );

          return;
        }

        const cleanUsername =
          username.trim();

        const normalizedCode =
          roomCode.trim().toUpperCase();

        if (!cleanUsername) {
          socket.emit(
            "error-message",
            "Username is required."
          );

          return;
        }

        const room =
          getRoom(normalizedCode);

        if (!room) {
          socket.emit(
            "error-message",
            "Room not found."
          );

          return;
        }

        if (room.status !== "waiting") {
          socket.emit(
            "error-message",
            "This game has already started."
          );

          return;
        }

        if (room.players.length >= 5) {
          socket.emit(
            "error-message",
            "This room is full."
          );

          return;
        }

        const usernameExists =
          room.players.some(
            (player) =>
              player.username.toLowerCase() ===
              cleanUsername.toLowerCase()
          );

        if (usernameExists) {
          socket.emit(
            "error-message",
            "This username is already taken."
          );

          return;
        }

        try {
          // Find existing player or create a new one in MongoDB
          const databasePlayer =
            await findOrCreatePlayer(
              cleanUsername
            );

          const player = {
            id: socket.id,
            playerId:
              databasePlayer._id.toString(),
            username:
              databasePlayer.username,
            isHost: false,
            score: 0,
          };

          room.players.push(player);

          socket.join(normalizedCode);

          io.to(normalizedCode).emit(
            "room-updated",
            getPublicRoom(room)
          );

          console.log(
            `${cleanUsername} joined room ${normalizedCode}`
          );
        } catch (error) {
          console.error(
            "Error creating/finding player:",
            error
          );

          socket.emit(
            "error-message",
            "Unable to create player."
          );
        }
      }
    );


    // =========================
    // START GAME
    // =========================

    socket.on(
      "start-game",
      ({ roomCode }) => {
        if (
          !roomCode ||
          typeof roomCode !== "string"
        ) {
          socket.emit(
            "error-message",
            "Room code is required."
          );

          return;
        }

        const normalizedCode =
          roomCode.trim().toUpperCase();

        const room =
          getRoom(normalizedCode);

        if (!room) {
          socket.emit(
            "error-message",
            "Room not found."
          );

          return;
        }

        const player =
          room.players.find(
            (item) =>
              item.id === socket.id
          );

        if (!player?.isHost) {
          socket.emit(
            "error-message",
            "Only the host can start the game."
          );

          return;
        }

        if (room.players.length < 2) {
          socket.emit(
            "error-message",
            "At least 2 players are required."
          );

          return;
        }

        if (room.players.length > 5) {
          socket.emit(
            "error-message",
            "A maximum of 5 players is allowed."
          );

          return;
        }

        if (room.status !== "waiting") {
          socket.emit(
            "error-message",
            "The game has already started."
          );

          return;
        }

        room.status = "playing";
        room.quiz = createQuiz();

        const firstQuestion =
          startQuestion(room.quiz);

        io.to(normalizedCode).emit(
          "game-started"
        );

        io.to(normalizedCode).emit(
          "question-started",
          firstQuestion
        );

        io.to(normalizedCode).emit(
          "leaderboard-updated",
          createLeaderboard(
            room.players
          )
        );

        // Initialiser le compteur de réponses
        io.to(normalizedCode).emit(
          "player-answered",
          {
            answeredCount: 0,
            totalPlayers:
              room.players.length,
          }
        );

        scheduleQuestionEnd(
          io,
          normalizedCode,
          room
        );

        console.log(
          `Game started in room ${normalizedCode}`
        );
      }
    );


    // =========================
    // CURRENT QUESTION
    // =========================

    socket.on(
      "request-current-question",
      ({ roomCode }) => {
        if (
          !roomCode ||
          typeof roomCode !== "string"
        ) {
          socket.emit(
            "error-message",
            "Room code is required."
          );

          return;
        }

        const normalizedCode =
          roomCode.trim().toUpperCase();

        const room =
          getRoom(normalizedCode);

        if (!room) {
          socket.emit(
            "error-message",
            "Room not found."
          );

          return;
        }

        if (
          room.status !== "playing" ||
          !room.quiz
        ) {
          socket.emit(
            "error-message",
            "There is no active quiz."
          );

          return;
        }

        if (room.quiz.questionFinished) {
          return;
        }

        const question =
          getPublicQuestion(room.quiz);

        if (!question) {
          return;
        }

        socket.emit(
          "question-started",
          {
            ...question,
            remainingTime:
              getRemainingTime(
                room.quiz
              ),
          }
        );

        // Envoyer également la progression actuelle
        socket.emit(
          "player-answered",
          {
            answeredCount:
              room.quiz.answers.size,
            totalPlayers:
              room.players.length,
          }
        );
      }
    );


    // =========================
    // SUBMIT ANSWER
    // =========================

    socket.on(
      "submit-answer",
      ({
        roomCode,
        answerIndex,
      }) => {
        if (
          !roomCode ||
          typeof roomCode !== "string"
        ) {
          socket.emit(
            "error-message",
            "Room code is required."
          );

          return;
        }

        const normalizedCode =
          roomCode.trim().toUpperCase();

        const room =
          getRoom(normalizedCode);

        if (!room) {
          socket.emit(
            "error-message",
            "Room not found."
          );

          return;
        }

        if (
          room.status !== "playing" ||
          !room.quiz
        ) {
          socket.emit(
            "error-message",
            "There is no active quiz."
          );

          return;
        }

        const player =
          room.players.find(
            (item) =>
              item.id === socket.id
          );

        if (!player) {
          socket.emit(
            "error-message",
            "You are not part of this room."
          );

          return;
        }

        const result =
          submitAnswer(
            room.quiz,
            socket.id,
            answerIndex
          );

        if (!result.success) {
          socket.emit(
            "error-message",
            result.message
          );

          return;
        }

        // Score cumulatif
        player.score += result.score;

        // Résultat privé
        socket.emit(
          "answer-submitted",
          {
            isCorrect:
              result.isCorrect,
            score: result.score,
            remainingTime:
              result.remainingTime,
          }
        );

        // Classement en temps réel
        io.to(normalizedCode).emit(
          "leaderboard-updated",
          createLeaderboard(
            room.players
          )
        );

        // Progression des réponses
        const answeredCount =
          room.quiz.answers.size;

        const totalPlayers =
          room.players.length;

        io.to(normalizedCode).emit(
          "player-answered",
          {
            playerId: player.id,
            username: player.username,
            answeredCount,
            totalPlayers,
          }
        );

        console.log(
          `${player.username} answered question ${
            room.quiz.currentQuestionIndex + 1
          } for ${result.score} points`
        );

        // Tout le monde a répondu
        if (
          allPlayersAnswered(
            room.quiz,
            room.players.length
          )
        ) {
          finishQuestion(
            io,
            normalizedCode,
            room
          );
        }
      }
    );


    // =========================
    // DISCONNECT
    // =========================

    socket.on(
      "disconnect",
      () => {
        console.log(
          `User disconnected: ${socket.id}`
        );

        for (const [
          roomCode,
          room,
        ] of rooms.entries()) {
          const playerIndex =
            room.players.findIndex(
              (player) =>
                player.id === socket.id
            );

          if (playerIndex === -1) {
            continue;
          }

          const removedPlayer =
            room.players[playerIndex];

          // Supprimer sa réponse actuelle
          // pour garder le compteur cohérent
          if (room.quiz?.answers) {
            room.quiz.answers.delete(
              socket.id
            );
          }

          room.players.splice(
            playerIndex,
            1
          );

          console.log(
            `${removedPlayer.username} left room ${roomCode}`
          );

          // Room vide
          if (room.players.length === 0) {
            if (room.quiz?.questionTimer) {
              clearTimeout(
                room.quiz.questionTimer
              );
            }

            rooms.delete(roomCode);

            console.log(
              `Room ${roomCode} deleted`
            );

            continue;
          }

          // Si la partie est en cours,
          // le joueur déconnecté ne doit plus
          // bloquer la question.
          if (
            room.status === "playing" &&
            room.quiz &&
            !room.quiz.questionFinished &&
            allPlayersAnswered(
              room.quiz,
              room.players.length
            )
          ) {
            finishQuestion(
              io,
              roomCode,
              room
            );
          }

          // Réattribuer le host si nécessaire
          const hasHost =
            room.players.some(
              (player) =>
                player.isHost
            );

          if (!hasHost) {
            room.players[0].isHost = true;

            console.log(
              `${room.players[0].username} is now host of ${roomCode}`
            );
          }

          io.to(roomCode).emit(
            "room-updated",
            getPublicRoom(room)
          );

          if (
            room.status === "playing"
          ) {
            io.to(roomCode).emit(
              "leaderboard-updated",
              createLeaderboard(
                room.players
              )
            );

            // Mettre à jour le compteur après
            // la déconnexion d'un joueur
            io.to(roomCode).emit(
              "player-answered",
              {
                answeredCount:
                  room.quiz?.answers.size ?? 0,
                totalPlayers:
                  room.players.length,
              }
            );
          }
        }
      }
    );
  });
}


module.exports = socketHandler;