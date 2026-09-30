interface WaitingBannerProps {
  playerCount: number;
}

function WaitingBanner({
  playerCount,
}: WaitingBannerProps) {
  if (playerCount >= 2) {
    return null;
  }

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-center">
      <p className="font-medium text-amber-400">
        Waiting for another player...
      </p>

      <p className="mt-1 text-sm text-amber-400/70">
        At least 2 players are required to start.
      </p>
    </div>
  );
}

export default WaitingBanner;