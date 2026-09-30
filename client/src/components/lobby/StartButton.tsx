import { Button } from "../ui";

interface StartButtonProps {
  playerCount: number;
  isHost: boolean;
  onStart: () => void;
}

function StartButton({
  playerCount,
  isHost,
  onStart,
}: StartButtonProps) {
  if (!isHost) {
    return null;
  }

  const canStart =
    playerCount >= 2 && playerCount <= 5;

  return (
    <Button
      variant="success"
      size="lg"
      className="w-full"
      disabled={!canStart}
      onClick={onStart}
    >
      {canStart ? "Start Game" : "Waiting for Players"}
    </Button>
  );
}

export default StartButton;