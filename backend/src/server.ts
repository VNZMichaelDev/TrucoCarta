import express from "express"
import { createServer } from "http"
import { Server } from "socket.io"
import cors from "cors"
import helmet from "helmet"
import type { ClientToServerEvents, ServerToClientEvents, GameMessage } from "./types"
import { RoomManager } from "./services/room-manager"

const app = express()
const server = createServer(app)

// Middleware
app.use(helmet())
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
)
app.use(express.json())

// Socket.IO setup
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
  namespace: "/game",
})

// Services
const roomManager = new RoomManager()

// Utility functions
function createGameMessage(type: GameMessage["type"], text: string): GameMessage {
  return {
    type,
    text,
    timestamp: new Date(),
  }
}

function sanitizeRoomForClient(room: any) {
  return {
    id: room.id,
    code: room.code,
    players: room.players.map((p: any) => ({
      id: p.id,
      name: p.name,
      connected: p.connected,
    })),
    status: room.status,
    playerCount: room.players.filter((p: any) => p.connected).length,
    createdAt: room.createdAt,
    config: room.config,
  }
}

function sanitizeGameStateForClient(gameState: any, playerId?: string) {
  const sanitized = {
    table: gameState.table,
    wonTricks: gameState.wonTricks,
    turnPlayerId: gameState.turnPlayerId,
    roundNumber: gameState.roundNumber,
    call: gameState.call,
    accepted: gameState.accepted,
    scores: gameState.scores,
    winnerId: gameState.winnerId,
    phase: gameState.phase,
    config: gameState.config,
    envidoPoints: gameState.envidoPoints,
    florCalled: gameState.florCalled,
    envidoCalled: gameState.envidoCalled,
  }

  return sanitized
}

// Socket.IO event handlers
const gameNamespace = io.of("/game")

gameNamespace.on("connection", (socket) => {
  console.log(`Player connected: ${socket.id}`)

  socket.on("room:create", ({ name, config }, callback) => {
    try {
      const room = roomManager.createRoom(socket.id, name, config)
      socket.join(room.id)

      const sanitizedRoom = sanitizeRoomForClient(room)
      callback({ success: true, roomId: room.id, code: room.code, room: sanitizedRoom })

      socket.to(room.id).emit("room:update", { room: sanitizedRoom })

      const message = createGameMessage("info", `${name} creó la sala`)
      gameNamespace.to(room.id).emit("game:message", message)
    } catch (error) {
      callback({ success: false, error: (error as Error).message })
    }
  })

  socket.on("room:join_code", ({ code, name }, callback) => {
    try {
      const room = roomManager.joinRoomByCode(code, socket.id, name)
      socket.join(room.id)

      const sanitizedRoom = sanitizeRoomForClient(room)
      callback({ success: true, roomId: room.id, room: sanitizedRoom })

      gameNamespace.to(room.id).emit("room:update", { room: sanitizedRoom })

      const message = createGameMessage("info", `${name} se unió a la sala`)
      gameNamespace.to(room.id).emit("game:message", message)
    } catch (error) {
      callback({ success: false, error: (error as Error).message })
    }
  })

  socket.on("match:quick", ({ config }, callback) => {
    try {
      const room = roomManager.findQuickMatch(socket.id, "Jugador", config)

      if (room) {
        // Found immediate match
        socket.join(room.id)
        const sanitizedRoom = sanitizeRoomForClient(room)
        callback({ success: true, roomId: room.id })

        // Notify both players
        gameNamespace.to(room.id).emit("match:found", { roomId: room.id })
        gameNamespace.to(room.id).emit("room:update", { room: sanitizedRoom })

        const message = createGameMessage("info", "¡Emparejamiento encontrado!")
        gameNamespace.to(room.id).emit("game:message", message)
      } else {
        // Added to queue, waiting for match
        callback({ success: true, waiting: true })
      }
    } catch (error) {
      callback({ success: false, error: (error as Error).message })
    }
  })

  socket.on("rooms:list", (callback) => {
    try {
      const waitingRooms = roomManager.getWaitingRooms()
      callback({ success: true, rooms: waitingRooms })
    } catch (error) {
      callback({ success: false, error: (error as Error).message })
    }
  })

  socket.on("player:join", ({ roomId, name }, callback) => {
    try {
      const room = roomManager.joinRoom(roomId, socket.id, name)
      socket.join(roomId)

      const sanitizedRoom = sanitizeRoomForClient(room)
      callback({ success: true, room: sanitizedRoom })

      gameNamespace.to(roomId).emit("room:update", { room: sanitizedRoom })

      const message = createGameMessage("info", `${name} se unió a la sala`)
      gameNamespace.to(roomId).emit("game:message", message)
    } catch (error) {
      callback({ success: false, error: (error as Error).message })
    }
  })

  socket.on("game:start", ({ roomId }, callback) => {
    try {
      const room = roomManager.startGame(roomId)

      if (room.game) {
        const sanitizedRoom = sanitizeRoomForClient(room)
        gameNamespace.to(roomId).emit("room:update", { room: sanitizedRoom })

        // Send game state to all players
        const gameState = sanitizeGameStateForClient(room.game)
        gameNamespace.to(roomId).emit("game:update", { gameState })

        // Send private hands to each player
        for (const player of room.players) {
          if (player.connected && room.game.hands[player.id]) {
            gameNamespace.to(player.id).emit("game:hand", {
              hand: room.game.hands[player.id],
            })
          }
        }

        const message = createGameMessage("info", "¡La partida comenzó!")
        gameNamespace.to(roomId).emit("game:message", message)
      }

      callback({ success: true })
    } catch (error) {
      callback({ success: false, error: (error as Error).message })
    }
  })

  socket.on("play:card", ({ roomId, cardId }, callback) => {
    try {
      const room = roomManager.playCard(roomId, socket.id, cardId)

      if (room.game) {
        const gameState = sanitizeGameStateForClient(room.game)
        gameNamespace.to(roomId).emit("game:update", { gameState })

        const player = room.players.find((p) => p.id === socket.id)
        const playedCard = room.game.table.plays.find((p) => p.playerId === socket.id)?.card

        if (player && playedCard) {
          const message = createGameMessage("action", `${player.name} jugó ${playedCard.rank} de ${playedCard.suit}`)
          gameNamespace.to(roomId).emit("game:message", message)
        }

        // Check for trick winner
        if (room.game.table.winnerId) {
          const winner = room.players.find((p) => p.id === room.game!.table.winnerId)
          if (winner) {
            const message = createGameMessage("info", `${winner.name} ganó la baza`)
            gameNamespace.to(roomId).emit("game:message", message)
          }
        }

        // Check for game winner
        if (room.game.winnerId) {
          const winner = room.players.find((p) => p.id === room.game!.winnerId)
          if (winner) {
            gameNamespace.to(roomId).emit("game:ended", {
              winnerId: room.game.winnerId,
              scores: room.game.scores,
            })

            const message = createGameMessage("winner", `¡${winner.name} ganó la partida!`)
            gameNamespace.to(roomId).emit("game:message", message)
          }
        }
      }

      callback({ success: true })
    } catch (error) {
      callback({ success: false, error: (error as Error).message })
    }
  })

  socket.on("call:truco", ({ roomId }, callback) => {
    try {
      const room = roomManager.callTruco(roomId, socket.id)

      if (room.game) {
        const gameState = sanitizeGameStateForClient(room.game)
        gameNamespace.to(roomId).emit("game:update", { gameState })

        const player = room.players.find((p) => p.id === socket.id)
        const callNames = ["", "Truco", "ReTruco", "Vale 3", "Vale 4"]
        const callName = callNames[room.game.call?.level || 0]

        if (player) {
          const message = createGameMessage("truco", `${player.name} cantó ${callName}`)
          gameNamespace.to(roomId).emit("game:message", message)
        }
      }

      callback({ success: true })
    } catch (error) {
      callback({ success: false, error: (error as Error).message })
    }
  })

  socket.on("call:envido", ({ roomId, type }, callback) => {
    try {
      const room = roomManager.callEnvido(roomId, socket.id, type)

      if (room.game) {
        const gameState = sanitizeGameStateForClient(room.game)
        gameNamespace.to(roomId).emit("game:update", { gameState })

        const player = room.players.find((p) => p.id === socket.id)
        const callNames = { envido: "Envido", real_envido: "Real Envido", falta_envido: "Falta Envido" }
        const callName = callNames[type]

        if (player) {
          const message = createGameMessage("envido", `${player.name} cantó ${callName}`)
          gameNamespace.to(roomId).emit("game:message", message)
        }
      }

      callback({ success: true })
    } catch (error) {
      callback({ success: false, error: (error as Error).message })
    }
  })

  socket.on("call:flor", ({ roomId }, callback) => {
    try {
      const room = roomManager.callFlor(roomId, socket.id)

      if (room.game) {
        const gameState = sanitizeGameStateForClient(room.game)
        gameNamespace.to(roomId).emit("game:update", { gameState })

        const player = room.players.find((p) => p.id === socket.id)
        if (player) {
          const message = createGameMessage("flor", `${player.name} cantó Flor`)
          gameNamespace.to(roomId).emit("game:message", message)
        }
      }

      callback({ success: true })
    } catch (error) {
      callback({ success: false, error: (error as Error).message })
    }
  })

  socket.on("phase:skip", ({ roomId }, callback) => {
    try {
      const room = roomManager.skipPhase(roomId)

      if (room.game) {
        const gameState = sanitizeGameStateForClient(room.game)
        gameNamespace.to(roomId).emit("game:update", { gameState })
      }

      callback({ success: true })
    } catch (error) {
      callback({ success: false, error: (error as Error).message })
    }
  })

  socket.on("call:response", ({ roomId, accept }, callback) => {
    try {
      const room = roomManager.respondToCall(roomId, socket.id, accept)

      if (room.game) {
        const gameState = sanitizeGameStateForClient(room.game)
        gameNamespace.to(roomId).emit("game:update", { gameState })

        const player = room.players.find((p) => p.id === socket.id)
        if (player) {
          const response = accept ? "Quiero" : "No quiero"
          const callType = room.game.call?.type || "truco"
          const messageType = callType === "truco" ? "truco" : callType === "flor" ? "flor" : "envido"
          const message = createGameMessage(messageType, `${player.name}: ${response}`)
          gameNamespace.to(roomId).emit("game:message", message)
        }

        // Check for game winner after rejection
        if (room.game.winnerId) {
          const winner = room.players.find((p) => p.id === room.game!.winnerId)
          if (winner) {
            gameNamespace.to(roomId).emit("game:ended", {
              winnerId: room.game.winnerId,
              scores: room.game.scores,
            })

            const message = createGameMessage("winner", `¡${winner.name} ganó la partida!`)
            gameNamespace.to(roomId).emit("game:message", message)
          }
        }
      }

      callback({ success: true })
    } catch (error) {
      callback({ success: false, error: (error as Error).message })
    }
  })

  socket.on("player:leave", ({ roomId }) => {
    const room = roomManager.leaveRoom(socket.id)
    if (room) {
      socket.leave(roomId)
      const sanitizedRoom = sanitizeRoomForClient(room)
      gameNamespace.to(roomId).emit("room:update", { room: sanitizedRoom })
    }
  })

  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`)
    const room = roomManager.leaveRoom(socket.id)
    if (room) {
      const sanitizedRoom = sanitizeRoomForClient(room)
      gameNamespace.to(room.id).emit("room:update", { room: sanitizedRoom })
    }
  })
})

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

app.get("/api/rooms", (req, res) => {
  const waitingRooms = roomManager.getWaitingRooms()
  res.json({ rooms: waitingRooms })
})

// Cleanup task
setInterval(() => {
  roomManager.cleanup()
}, 60000) // Run every minute

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
  console.log(`Truco server running on port ${PORT}`)
  console.log(`Socket.IO namespace: /game`)
})
