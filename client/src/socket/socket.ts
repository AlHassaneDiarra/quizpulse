import { io } from "socket.io-client";

export const socket = io("http://172.16.2.13:5000", {
  autoConnect: true,
});