import { createContext } from "react";

import type { Room } from "../types/room";
export type { Room };

export interface RoomContextType {
  username: string;
  setUsername: (value: string) => void;

  room: Room | null;
  setRoom: (room: Room | null) => void;
}

export const RoomContext = createContext<RoomContextType>({
  username: "",
  setUsername: () => {},

  room: null,
  setRoom: () => {},
});