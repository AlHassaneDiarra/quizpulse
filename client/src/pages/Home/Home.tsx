import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { socket } from "../../socket/socket";
import { useRoom } from "../../contexts/useRoom";
import { savePlayerId } from "../../utils/playerStorage";
import {
  HomeCard,
  UsernameInput,
  RoomCodeInput,
  HomeActions,
} from "../../components/home";

function Home() {
  const navigate = useNavigate();

  const {
    username,
    setUsername,
    setRoom,
  } = useRoom();

  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleRoomCreated = (room: any) => {
      setRoom(room);
      setIsLoading(false);
      navigate("/lobby");
    };

    const handleRoomUpdated = (room: any) => {
      setRoom(room);
      setIsLoading(false);
      navigate("/lobby");
    };

    const handleError = (message: string) => {
      setError(message);
      setIsLoading(false);
    };

    socket.on("room-created", (createdRoom) => {
      setRoom(createdRoom);

      const currentPlayer = createdRoom.players.find(
        (player: { id: string; playerId?: string }) =>
          player.id === socket.id
      );

      if (currentPlayer?.playerId) {
        savePlayerId(currentPlayer.playerId);
      }

      navigate("/lobby");
    });
    socket.on("room-updated", (updatedRoom) => {
      setRoom(updatedRoom);

      const currentPlayer = updatedRoom.players.find(
        (player: { id: string; playerId?: string }) =>
          player.id === socket.id
      );

      if (!currentPlayer) {
        return;
      }

      if (currentPlayer.playerId) {
        savePlayerId(currentPlayer.playerId);
      }

      navigate("/lobby");
    });
    socket.on("error-message", handleError);

    return () => {
      socket.off("room-created", handleRoomCreated);
      socket.off("room-updated", handleRoomUpdated);
      socket.off("error-message", handleError);
    };
  }, [navigate, setRoom]);

  function createRoom() {
    setError("");

    if (!username.trim()) {
      setError("Please enter a username.");
      return;
    }

    setIsLoading(true);

    socket.emit("create-room", {
      username: username.trim(),
    });
  }

  function joinRoom() {
    setError("");

    if (!username.trim()) {
      setError("Please enter a username.");
      return;
    }

    if (!roomCode.trim()) {
      setError("Please enter a room code.");
      return;
    }

    if (roomCode.length !== 6) {
      setError("Room code must contain 6 characters.");
      return;
    }

    setIsLoading(true);

    socket.emit("join-room", {
      username: username.trim(),
      roomCode: roomCode.trim(),
    });
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12">
      <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center">
        <HomeCard>
          <div className="text-center">
            <div className="mb-4 inline-flex rounded-2xl bg-blue-600/10 px-4 py-2">
              <span className="text-sm font-semibold text-blue-400">
                Multiplayer Quiz
              </span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-white">
              QuizPulse
            </h1>

            <p className="mt-3 text-slate-400">
              Challenge your friends in real time.
            </p>
          </div>

          <div className="mt-8 space-y-5">
            <UsernameInput
              value={username}
              onChange={setUsername}
              error={
                error.includes("username")
                  ? error
                  : undefined
              }
            />

            <RoomCodeInput
              value={roomCode}
              onChange={setRoomCode}
              error={
                error.includes("room code")
                  ? error
                  : undefined
              }
            />

            {error &&
              !error.includes("username") &&
              !error.includes("room code") && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
                  <p className="text-sm text-red-400">
                    {error}
                  </p>
                </div>
              )}

            <HomeActions
              onCreateRoom={createRoom}
              onJoinRoom={joinRoom}
              isLoading={isLoading}
            />
          </div>
        </HomeCard>
      </div>
    </main>
  );
}

export default Home;