import type { Player } from "./player";

export type RoomStatus = "waiting" | "playing" | "finished";

export interface Room {
  code: string;
  players: Player[];
  status: RoomStatus;
}