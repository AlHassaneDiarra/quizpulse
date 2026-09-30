import { useState } from "react";
import type { ReactNode } from "react";

import {
  RoomContext,
  type Room,
} from "./RoomContext";

interface Props {
  children: ReactNode;
}

export function RoomProvider({ children }: Props) {
  const [username, setUsername] = useState("");

  const [room, setRoom] = useState<Room | null>(null);

  return (
    <RoomContext.Provider
      value={{
        username,
        setUsername,
        room,
        setRoom,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}