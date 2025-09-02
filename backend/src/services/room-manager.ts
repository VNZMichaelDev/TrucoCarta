import type { Room, Player, GameConfig } from "../types"
import { TrucoEngine } from "../game/truco-engine"

export class RoomManager {
  private rooms = new Map<string, Room>()
  private playerRooms = new Map<string, string>() // playerId -> roomId
  private roomCodes = new Map<string, string>() // code -> roomId
  private quickMatchQueue = new Map<
    string,
    { playerId: string; playerName: string; config: GameConfig; timestamp: Date }
  >()

  generateRoomId(): string {
    let roomId: string
    do {
      roomId = Math.random().toString(36).substring(2, 8).toUpperCase()
    } while (this.rooms.has(roomId))
    return roomId
  }

  generateRoomCode(): string {
    let code: string
    do {
      // Generate a 6-character alphanumeric code
      code = Math.random().toString(36).substring(2, 8).toUpperCase()
    } while (this.roomCodes.has(code))
    return code
  }

  createRoom(playerId: string, playerName: string, config: GameConfig): Room {
    const roomId = this.generateRoomId()
    const roomCode = this.generateRoomCode()
    const player: Player = {
      id: playerId,
      name: playerName,
      connected: true,
      lastSeen: new Date(),
    }

    const room: Room = {
      id: roomId,
      code: roomCode,
      players: [player],
      status: "waiting",
      game: null,
      createdAt: new Date(),
      lastActivity: new Date(),
      config,
    }

    this.rooms.set(roomId, room)
    this.roomCodes.set(roomCode, roomId)
    this.playerRooms.set(playerId, roomId)

    return room
  }

  joinRoomByCode(code: string, playerId: string, playerName: string): Room {
    const roomId = this.roomCodes.get(code.toUpperCase())
    if (!roomId) {
      throw new Error("Room code not found")
    }
    return this.joinRoom(roomId, playerId, playerName)
  }

  joinRoom(roomId: string, playerId: string, playerName: string): Room {
    const room = this.rooms.get(roomId)
    if (!room) {
      throw new Error("Room not found")
    }

    if (room.players.length >= 2) {
      throw new Error("Room is full")
    }

    // Check if player is already in room (reconnection)
    const existingPlayer = room.players.find((p) => p.id === playerId)
    if (existingPlayer) {
      existingPlayer.connected = true
      existingPlayer.lastSeen = new Date()
    } else {
      const newPlayer: Player = {
        id: playerId,
        name: playerName,
        connected: true,
        lastSeen: new Date(),
      }
      room.players.push(newPlayer)
    }

    room.lastActivity = new Date()
    this.playerRooms.set(playerId, roomId)

    return room
  }

  findQuickMatch(playerId: string, playerName: string, config: GameConfig): Room | null {
    // Look for existing player in queue with same config
    for (const [queuedPlayerId, queuedPlayer] of this.quickMatchQueue.entries()) {
      if (
        queuedPlayer.config.maxPoints === config.maxPoints &&
        queuedPlayer.config.withFlor === config.withFlor &&
        queuedPlayerId !== playerId
      ) {
        // Found a match! Create room with both players
        const room = this.createRoom(queuedPlayer.playerId, queuedPlayer.playerName, config)
        this.joinRoom(room.id, playerId, playerName)

        // Remove from queue
        this.quickMatchQueue.delete(queuedPlayerId)

        return room
      }
    }

    // No match found, add to queue
    this.quickMatchQueue.set(playerId, {
      playerId,
      playerName,
      config,
      timestamp: new Date(),
    })

    return null
  }

  removeFromQuickMatchQueue(playerId: string): void {
    this.quickMatchQueue.delete(playerId)
  }

  leaveRoom(playerId: string): Room | null {
    const roomId = this.playerRooms.get(playerId)
    if (!roomId) return null

    const room = this.rooms.get(roomId)
    if (!room) return null

    const player = room.players.find((p) => p.id === playerId)
    if (player) {
      player.connected = false
      player.lastSeen = new Date()
    }

    room.lastActivity = new Date()

    // Remove from quick match queue if they were waiting
    this.removeFromQuickMatchQueue(playerId)

    // If all players disconnected and room is waiting, clean it up
    if (room.status === "waiting" && room.players.every((p) => !p.connected)) {
      this.rooms.delete(roomId)
      if (room.code) {
        this.roomCodes.delete(room.code)
      }
      room.players.forEach((p) => this.playerRooms.delete(p.id))
      return null
    }

    return room
  }

  getRoom(roomId: string): Room | null {
    return this.rooms.get(roomId) || null
  }

  getPlayerRoom(playerId: string): Room | null {
    const roomId = this.playerRooms.get(playerId)
    return roomId ? this.getRoom(roomId) : null
  }

  startGame(roomId: string): Room {
    const room = this.rooms.get(roomId)
    if (!room) {
      throw new Error("Room not found")
    }

    if (room.players.length !== 2) {
      throw new Error("Need exactly 2 players to start")
    }

    if (room.status !== "waiting") {
      throw new Error("Game already started")
    }

    const playerIds = room.players.map((p) => p.id)
    room.game = TrucoEngine.initializeGame(playerIds, room.config)
    room.status = "playing"
    room.lastActivity = new Date()

    return room
  }

  playCard(roomId: string, playerId: string, cardId: string): Room {
    const room = this.rooms.get(roomId)
    if (!room || !room.game) {
      throw new Error("Game not found")
    }

    room.game = TrucoEngine.playCard(room.game, playerId, cardId)
    room.lastActivity = new Date()

    if (room.game.winnerId) {
      room.status = "ended"
    }

    return room
  }

  callTruco(roomId: string, playerId: string): Room {
    const room = this.rooms.get(roomId)
    if (!room || !room.game) {
      throw new Error("Game not found")
    }

    room.game = TrucoEngine.callTruco(room.game, playerId)
    room.lastActivity = new Date()

    return room
  }

  callEnvido(roomId: string, playerId: string, type: "envido" | "real_envido" | "falta_envido"): Room {
    const room = this.rooms.get(roomId)
    if (!room || !room.game) {
      throw new Error("Game not found")
    }

    room.game = TrucoEngine.callEnvido(room.game, playerId, type)
    room.lastActivity = new Date()

    return room
  }

  callFlor(roomId: string, playerId: string): Room {
    const room = this.rooms.get(roomId)
    if (!room || !room.game) {
      throw new Error("Game not found")
    }

    room.game = TrucoEngine.callFlor(room.game, playerId)
    room.lastActivity = new Date()

    return room
  }

  skipPhase(roomId: string): Room {
    const room = this.rooms.get(roomId)
    if (!room || !room.game) {
      throw new Error("Game not found")
    }

    room.game = TrucoEngine.skipPhase(room.game)
    room.lastActivity = new Date()

    return room
  }

  respondToCall(roomId: string, playerId: string, accept: boolean): Room {
    const room = this.rooms.get(roomId)
    if (!room || !room.game) {
      throw new Error("Game not found")
    }

    room.game = TrucoEngine.respondToCall(room.game, playerId, accept)
    room.lastActivity = new Date()

    if (room.game.winnerId) {
      room.status = "ended"
    }

    return room
  }

  cleanup(): void {
    const now = new Date()
    const CLEANUP_TIMEOUT = 5 * 60 * 1000 // 5 minutes
    const QUEUE_TIMEOUT = 2 * 60 * 1000 // 2 minutes for quick match queue

    // Clean up rooms
    for (const [roomId, room] of this.rooms.entries()) {
      const timeSinceActivity = now.getTime() - room.lastActivity.getTime()

      if (timeSinceActivity > CLEANUP_TIMEOUT) {
        // Clean up old ended games or abandoned waiting rooms
        if (room.status === "ended" || (room.status === "waiting" && room.players.every((p) => !p.connected))) {
          this.rooms.delete(roomId)
          if (room.code) {
            this.roomCodes.delete(room.code)
          }
          room.players.forEach((p) => this.playerRooms.delete(p.id))
        }
      }
    }

    // Clean up old quick match queue entries
    for (const [playerId, queueEntry] of this.quickMatchQueue.entries()) {
      const timeSinceQueued = now.getTime() - queueEntry.timestamp.getTime()
      if (timeSinceQueued > QUEUE_TIMEOUT) {
        this.quickMatchQueue.delete(playerId)
      }
    }
  }

  getWaitingRooms(): Array<{ id: string; code?: string; playerCount: number; createdAt: Date; config: GameConfig }> {
    return Array.from(this.rooms.values())
      .filter((room) => room.status === "waiting" && room.players.some((p) => p.connected))
      .map((room) => ({
        id: room.id,
        code: room.code,
        playerCount: room.players.filter((p) => p.connected).length,
        createdAt: room.createdAt,
        config: room.config,
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 20) // Return max 20 rooms
  }
}
