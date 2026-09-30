import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button, Card } from "../../components/ui";
import { getPlayerId } from "../../utils/playerStorage";
import type { PlayerStats } from "../../types/playerStats";

function Profile() {
  const navigate = useNavigate();

  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const playerId = getPlayerId();

    if (!playerId) {
      setError("No player profile was found.");
      setLoading(false);
      return;
    }

    const loadStats = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/players/${playerId}/stats`
        );

        if (!response.ok) {
          throw new Error(
            "Unable to retrieve player statistics."
          );
        }

        const data: PlayerStats = await response.json();

        setStats(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load your statistics.");
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-slate-400">
          Loading profile...
        </p>
      </main>
    );
  }

  if (error || !stats) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <Card className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-3">
            Profile unavailable
          </h1>

          <p className="text-slate-400 mb-6">
            {error || "Unable to load your profile."}
          </p>

          <Button
            variant="primary"
            onClick={() => navigate("/")}
          >
            Back to Home
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-10">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-sm text-cyan-400 font-medium mb-1">
              QUIZPULSE
            </p>

            <h1 className="text-3xl font-bold">
              {stats.player.username}
            </h1>

            <p className="text-slate-400 mt-1">
              Player profile and statistics
            </p>
          </div>

          <Button
            variant="secondary"
            onClick={() => navigate("/")}
          >
            Back to Home
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

          <Card>
            <p className="text-sm text-slate-400">
              Total Score
            </p>

            <p className="text-3xl font-bold mt-2">
              {stats.player.totalScore}
            </p>
          </Card>

          <Card>
            <p className="text-sm text-slate-400">
              Games Played
            </p>

            <p className="text-3xl font-bold mt-2">
              {stats.player.gamesPlayed}
            </p>
          </Card>

          <Card>
            <p className="text-sm text-slate-400">
              Games Won
            </p>

            <p className="text-3xl font-bold mt-2">
              {stats.player.gamesWon}
            </p>
          </Card>

          <Card>
            <p className="text-sm text-slate-400">
              Win Rate
            </p>

            <p className="text-3xl font-bold mt-2">
              {stats.player.winRate}%
            </p>
          </Card>

        </div>

        {/* Recent games */}
        <Card>
          <div className="mb-6">
            <h2 className="text-xl font-semibold">
              Recent Games
            </h2>

            <p className="text-sm text-slate-400 mt-1">
              Your latest QuizPulse matches
            </p>
          </div>

          {stats.recentGames.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-slate-400">
                No games played yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentGames.map((game) => (
                <div
                  key={game.gameId}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl bg-slate-800/60 border border-slate-700 p-4"
                >
                  <div>
                    <p className="font-medium">
                      Room #{game.roomCode}
                    </p>

                    <p className="text-sm text-slate-400 mt-1">
                      {new Date(
                        game.finishedAt
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-5 text-sm">

                    <div>
                      <span className="text-slate-400">
                        Score
                      </span>

                      <p className="font-semibold">
                        {game.score}
                      </p>
                    </div>

                    <div>
                      <span className="text-slate-400">
                        Rank
                      </span>

                      <p className="font-semibold">
                        {game.rank
                          ? `#${game.rank}`
                          : "-"}
                      </p>
                    </div>

                    <div>
                      <span className="text-slate-400">
                        Result
                      </span>

                      <p
                        className={
                          game.isWinner
                            ? "font-semibold text-emerald-400"
                            : "font-semibold text-slate-300"
                        }
                      >
                        {game.isWinner
                          ? "Victory"
                          : "Played"}
                      </p>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

      </div>
    </main>
  );
}

export default Profile;