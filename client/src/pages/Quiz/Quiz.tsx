import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useRoom } from "../../contexts/useRoom";
import { socket } from "../../socket/socket";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  questionNumber: number;
  totalQuestions: number;
  duration: number;
  startedAt: number;
  remainingTime: number;
}

interface AnswerResult {
  isCorrect: boolean;
  score: number;
  remainingTime: number;
}

interface QuestionResult {
  playerId: string;
  username: string;
  answerIndex: number | null;
  isCorrect: boolean;
  score: number;
  correctAnswer: number | null;
}

interface LeaderboardPlayer {
  rank: number;
  playerId: string;
  username: string;
  score: number;
}

interface AnswerProgress {
  playerId?: string;
  username?: string;
  answeredCount: number;
  totalPlayers: number;
}

function Quiz() {
  const navigate = useNavigate();
  const { room } = useRoom();

  const [question, setQuestion] =
    useState<QuizQuestion | null>(null);

  const [selectedAnswer, setSelectedAnswer] =
    useState<number | null>(null);

  const [answerResult, setAnswerResult] =
    useState<AnswerResult | null>(null);

  const [questionResults, setQuestionResults] =
    useState<QuestionResult[] | null>(null);

  const [showResults, setShowResults] =
    useState(false);

  const [leaderboard, setLeaderboard] =
    useState<LeaderboardPlayer[]>([]);

  const [error, setError] =
    useState("");

  const [timeLeft, setTimeLeft] =
    useState(15);

  const [answeredCount, setAnsweredCount] =
    useState(0);

  const [totalPlayers, setTotalPlayers] =
    useState(room?.players.length ?? 0);

  const [nextQuestionCountdown, setNextQuestionCountdown] =
    useState<number | null>(null);

  // =========================
  // SOCKET EVENTS
  // =========================

  useEffect(() => {
    if (!room) {
      navigate("/");
      return;
    }

    const handleQuestionStarted = (
      newQuestion: QuizQuestion
    ) => {
      setQuestion(newQuestion);

      setSelectedAnswer(null);
      setAnswerResult(null);

      setQuestionResults(null);
      setShowResults(false);

      setAnsweredCount(0);
      setTotalPlayers(
        room.players.length
      );

      setNextQuestionCountdown(null);

      setError("");

      setTimeLeft(
        newQuestion.remainingTime
      );
    };

    const handleAnswerSubmitted = (
      result: AnswerResult
    ) => {
      setAnswerResult(result);
    };

    const handleQuestionResults = ({
      results,
      leaderboard: updatedLeaderboard,
    }: {
      results: QuestionResult[];
      leaderboard?: LeaderboardPlayer[];
    }) => {
      setQuestionResults(results);
      setShowResults(true);

      setNextQuestionCountdown(3);

      if (updatedLeaderboard) {
        setLeaderboard(
          updatedLeaderboard
        );
      }
    };

    const handleLeaderboardUpdated = (
      updatedLeaderboard: LeaderboardPlayer[]
    ) => {
      setLeaderboard(
        updatedLeaderboard
      );
    };

    const handleAnswerProgress = (
      progress: AnswerProgress
    ) => {
      setAnsweredCount(
        progress.answeredCount
      );

      setTotalPlayers(
        progress.totalPlayers
      );
    };

    const handleGameFinished = ({
      leaderboard: finalLeaderboard,
    }: {
      leaderboard: LeaderboardPlayer[];
    }) => {
      setLeaderboard(
        finalLeaderboard
      );

      setQuestion(null);
      setQuestionResults(null);
      setShowResults(false);

      setAnswerResult(null);
      setSelectedAnswer(null);

      setNextQuestionCountdown(null);
    };

    const handleError = (
      message: string
    ) => {
      setError(message);
    };

    socket.on(
      "question-started",
      handleQuestionStarted
    );

    socket.on(
      "answer-submitted",
      handleAnswerSubmitted
    );

    socket.on(
      "question-results",
      handleQuestionResults
    );

    socket.on(
      "leaderboard-updated",
      handleLeaderboardUpdated
    );

    socket.on(
      "player-answered",
      handleAnswerProgress
    );

    socket.on(
      "game-finished",
      handleGameFinished
    );

    socket.on(
      "error-message",
      handleError
    );

    socket.emit(
      "request-current-question",
      {
        roomCode: room.code,
      }
    );

    return () => {
      socket.off(
        "question-started",
        handleQuestionStarted
      );

      socket.off(
        "answer-submitted",
        handleAnswerSubmitted
      );

      socket.off(
        "question-results",
        handleQuestionResults
      );

      socket.off(
        "leaderboard-updated",
        handleLeaderboardUpdated
      );

      socket.off(
        "player-answered",
        handleAnswerProgress
      );

      socket.off(
        "game-finished",
        handleGameFinished
      );

      socket.off(
        "error-message",
        handleError
      );
    };
  }, [room, navigate]);

  // =========================
  // NEXT QUESTION COUNTDOWN
  // =========================

  useEffect(() => {
    if (
      !showResults ||
      nextQuestionCountdown === null
    ) {
      return;
    }

    if (nextQuestionCountdown <= 0) {
      setNextQuestionCountdown(null);
      return;
    }

    const timer = setTimeout(() => {
      setNextQuestionCountdown(
        (current) =>
          current !== null
            ? current - 1
            : null
      );
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [
    showResults,
    nextQuestionCountdown,
  ]);

  // =========================
  // TIMER
  // =========================

  useEffect(() => {
    if (!question || showResults) {
      return;
    }

    const updateTimer = () => {
      const elapsed = Math.floor(
        (Date.now() -
          question.startedAt) /
          1000
      );

      const remaining = Math.max(
        0,
        question.duration - elapsed
      );

      setTimeLeft(remaining);
    };

    updateTimer();

    const interval = setInterval(
      updateTimer,
      250
    );

    return () => {
      clearInterval(interval);
    };
  }, [question, showResults]);

  // =========================
  // TIMER UI VALUES
  // =========================

  const timerProgress = question
    ? (timeLeft /
        question.duration) *
      100
    : 0;

  const isTimeCritical =
    timeLeft > 0 &&
    timeLeft <= 5;

  const isTimeExpired =
    timeLeft === 0;

  // =========================
  // CORRECT ANSWER
  // =========================

  const correctAnswer =
    questionResults?.[0]
      ?.correctAnswer ?? null;

  // =========================
  // ANSWER PROGRESS
  // =========================

  const answerProgress =
    totalPlayers > 0
      ? Math.min(
          100,
          (answeredCount /
            totalPlayers) *
            100
        )
      : 0;

  // =========================
  // SELECT ANSWER
  // =========================

  const selectAnswer = (
    answerIndex: number
  ) => {
    if (!room || !question) {
      return;
    }

    if (selectedAnswer !== null) {
      return;
    }

    if (timeLeft <= 0) {
      return;
    }

    setSelectedAnswer(answerIndex);
    setError("");

    socket.emit(
      "submit-answer",
      {
        roomCode: room.code,
        answerIndex,
      }
    );
  };

  // =========================
  // NO ROOM
  // =========================

  if (!room) {
    return null;
  }

  // =========================
  // FINAL LEADERBOARD
  // =========================

  if (
    !question &&
    leaderboard.length > 0
  ) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
        <div className="mx-auto max-w-3xl">

          <div className="mb-10 text-center">

            <p className="mb-2 text-sm font-medium uppercase tracking-[0.25em] text-indigo-400">
              QuizPulse
            </p>

            <h1 className="text-4xl font-bold">
              Game Over
            </h1>

            <p className="mt-3 text-slate-400">
              Final leaderboard
            </p>

          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">

            {leaderboard.map(
              (player) => (
                <div
                  key={player.playerId}
                  className="flex items-center justify-between border-b border-slate-800 px-6 py-5 last:border-b-0"
                >

                  <div className="flex items-center gap-5">

                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 font-bold">
                      {player.rank}
                    </div>

                    <div>

                      <p className="font-semibold">
                        {player.username}
                      </p>

                      {player.rank ===
                        1 && (
                        <p className="text-sm text-yellow-400">
                          🏆 Winner
                        </p>
                      )}

                    </div>

                  </div>

                  <p className="text-xl font-bold text-indigo-400">
                    {player.score}
                  </p>

                </div>
              )
            )}

          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/")
            }
            className="mt-8 w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold transition hover:bg-indigo-500"
          >
            Back to Home
          </button>

        </div>
      </main>
    );
  }

  // =========================
  // QUESTION RESULTS
  // =========================

  if (
    showResults &&
    questionResults
  ) {
    const sortedResults =
      [...questionResults].sort(
        (a, b) => b.score - a.score
      );

    return (
      <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
        <div className="mx-auto max-w-3xl">

          {/* HEADER */}

          <div className="mb-8 text-center">

            <p className="text-sm font-medium uppercase tracking-[0.25em] text-indigo-400">
              Question{" "}
              {question?.questionNumber}
            </p>

            <h1 className="mt-3 text-4xl font-bold">
              Question Complete
            </h1>

            <p className="mt-3 text-slate-400">
              Here are the results
            </p>

          </div>

          {/* CORRECT ANSWER */}

          {correctAnswer !== null &&
            question && (
              <div className="mb-8 rounded-2xl border border-green-500/20 bg-green-500/10 p-5 text-center">

                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-400">
                  Correct Answer
                </p>

                <div className="mt-3 flex items-center justify-center gap-3">

                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/20 text-sm font-bold text-green-400">
                    {String.fromCharCode(
                      65 + correctAnswer
                    )}
                  </span>

                  <p className="text-lg font-bold text-white">
                    {
                      question.options[
                        correctAnswer
                      ]
                    }
                  </p>

                </div>

              </div>
            )}

          {/* TOP 3 */}

          <div className="mb-8 grid gap-4 sm:grid-cols-3">

            {sortedResults
              .slice(0, 3)
              .map(
                (player, index) => (
                  <div
                    key={player.playerId}
                    className={`rounded-2xl border p-5 text-center ${
                      index === 0
                        ? "border-yellow-500/40 bg-yellow-500/10"
                        : "border-slate-800 bg-slate-900"
                    }`}
                  >

                    <div className="text-3xl">
                      {index === 0
                        ? "🥇"
                        : index === 1
                        ? "🥈"
                        : "🥉"}
                    </div>

                    <p className="mt-3 font-semibold">
                      {player.username}
                    </p>

                    <p className="mt-2 text-xl font-bold text-indigo-400">
                      +{player.score}
                    </p>

                  </div>
                )
              )}

          </div>

          {/* RESULTS LIST */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

            <h2 className="mb-4 text-lg font-bold">
              Results
            </h2>

            <div className="space-y-2">

              {sortedResults.map(
                (player, index) => (
                  <div
                    key={player.playerId}
                    className="flex items-center justify-between rounded-xl bg-slate-800/60 px-4 py-3"
                  >

                    <div className="flex items-center gap-3">

                      <span className="w-6 text-center text-sm text-slate-500">
                        {index + 1}
                      </span>

                      <span>
                        {player.username}

                        {player.playerId ===
                          socket.id && (
                          <span className="ml-2 text-xs text-indigo-400">
                            You
                          </span>
                        )}
                      </span>

                    </div>

                    <div className="flex items-center gap-3">

                      {player.isCorrect ? (
                        <span className="text-green-400">
                          ✓
                        </span>
                      ) : (
                        <span className="text-red-400">
                          ✕
                        </span>
                      )}

                      <span className="font-bold">
                        +{player.score}
                      </span>

                    </div>

                  </div>
                )
              )}

            </div>

          </div>

          {/* NEXT QUESTION COUNTDOWN */}

          <div className="mt-10 text-center">

            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              Next Question
            </p>

            <div className="mt-5 flex justify-center">

              <div
                key={nextQuestionCountdown}
                className="flex h-24 w-24 items-center justify-center rounded-full border border-indigo-500/30 bg-indigo-500/10 shadow-lg shadow-indigo-500/5"
              >

                <span className="text-4xl font-bold text-indigo-400">
                  {nextQuestionCountdown !==
                  null
                    ? nextQuestionCountdown
                    : "…"}
                </span>

              </div>

            </div>

            <p className="mt-4 text-sm text-slate-500">
              Get ready...
            </p>

            <div className="mx-auto mt-5 h-1 max-w-xs overflow-hidden rounded-full bg-slate-800">

              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-1000"
                style={{
                  width:
                    nextQuestionCountdown !==
                    null
                      ? `${
                          (nextQuestionCountdown /
                            3) *
                          100
                        }%`
                      : "0%",
                }}
              />

            </div>

          </div>

        </div>
      </main>
    );
  }

  // =========================
  // WAITING FOR QUESTION
  // =========================

  if (!question) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">

        <div className="text-center">

          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-indigo-500" />

          <p className="text-slate-400">
            Waiting for the next question...
          </p>

        </div>

      </main>
    );
  }

  // =========================
  // QUIZ
  // =========================

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">

      <div className="mx-auto max-w-6xl">

        {/* HEADER */}

        <div className="mb-8 flex items-center justify-between">

          <div>

            <p className="text-sm font-medium uppercase tracking-[0.25em] text-indigo-400">
              QuizPulse
            </p>

            <h1 className="mt-1 text-xl font-bold sm:text-2xl">

              Question{" "}
              {question.questionNumber}

              <span className="ml-2 text-sm font-normal text-slate-500">
                /{" "}
                {question.totalQuestions}
              </span>

            </h1>

          </div>

          {/* TIMER */}

          <div className="relative h-20 w-20">

            <svg
              className="h-20 w-20 -rotate-90"
              viewBox="0 0 100 100"
            >

              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                className="text-slate-800"
              />

              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                className={
                  isTimeExpired
                    ? "text-slate-600"
                    : isTimeCritical
                    ? "text-red-500"
                    : "text-indigo-500"
                }
                strokeDasharray="276.46"
                strokeDashoffset={
                  276.46 -
                  (276.46 *
                    timerProgress) /
                    100
                }
                style={{
                  transition:
                    "stroke-dashoffset 0.25s linear",
                }}
              />

            </svg>

            <div
              className={`absolute inset-0 flex flex-col items-center justify-center ${
                isTimeExpired
                  ? "text-slate-500"
                  : isTimeCritical
                  ? "text-red-400"
                  : "text-indigo-400"
              } ${
                isTimeCritical
                  ? "animate-pulse"
                  : ""
              }`}
            >

              <span className="text-xl font-bold leading-none">
                {timeLeft}
              </span>

              <span className="mt-1 text-[9px] uppercase tracking-wider text-slate-500">
                sec
              </span>

            </div>

          </div>

        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">

          {/* QUESTION */}

          <div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl sm:p-8">

              <div className="mb-6 flex items-center justify-between">

                <span className="text-sm font-medium text-indigo-400">
                  Question{" "}
                  {question.questionNumber}
                </span>

                <span className="text-sm text-slate-500">
                  {question.totalQuestions}{" "}
                  questions
                </span>

              </div>

              <h2 className="mb-8 text-2xl font-bold leading-relaxed sm:text-3xl">
                {question.question}
              </h2>

              {/* ANSWERS */}

              <div className="grid gap-4">

                {question.options.map(
                  (option, index) => {

                    const isSelected =
                      selectedAnswer ===
                      index;

                    const resultsReceived =
                      questionResults !==
                      null;

                    const isCorrectAnswer =
                      correctAnswer ===
                      index;

                    let answerClasses =
                      "border-slate-700 bg-slate-800/60 text-white";

                    let badgeClasses =
                      "bg-slate-700/60 text-slate-400";

                    if (
                      !resultsReceived
                    ) {
                      if (
                        isSelected &&
                        answerResult
                      ) {
                        if (
                          answerResult.isCorrect
                        ) {
                          answerClasses =
                            "border-green-500 bg-green-500/10 text-green-300 ring-1 ring-green-500/30";

                          badgeClasses =
                            "bg-green-500/20 text-green-400";
                        } else {
                          answerClasses =
                            "border-red-500 bg-red-500/10 text-red-300 ring-1 ring-red-500/30";

                          badgeClasses =
                            "bg-red-500/20 text-red-400";
                        }
                      } else if (
                        isSelected
                      ) {
                        answerClasses =
                          "border-indigo-500 bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30";

                        badgeClasses =
                          "bg-indigo-500/20 text-indigo-400";
                      }
                    }

                    if (
                      resultsReceived
                    ) {
                      if (
                        isCorrectAnswer
                      ) {
                        answerClasses =
                          "border-green-500 bg-green-500/10 text-green-300 ring-1 ring-green-500/30";

                        badgeClasses =
                          "bg-green-500/20 text-green-400";
                      } else if (
                        isSelected
                      ) {
                        answerClasses =
                          "border-red-500 bg-red-500/10 text-red-300 ring-1 ring-red-500/30";

                        badgeClasses =
                          "bg-red-500/20 text-red-400";
                      } else {
                        answerClasses =
                          "border-slate-800 bg-slate-800/40 text-slate-500";

                        badgeClasses =
                          "bg-slate-800 text-slate-600";
                      }
                    }

                    return (
                      <button
                        key={option}
                        type="button"
                        disabled={
                          selectedAnswer !==
                            null ||
                          timeLeft <= 0
                        }
                        onClick={() =>
                          selectAnswer(
                            index
                          )
                        }
                        className={`flex items-center rounded-xl border px-5 py-4 text-left font-medium transition duration-200 ${answerClasses} ${
                          selectedAnswer ===
                            null &&
                          timeLeft > 0
                            ? "hover:-translate-y-0.5 hover:border-indigo-500 hover:bg-slate-800"
                            : ""
                        } ${
                          selectedAnswer !==
                            null ||
                          timeLeft <= 0
                            ? "cursor-not-allowed"
                            : ""
                        }`}
                      >

                        <span
                          className={`mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${badgeClasses}`}
                        >
                          {String.fromCharCode(
                            65 + index
                          )}
                        </span>

                        <span className="flex-1">
                          {option}
                        </span>

                        {resultsReceived &&
                          isCorrectAnswer && (
                          <span className="ml-3 text-xl text-green-400">
                            ✓
                          </span>
                        )}

                        {resultsReceived &&
                          isSelected &&
                          !isCorrectAnswer && (
                          <span className="ml-3 text-xl text-red-400">
                            ✕
                          </span>
                        )}

                        {!resultsReceived &&
                          isSelected &&
                          answerResult && (
                          <span className="ml-3 text-xl">
                            {answerResult.isCorrect
                              ? "✓"
                              : "✕"}
                          </span>
                        )}

                      </button>
                    );
                  }
                )}

              </div>

              {/* ANSWER PROGRESS */}

              <div className="mt-8 rounded-xl border border-slate-800 bg-slate-800/40 px-4 py-4">

                <div className="mb-2 flex items-center justify-between">

                  <span className="text-sm font-medium text-slate-300">
                    Players answered
                  </span>

                  <span className="text-sm font-bold text-indigo-400">
                    {answeredCount} /{" "}
                    {totalPlayers}
                  </span>

                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-700">

                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                    style={{
                      width: `${answerProgress}%`,
                    }}
                  />

                </div>

              </div>

              {/* ANSWER STATUS */}

              <div className="mt-8 min-h-20">

                {selectedAnswer !==
                  null &&
                  !answerResult && (
                  <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-4 text-center text-indigo-300">

                    <p className="font-medium">
                      Answer submitted!
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      Waiting for other
                      players...
                    </p>

                  </div>
                )}

                {answerResult && (
                  <div
                    className={`rounded-xl border px-5 py-5 text-center ${
                      answerResult.isCorrect
                        ? "border-green-500/30 bg-green-500/10 text-green-400"
                        : "border-red-500/30 bg-red-500/10 text-red-400"
                    }`}
                  >

                    <div className="text-3xl">
                      {answerResult.isCorrect
                        ? "✓"
                        : "✕"}
                    </div>

                    <p className="mt-2 text-lg font-bold">
                      {answerResult.isCorrect
                        ? "Correct answer!"
                        : "Wrong answer!"}
                    </p>

                    <p className="mt-1 text-xl font-bold">
                      +{answerResult.score}{" "}
                      points
                    </p>

                    <p className="mt-2 text-sm text-slate-400">
                      Answered with{" "}
                      <span className="font-semibold text-slate-300">
                        {
                          answerResult.remainingTime
                        }
                        s
                      </span>{" "}
                      remaining
                    </p>

                  </div>
                )}

                {timeLeft === 0 &&
                  selectedAnswer ===
                    null && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-4 text-center text-red-400">

                    <p className="font-semibold">
                      Time's up!
                    </p>

                    <p className="mt-1 text-sm text-red-400/70">
                      Answers are now
                      locked.
                    </p>

                  </div>
                )}

              </div>

            </div>

          </div>

          {/* LIVE LEADERBOARD */}

          <aside className="h-fit rounded-2xl border border-slate-800 bg-slate-900 p-5">

            <div className="mb-5 flex items-center justify-between">

              <div>

                <h2 className="text-lg font-bold">
                  Leaderboard
                </h2>

                <p className="text-xs text-slate-500">
                  Live scores
                </p>

              </div>

              <span className="rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-400">
                LIVE
              </span>

            </div>

            <div className="space-y-2">

              {leaderboard.length ===
              0 ? (
                <p className="py-6 text-center text-sm text-slate-500">
                  Waiting for scores...
                </p>
              ) : (
                leaderboard.map(
                  (player) => (
                    <div
                      key={player.playerId}
                      className={`flex items-center justify-between rounded-xl px-3 py-3 transition ${
                        player.playerId ===
                        socket.id
                          ? "bg-indigo-500/10 ring-1 ring-indigo-500/30"
                          : "bg-slate-800/60"
                      }`}
                    >

                      <div className="flex min-w-0 items-center gap-3">

                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                            player.rank ===
                            1
                              ? "bg-yellow-500/20 text-yellow-400"
                              : player.rank ===
                                2
                              ? "bg-slate-300/20 text-slate-300"
                              : player.rank ===
                                3
                              ? "bg-orange-500/20 text-orange-400"
                              : "bg-slate-800 text-slate-500"
                          }`}
                        >
                          {player.rank}
                        </span>

                        <span className="truncate text-sm font-medium">
                          {player.username}

                          {player.playerId ===
                            socket.id && (
                            <span className="ml-1 text-xs text-indigo-400">
                              You
                            </span>
                          )}
                        </span>

                      </div>

                      <span className="ml-2 shrink-0 font-bold text-indigo-400">
                        {player.score}
                      </span>

                    </div>
                  )
                )
              )}

            </div>

          </aside>

        </div>

      </div>

    </main>
  );
}

export default Quiz;