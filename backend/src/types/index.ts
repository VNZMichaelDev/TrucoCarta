// Shared types for the backend
export type Suit = "espadas" | "bastos" | "oros" | "copas"
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 10 | 11 | 12

export interface Card {
  suit: Suit
  rank: Rank
  id: string
}

export interface Player {
  id: string
  name: string
  connected: boolean
  socketId?: string
  lastSeen: Date
}

export interface Trick {
  plays: { playerId: string; card: Card }[]
  winnerId?: string
}

export type CallType = "truco" | "envido" | "real_envido" | "falta_envido" | "flor"

export interface Call {
  type: CallType
  level: number // For truco: 1-4, for envido: 1=envido(2pts), 2=real_envido(3pts), 3=falta_envido
  by: string
  points?: number // For envido/flor points calculation
}

export type GamePhase = "flor" | "envido" | "truco" | "playing"

export interface GameConfig {
  maxPoints: 15 | 30
  withFlor: boolean
}

export interface GameState {
  deck: Card[]
  hands: { [playerId: string]: Card[] }
  table: Trick
  wonTricks: { [playerId: string]: number }
  turnPlayerId: string
  handStarterId: string
  roundNumber: 1 | 2 | 3
  call: Call | null
  accepted: boolean
  scores: { [playerId: string]: number }
  winnerId?: string
  phase: GamePhase
  config: GameConfig
  envidoPoints: { [playerId: string]: number }
  florCalled: boolean
  envidoCalled: boolean
}

export interface Room {
  id: string
  code?: string // Added room code for quick access
  players: Player[]
  status: "waiting" | "playing" | "ended"
  game: GameState | null
  createdAt: Date
  lastActivity: Date
  config: GameConfig // Added room configuration
}

export interface ClientToServerEvents {
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

export interface ServerToClientEvents {
  "room:update": (data: { room: Omit<Room, "game"> & { playerCount: number } }) => void
  "rooms:list": (data: { rooms: Room[] }) => void
  "game:update": (data: { gameState: Partial<GameState> }) => void
  "game:hand": (data: { hand: Card[] }) => void
  "game:message": (data: { type: string; text: string; timestamp: Date }) => void
  "game:ended": (data: { winnerId: string; scores: { [playerId: string]: number } }) => void
  "match:found": (data: { roomId: string }) => void
  error: (data: { message: string }) => void
}

export interface GameMessage {
  type: "info" | "action" | "truco" | "envido" | "flor" | "winner"
  text: string
  timestamp: Date
}
