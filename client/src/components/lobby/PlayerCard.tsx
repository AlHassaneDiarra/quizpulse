import type { Player } from "../../types/player";

interface PlayerCardProps {
  player: Player;
}

function PlayerCard({ player }: PlayerCardProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/50 p-4">
      <div className="flex items-center gap-3">

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-lg">
          {player.isHost ? "👑" : "👤"}
        </div>

        <div>
          <p className="font-semibold text-white">
            {player.username}
          </p>

          {player.isHost && (
            <p className="text-xs text-blue-400">
              Host
            </p>
          )}
        </div>

      </div>

      <span className="text-sm text-slate-500">
        Ready
      </span>
    </div>
  );
}

export default PlayerCard;