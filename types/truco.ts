// Core game types for Truco
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
  config: GameConfig // Added room configuration
}

export interface SocketEvents {
  "player:join": { roomId: string; name: string }
  "room:create": { name: string; config: GameConfig }
  "room:join_code": { code: string; name: string }
  "game:start": { roomId: string }
  "play:card": { roomId: string; cardId: string }
  "call:truco": { roomId: string }
  "call:envido": { roomId: string; type: "envido" | "real_envido" | "falta_envido" }
  "call:flor": { roomId: string }
  "call:response": { roomId: string; accept: boolean }
  "player:leave": { roomId: string }
  "rooms:list": {}
  "match:quick": { config: GameConfig }
}

export interface SocketResponses {
  "room:update": { room: Room }
  "rooms:list": { rooms: Room[] }
  "game:update": { gameState: Partial<GameState> }
  "game:hand": { hand: Card[] }
  "game:message": { type: string; text: string }
  "game:ended": { winnerId: string; scores: { [playerId: string]: number } }
  "match:found": { roomId: string }
  error: { message: string }
}
