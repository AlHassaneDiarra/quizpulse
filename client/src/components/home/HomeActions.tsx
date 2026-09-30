import { Button } from "../ui";

interface HomeActionsProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  isLoading?: boolean;
}

function HomeActions({
  onCreateRoom,
  onJoinRoom,
  isLoading = false,
}: HomeActionsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Button
        type="button"
        variant="primary"
        size="lg"
        onClick={onCreateRoom}
        isLoading={isLoading}
      >
        Create Room
      </Button>

      <Button
        type="button"
        variant="secondary"
        size="lg"
        onClick={onJoinRoom}
        disabled={isLoading}
      >
        Join Room
      </Button>
    </div>
  );
}

export default HomeActions;