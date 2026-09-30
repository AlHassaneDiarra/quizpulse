interface LobbyHeaderProps {
  playerCount: number;
}

function LobbyHeader({ playerCount }: LobbyHeaderProps) {
  return (
    <div className="text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
        Game Lobby
      </p>

      <h1 className="mt-2 text-4xl font-bold text-white">
        QuizPulse
      </h1>

      <p className="mt-2 text-slate-400">
        {playerCount}/5 players
      </p>
    </div>
  );
}

export default LobbyHeader;