import { io, type Socket } from "socket.io-client"
import type { Card, GameState, GameConfig } from "@/types/truco"

interface ClientToServerEvents {
  "player:join": (data: { roomId: string; name: string }, callback: (response: any) => void) => void
  "room:create": (data: { name: string; config: GameConfig }, callback: (response: any) => void) => void
  "room:join_code": (data: { code: string; name: string }, callback: (response: any) => void) => void
  "game:start": (data: { roomId: string }, callback: (response: any) => void) => void
  "play:card": (data: { roomId: string; cardId: string }, callback: (response: any) => void) => void
  "call:truco": (data: { roomId: string }, callback: (response: any) => void) => void
  "call:envido": (
    data: { roomId: string; type: "envido" | "real_envido" | "falta_envido" },
    callback: (response: any) => void,
  ) => void
  "call:flor": (data: { roomId: string }, callback: (response: any) => void) => void
  "call:response": (data: { roomId: string; accept: boolean }, callback: (response: any) => void) => void
  "player:leave": (data: { roomId: string }) => void
  "rooms:list": (callback: (response: any) => void) => void
  "match:quick": (data: { config: GameConfig }, callback: (response: any) => void) => void
  "phase:skip": (data: { roomId: string }, callback: (response: any) => void) => void
}

interface ServerToClientEvents {
  "room:update": (data: { room: any }) => void
  "rooms:list": (data: { rooms: any[] }) => void
  "game:update": (data: { gameState: Partial<GameState> }) => void
  "game:hand": (data: { hand: Card[] }) => void
  "game:message": (data: { type: string; text: string; timestamp: Date }) => void
  "game:ended": (data: { winnerId: string; scores: { [playerId: string]: number } }) => void
  "match:found": (data: { roomId: string }) => void
  error: (data: { message: string }) => void
}

class SocketManager {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null
  private serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001"

  connect(): Socket<ServerToClientEvents, ClientToServerEvents> {
    if (!this.socket) {
      this.socket = io(`${this.serverUrl}/game`, {
        transports: ["websocket", "polling"],
      })
    }
    return this.socket
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
    return this.socket
  }
}

export const socketManager = new SocketManager()
export type { ClientToServerEvents, ServerToClientEvents }
