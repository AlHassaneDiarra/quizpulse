import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { socket } from "../../socket/socket";
import { useRoom } from "../../contexts/useRoom";

import type { Room } from "../../types/room";

import {
  LobbyHeader,
  RoomCode,
  PlayerList,
  WaitingBanner,
  StartButton,
} from "../../components/lobby";

function Lobby() {
  const navigate = useNavigate();

  const { room, setRoom } = useRoom();

  useEffect(() => {
    const handleRoomUpdated = (updatedRoom: Room) => {
      setRoom(updatedRoom);
    };

    const handleGameStarted = () => {
      navigate("/quiz");
    };

    socket.on("room-updated", handleRoomUpdated);
    socket.on("game-started", handleGameStarted);

    return () => {
      socket.off("room-updated", handleRoomUpdated);
      socket.off("game-started", handleGameStarted);
    };
  }, [navigate, setRoom]);

  if (!room) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <p className="text-slate-400">
          Room not found.
        </p>
      </main>
    );
  }

  const currentPlayer = room.players.find(
    (player) => player.id === socket.id
  );

  const isHost = currentPlayer?.isHost ?? false;

  function startGame() {
    if (!room) {
      return;
    }

    if (!isHost || room.players.length < 2) {
      return;
    }

    socket.emit("start-game", {
      roomCode: room.code,
    });
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <LobbyHeader
          playerCount={room.players.length}
        />

        <div className="mt-8 space-y-6">
          <RoomCode code={room.code} />

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                Players
              </h2>

              <span className="text-sm text-slate-500">
                {room.players.length}/5
              </span>
            </div>

            <PlayerList
              players={room.players}
            />
          </div>

          <WaitingBanner
            playerCount={room.players.length}
          />

          <StartButton
            playerCount={room.players.length}
            isHost={isHost}
            onStart={startGame}
          />
        </div>
      </div>
    </main>
  );
}

export default Lobby;