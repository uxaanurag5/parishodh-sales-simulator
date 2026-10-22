import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@parishodh/shared";
import { useAuthStore } from "../store/authStore";

export type SimSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function createSimSocket(): SimSocket {
  const token = useAuthStore.getState().token;
  return io("/sim", {
    auth: { token },
    autoConnect: false,
  });
}
