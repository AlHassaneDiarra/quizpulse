const questions = require("../data/questions");

const QUESTION_DURATION = 15;
const MAX_SCORE = 1000;

function createQuiz() {
  return {
    questions,
    currentQuestionIndex: 0,
    answers: new Map(),
    questionStartedAt: null,
    questionFinished: false,
    questionTimer: null,
    startedAt: null,
  };
}

function startQuestion(quiz) {
  if (!quiz) return null;

  if (quiz.questionTimer) {
    clearTimeout(quiz.questionTimer);
    quiz.questionTimer = null;
  }

  if (!quiz.startedAt) {
    quiz.startedAt = Date.now();
  }

  quiz.questionStartedAt = Date.now();
  quiz.answers.clear();
  quiz.questionFinished = false;

  return getPublicQuestion(quiz);
}

function getCurrentQuestion(quiz) {
  if (!quiz) {
    return null;
  }

  return (
    quiz.questions[
      quiz.currentQuestionIndex
    ] || null
  );
}

function getPublicQuestion(quiz) {
  const question =
    getCurrentQuestion(quiz);

  if (!question) {
    return null;
  }

  return {
    id: question.id,
    question: question.question,
    options: question.options,
    questionNumber:
      quiz.currentQuestionIndex + 1,
    totalQuestions:
      quiz.questions.length,
    duration: QUESTION_DURATION,
    startedAt: quiz.questionStartedAt,
    remainingTime:
      getRemainingTime(quiz),
  };
}

function getRemainingTime(quiz) {
  if (
    !quiz ||
    !quiz.questionStartedAt
  ) {
    return QUESTION_DURATION;
  }

  const elapsed = Math.floor(
    (Date.now() -
      quiz.questionStartedAt) /
      1000
  );

  return Math.max(
    0,
    QUESTION_DURATION - elapsed
  );
}

function isQuestionExpired(quiz) {
  return getRemainingTime(quiz) <= 0;
}

function calculateScore(
  isCorrect,
  remainingTime
) {
  if (!isCorrect) {
    return 0;
  }

  const ratio =
    remainingTime /
    QUESTION_DURATION;

  return Math.round(
    MAX_SCORE * ratio
  );
}

function submitAnswer(
  quiz,
  playerId,
  answerIndex
) {
  if (!quiz) {
    return {
      success: false,
      message: "Quiz not found.",
    };
  }

  if (quiz.questionFinished) {
    return {
      success: false,
      message:
        "This question has already finished.",
    };
  }

  if (isQuestionExpired(quiz)) {
    return {
      success: false,
      message: "Time is up.",
    };
  }

  if (quiz.answers.has(playerId)) {
    return {
      success: false,
      message:
        "You have already answered.",
    };
  }

  const question =
    getCurrentQuestion(quiz);

  if (!question) {
    return {
      success: false,
      message: "No active question.",
    };
  }

  if (
    !Number.isInteger(answerIndex) ||
    answerIndex < 0 ||
    answerIndex >=
      question.options.length
  ) {
    return {
      success: false,
      message: "Invalid answer.",
    };
  }

  const isCorrect =
    answerIndex ===
    question.correctAnswer;

  const remainingTime =
    getRemainingTime(quiz);

  const score = calculateScore(
    isCorrect,
    remainingTime
  );

  quiz.answers.set(playerId, {
    answerIndex,
    isCorrect,
    remainingTime,
    score,
  });

  return {
    success: true,
    isCorrect,
    remainingTime,
    score,
  };
}

function allPlayersAnswered(
  quiz,
  playerCount
) {
  if (!quiz) {
    return false;
  }

  return (
    quiz.answers.size >= playerCount
  );
}

function getResults(
  quiz,
  players
) {
  if (!quiz) {
    return [];
  }

  const question =
    getCurrentQuestion(quiz);

  return players.map((player) => {
    const answer =
      quiz.answers.get(player.id);

    return {
      playerId: player.id,
      username: player.username,

      answerIndex:
        answer?.answerIndex ?? null,

      isCorrect:
        answer?.isCorrect ?? false,

      score:
        answer?.score ?? 0,

      correctAnswer:
        question?.correctAnswer ?? null,
    };
  });
}

function moveToNextQuestion(quiz) {
  if (!quiz) {
    return false;
  }

  if (
    quiz.currentQuestionIndex >=
    quiz.questions.length - 1
  ) {
    return false;
  }

  quiz.currentQuestionIndex += 1;

  startQuestion(quiz);

  return true;
}

function isQuizFinished(quiz) {
  if (!quiz) {
    return false;
  }

  return (
    quiz.currentQuestionIndex >=
    quiz.questions.length - 1
  );
}

function finishQuiz(quiz) {
  if (!quiz) {
    return;
  }

  if (quiz.questionTimer) {
    clearTimeout(
      quiz.questionTimer
    );

    quiz.questionTimer = null;
  }

  quiz.questionFinished = true;
}

module.exports = {
  QUESTION_DURATION,
  createQuiz,
  startQuestion,
  getCurrentQuestion,
  getPublicQuestion,
  getRemainingTime,
  isQuestionExpired,
  calculateScore,
  submitAnswer,
  allPlayersAnswered,
  getResults,
  moveToNextQuestion,
  isQuizFinished,
  finishQuiz,
};