import { useContext } from "react";
import { RoomContext } from "./RoomContext";

export function useRoom() {
  return useContext(RoomContext);
}