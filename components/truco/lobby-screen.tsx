"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Copy, Users, RefreshCw, Clock, Settings } from "lucide-react"
import { socketManager } from "@/lib/socket"
import type { GameConfig } from "@/types/truco"

interface LobbyScreenProps {
  playerName: string
  gameConfig: GameConfig
  onJoinRoom: (roomId: string) => void
  onBack: () => void
}

interface WaitingRoom {
  id: string
  code?: string
  playerCount: number
  createdAt: Date
  config: GameConfig
}

export function LobbyScreen({ playerName, gameConfig, onJoinRoom, onBack }: LobbyScreenProps) {
  const [joinRoomId, setJoinRoomId] = useState("")
  const [createdRoomId, setCreatedRoomId] = useState("")
  const [createdRoomCode, setCreatedRoomCode] = useState("")
  const [waitingRooms, setWaitingRooms] = useState<WaitingRoom[]>([])
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [quickMatchLoading, setQuickMatchLoading] = useState(false)

  useEffect(() => {
    const socket = socketManager.connect()

    socket.on("connect", () => {
      setConnected(true)
      fetchWaitingRooms()
    })

    socket.on("disconnect", () => {
      setConnected(false)
    })

    socket.on("room:update", () => {
      // Refresh room list when rooms are updated
      fetchWaitingRooms()
    })

    socket.on("rooms:list", (data) => {
      setWaitingRooms(data.rooms || [])
    })

    socket.on("match:found", (data) => {
      setQuickMatchLoading(false)
      onJoinRoom(data.roomId)
    })

    // Fetch rooms periodically
    const interval = setInterval(fetchWaitingRooms, 10000) // Every 10 seconds

    return () => {
      clearInterval(interval)
      socket.off("connect")
      socket.off("disconnect")
      socket.off("room:update")
      socket.off("rooms:list")
      socket.off("match:found")
    }
  }, [onJoinRoom])

  const fetchWaitingRooms = () => {
    const socket = socketManager.getSocket()
    if (socket && connected) {
      socket.emit("rooms:list", (response: any) => {
        if (response.success) {
          setWaitingRooms(response.rooms || [])
        }
      })
    }
  }

  const handleCreateRoom = () => {
    const socket = socketManager.getSocket()
    if (!socket) return

    setLoading(true)
    socket.emit("room:create", { name: playerName, config: gameConfig }, (response) => {
      setLoading(false)
      if (response.success) {
        setCreatedRoomId(response.roomId)
        setCreatedRoomCode(response.code || "")
        fetchWaitingRooms() // Refresh the list
      } else {
        console.error("Failed to create room:", response.error)
      }
    })
  }

  const handleQuickMatch = () => {
    const socket = socketManager.getSocket()
    if (!socket) return

    setQuickMatchLoading(true)
    socket.emit("match:quick", { config: gameConfig }, (response) => {
      if (response.success) {
        if (response.roomId) {
          // Found immediate match
          setQuickMatchLoading(false)
          onJoinRoom(response.roomId)
        }
        // Otherwise, waiting for match (handled by socket event)
      } else {
        setQuickMatchLoading(false)
        console.error("Failed to find quick match:", response.error)
      }
    })
  }

  const handleJoinRoom = (roomId?: string) => {
    const targetRoomId = roomId || joinRoomId.trim()
    if (targetRoomId) {
      onJoinRoom(targetRoomId)
    }
  }

  const handleJoinByCode = () => {
    const socket = socketManager.getSocket()
    if (!socket || !joinRoomId.trim()) return

    socket.emit("room:join_code", { code: joinRoomId.trim().toUpperCase(), name: playerName }, (response) => {
      if (response.success) {
        onJoinRoom(response.roomId)
      } else {
        console.error("Failed to join room by code:", response.error)
      }
    })
  }

  const handleJoinCreatedRoom = () => {
    if (createdRoomId) {
      onJoinRoom(createdRoomId)
    }
  }

  const copyRoomCode = () => {
    navigator.clipboard.writeText(createdRoomCode || createdRoomId)
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - new Date(date).getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return "Ahora"
    if (diffMins < 60) return `${diffMins}m`
    const diffHours = Math.floor(diffMins / 60)
    return `${diffHours}h`
  }

  const getConfigBadge = (config: GameConfig) => {
    return `${config.maxPoints}pts${config.withFlor ? " +Flor" : ""}`
  }

  // Filter rooms that match current player's configuration
  const compatibleRooms = waitingRooms.filter(
    (room) => room.config.maxPoints === gameConfig.maxPoints && room.config.withFlor === gameConfig.withFlor,
  )

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-primary">Bienvenido, {playerName}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Elegí cómo querés jugar</span>
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <Badge variant="outline">{getConfigBadge(gameConfig)}</Badge>
              </div>
              <span className={connected ? "text-green-600" : "text-red-600"}>
                {connected ? "Conectado" : "Desconectado"}
              </span>
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={fetchWaitingRooms} disabled={!connected}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Quick Match */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-center">
                <Users className="h-5 w-5" />
                Emparejamiento Rápido
              </CardTitle>
              <CardDescription className="text-center">
                Te conectamos automáticamente con un oponente que tenga tu misma configuración
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleQuickMatch}
                className="w-full"
                disabled={!connected || quickMatchLoading}
                size="lg"
              >
                {quickMatchLoading ? "Buscando oponente..." : "Buscar Partida Rápida"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Create Room */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Crear Sala
              </CardTitle>
              <CardDescription>Creá una nueva sala y invitá a un amigo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!createdRoomId ? (
                <Button onClick={handleCreateRoom} className="w-full" disabled={!connected || loading}>
                  {loading ? "Creando..." : "Crear Nueva Sala"}
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Código de Acceso:</p>
                    <div className="flex items-center gap-2">
                      <code className="text-lg font-mono font-bold text-primary">
                        {createdRoomCode || createdRoomId}
                      </code>
                      <Button size="sm" variant="outline" onClick={copyRoomCode}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-2 bg-muted/50 rounded text-xs">
                    <div className="flex items-center gap-2">
                      <Settings className="h-3 w-3" />
                      <span>{getConfigBadge(gameConfig)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Compartí este código con tu oponente</p>
                  <Button onClick={handleJoinCreatedRoom} className="w-full">
                    Entrar a la Sala
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Join Room */}
          <Card>
            <CardHeader>
              <CardTitle>Unirse con Código</CardTitle>
              <CardDescription>Ingresá el código de una sala existente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="roomId" className="block text-sm font-medium mb-2">
                  Código de Sala
                </label>
                <Input
                  id="roomId"
                  type="text"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                  placeholder="Ej: ABC123"
                  className="w-full font-mono"
                  maxLength={6}
                />
              </div>
              <Button onClick={handleJoinByCode} className="w-full" disabled={!joinRoomId.trim() || !connected}>
                Unirse a la Sala
              </Button>
            </CardContent>
          </Card>

          {/* Compatible Rooms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Salas Compatibles</span>
                <Badge variant="secondary">{compatibleRooms.length}</Badge>
              </CardTitle>
              <CardDescription>Salas con tu misma configuración</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {compatibleRooms.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    {connected ? "No hay salas compatibles" : "Conectando..."}
                  </div>
                ) : (
                  compatibleRooms.map((room) => (
                    <div
                      key={room.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <code className="font-mono font-bold text-sm">{room.code || room.id}</code>
                          <Badge variant="outline" className="text-xs">
                            {room.playerCount}/2
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatTimeAgo(room.createdAt)}</span>
                          <Settings className="h-3 w-3" />
                          <span>{getConfigBadge(room.config)}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleJoinRoom(room.id)}
                        disabled={!connected || room.playerCount >= 2}
                      >
                        {room.playerCount >= 2 ? "Llena" : "Unirse"}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {/* Room Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estadísticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{compatibleRooms.length}</div>
                  <div className="text-sm text-muted-foreground">Salas Compatibles</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-secondary">{waitingRooms.length}</div>
                  <div className="text-sm text-muted-foreground">Total Salas</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent">
                    {waitingRooms.reduce((acc, room) => acc + room.playerCount, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Jugadores Online</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Tu Configuración
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Puntos para ganar:</span>
                  <Badge variant="outline">{gameConfig.maxPoints} puntos</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Flor:</span>
                  <Badge variant={gameConfig.withFlor ? "default" : "secondary"}>
                    {gameConfig.withFlor ? "Habilitada" : "Deshabilitada"}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  Solo podés unirte a salas con la misma configuración
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
