"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Wifi, WifiOff, Settings, Flower } from "lucide-react"
import { socketManager } from "@/lib/socket"
import type { Card as TrucoCard, GameState } from "@/types/truco"
import { GameTable } from "./game-table"
import { PlayerHand } from "./player-hand"
import { GameControls } from "./game-controls"
import { GameMessages } from "./game-messages"
import { useToast } from "@/hooks/use-toast"

interface GameScreenProps {
  playerName: string
  roomId: string
  onBack: () => void
}

interface GameMessage {
  type: "info" | "action" | "truco" | "envido" | "flor" | "winner"
  text: string
  timestamp: Date
}

interface Room {
  id: string
  players: Array<{ id: string; name: string; connected: boolean }>
  status: "waiting" | "playing" | "ended"
  playerCount: number
}

export function GameScreen({ playerName, roomId, onBack }: GameScreenProps) {
  const [room, setRoom] = useState<Room | null>(null)
  const [gameState, setGameState] = useState<Partial<GameState>>({})
  const [playerHand, setPlayerHand] = useState<TrucoCard[]>([])
  const [messages, setMessages] = useState<GameMessage[]>([])
  const [connected, setConnected] = useState(false)
  const [currentPlayerId, setCurrentPlayerId] = useState<string>("")
  const [reconnecting, setReconnecting] = useState(false)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5
  const { toast } = useToast()

  const attemptReconnect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      toast({
        title: "Error de conexión",
        description: "No se pudo reconectar al servidor. Intenta recargar la página.",
        variant: "destructive",
      })
      return
    }

    setReconnecting(true)
    reconnectAttempts.current++

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000)
    setTimeout(() => {
      const socket = socketManager.connect()
      if (socket) {
        socket.emit("player:join", { roomId, name: playerName }, (response) => {
          if (response.success) {
            setRoom(response.room)
            setReconnecting(false)
            reconnectAttempts.current = 0
            toast({
              title: "Reconectado",
              description: "Te has reconectado exitosamente al juego.",
            })
          }
        })
      }
    }, delay)
  }, [roomId, playerName, toast])

  useEffect(() => {
    const socket = socketManager.connect()
    setCurrentPlayerId(socket.id || "")

    socket.on("connect", () => {
      setConnected(true)
      setReconnecting(false)
      reconnectAttempts.current = 0

      socket.emit("player:join", { roomId, name: playerName }, (response) => {
        if (response.success) {
          setRoom(response.room)
          if (response.gameState) {
            setGameState(response.gameState)
          }
          if (response.hand) {
            setPlayerHand(response.hand)
          }
        } else {
          toast({
            title: "Error",
            description: response.error || "No se pudo unir a la sala",
            variant: "destructive",
          })
        }
      })
    })

    socket.on("disconnect", (reason) => {
      setConnected(false)
      if (reason === "io server disconnect") {
        // Server disconnected, try to reconnect
        attemptReconnect()
      }
    })

    socket.on("room:update", ({ room: updatedRoom }) => {
      setRoom(updatedRoom)
      if (updatedRoom.players.some((p) => !p.connected)) {
        const disconnectedPlayer = updatedRoom.players.find((p) => !p.connected)
        if (disconnectedPlayer) {
          setMessages((prev) => [
            ...prev,
            {
              type: "info",
              text: `${disconnectedPlayer.name} se desconectó`,
              timestamp: new Date(),
            },
          ])
        }
      }
    })

    socket.on("game:update", ({ gameState: updatedGameState }) => {
      setGameState((prev) => ({ ...prev, ...updatedGameState }))
      setActionInProgress(null) // Clear any pending actions
    })

    socket.on("game:hand", ({ hand }) => {
      setPlayerHand(hand)
    })

    socket.on("game:message", (message) => {
      setMessages((prev) => [...prev, { ...message, timestamp: new Date(message.timestamp) }])
    })

    socket.on("game:ended", ({ winnerId, scores }) => {
      const winner = room?.players.find((p) => p.id === winnerId)
      if (winner) {
        setMessages((prev) => [
          ...prev,
          {
            type: "winner",
            text: `¡Partida terminada! ${winner.name} ganó con ${scores[winnerId]} puntos`,
            timestamp: new Date(),
          },
        ])
        toast({
          title: "Partida terminada",
          description: `${winner.name} ganó la partida`,
        })
      }
      setActionInProgress(null)
    })

    socket.on("error", ({ message }) => {
      console.error("Socket error:", message)
      setMessages((prev) => [
        ...prev,
        {
          type: "info",
          text: `Error: ${message}`,
          timestamp: new Date(),
        },
      ])
      setActionInProgress(null)
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    })

    return () => {
      socket.off("connect")
      socket.off("disconnect")
      socket.off("room:update")
      socket.off("game:update")
      socket.off("game:hand")
      socket.off("game:message")
      socket.off("game:ended")
      socket.off("error")
    }
  }, [roomId, playerName, attemptReconnect, toast, room?.players])

  const handleStartGame = useCallback(() => {
    const socket = socketManager.getSocket()
    if (socket && !actionInProgress) {
      setActionInProgress("starting")
      socket.emit("game:start", { roomId }, (response) => {
        if (!response.success) {
          toast({
            title: "Error",
            description: response.error || "No se pudo iniciar la partida",
            variant: "destructive",
          })
        }
        setActionInProgress(null)
      })
    }
  }, [roomId, actionInProgress, toast])

  const handlePlayCard = useCallback(
    (cardId: string) => {
      const socket = socketManager.getSocket()
      if (socket && !actionInProgress && gameState.turnPlayerId === currentPlayerId) {
        setActionInProgress("playing-card")
        socket.emit("play:card", { roomId, cardId }, (response) => {
          if (!response.success) {
            toast({
              title: "Error",
              description: response.error || "No se pudo jugar la carta",
              variant: "destructive",
            })
          }
          setActionInProgress(null)
        })
      }
    },
    [roomId, actionInProgress, gameState.turnPlayerId, currentPlayerId, toast],
  )

  const handleCallTruco = useCallback(() => {
    const socket = socketManager.getSocket()
    if (socket && !actionInProgress) {
      setActionInProgress("calling-truco")
      socket.emit("call:truco", { roomId }, (response) => {
        if (!response.success) {
          toast({
            title: "Error",
            description: response.error || "No se pudo cantar truco",
            variant: "destructive",
          })
        }
        setActionInProgress(null)
      })
    }
  }, [roomId, actionInProgress, toast])

  const handleCallEnvido = useCallback(
    (type: "envido" | "real_envido" | "falta_envido") => {
      const socket = socketManager.getSocket()
      if (socket && !actionInProgress) {
        setActionInProgress(`calling-${type}`)
        socket.emit("call:envido", { roomId, type }, (response) => {
          if (!response.success) {
            toast({
              title: "Error",
              description: response.error || "No se pudo cantar envido",
              variant: "destructive",
            })
          }
          setActionInProgress(null)
        })
      }
    },
    [roomId, actionInProgress, toast],
  )

  const handleCallFlor = useCallback(() => {
    const socket = socketManager.getSocket()
    if (socket && !actionInProgress) {
      setActionInProgress("calling-flor")
      socket.emit("call:flor", { roomId }, (response) => {
        if (!response.success) {
          toast({
            title: "Error",
            description: response.error || "No se pudo cantar flor",
            variant: "destructive",
          })
        }
        setActionInProgress(null)
      })
    }
  }, [roomId, actionInProgress, toast])

  const handleSkipPhase = useCallback(() => {
    const socket = socketManager.getSocket()
    if (socket && !actionInProgress) {
      setActionInProgress("skipping-phase")
      socket.emit("phase:skip", { roomId }, (response) => {
        if (!response.success) {
          toast({
            title: "Error",
            description: response.error || "No se pudo pasar la fase",
            variant: "destructive",
          })
        }
        setActionInProgress(null)
      })
    }
  }, [roomId, actionInProgress, toast])

  const handleAcceptCall = useCallback(() => {
    const socket = socketManager.getSocket()
    if (socket && !actionInProgress) {
      setActionInProgress("accepting-call")
      socket.emit("call:response", { roomId, accept: true }, (response) => {
        if (!response.success) {
          toast({
            title: "Error",
            description: response.error || "No se pudo aceptar la jugada",
            variant: "destructive",
          })
        }
        setActionInProgress(null)
      })
    }
  }, [roomId, actionInProgress, toast])

  const handleRejectCall = useCallback(() => {
    const socket = socketManager.getSocket()
    if (socket && !actionInProgress) {
      setActionInProgress("rejecting-call")
      socket.emit("call:response", { roomId, accept: false }, (response) => {
        if (!response.success) {
          toast({
            title: "Error",
            description: response.error || "No se pudo rechazar la jugada",
            variant: "destructive",
          })
        }
        setActionInProgress(null)
      })
    }
  }, [roomId, actionInProgress, toast])

  const playerNames =
    room?.players.reduce(
      (acc, player) => {
        acc[player.id] = player.name
        return acc
      },
      {} as { [key: string]: string },
    ) || {}

  const isMyTurn = gameState.turnPlayerId === currentPlayerId
  const canStartGame = room?.status === "waiting" && room?.playerCount === 2
  const gameInProgress = room?.status === "playing"

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-primary">Sala: {roomId}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Jugador: {playerName}</span>
              <div className="flex items-center gap-1">
                {connected ? <Wifi className="h-3 w-3 text-green-600" /> : <WifiOff className="h-3 w-3 text-red-600" />}
                <span className={connected ? "text-green-600" : "text-red-600"}>
                  {reconnecting ? "Reconectando..." : connected ? "Conectado" : "Desconectado"}
                </span>
              </div>
              {room && <span>Jugadores: {room.playerCount}/2</span>}
              {gameState.config && (
                <div className="flex items-center gap-1">
                  <Settings className="h-3 w-3" />
                  <span>{gameState.config.maxPoints}pts</span>
                  {gameState.config.withFlor && <Flower className="h-3 w-3" />}
                </div>
              )}
              {gameInProgress && isMyTurn && <span className="text-amber-600 font-medium">Tu turno</span>}
            </div>
          </div>
        </div>

        {room?.status === "waiting" ? (
          /* Waiting Room */
          <div className="flex items-center justify-center min-h-96">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-center">Esperando Jugadores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {room.players.map((player) => (
                    <div key={player.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                      <span>{player.name}</span>
                      <div className="flex items-center gap-1">
                        {player.connected ? (
                          <Wifi className="h-3 w-3 text-green-600" />
                        ) : (
                          <WifiOff className="h-3 w-3 text-red-600" />
                        )}
                        <span className={player.connected ? "text-green-600" : "text-red-600"}>
                          {player.connected ? "Conectado" : "Desconectado"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {canStartGame && (
                  <Button onClick={handleStartGame} className="w-full" disabled={actionInProgress === "starting"}>
                    {actionInProgress === "starting" ? "Iniciando..." : "Comenzar Partida"}
                  </Button>
                )}
                {!canStartGame && room.playerCount < 2 && (
                  <p className="text-center text-muted-foreground">Esperando que se una otro jugador...</p>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Game Interface */
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Main Game Area */}
            <div className="lg:col-span-3 space-y-6">
              {/* Game Table */}
              <GameTable
                gameState={gameState}
                playerNames={playerNames}
                currentPlayerId={currentPlayerId}
                actionInProgress={actionInProgress}
              />

              {/* Player Hand */}
              {playerHand.length > 0 && (
                <PlayerHand
                  cards={playerHand}
                  onCardPlay={handlePlayCard}
                  disabled={
                    !connected ||
                    room?.status !== "playing" ||
                    gameState.phase !== "playing" ||
                    !isMyTurn ||
                    !!actionInProgress
                  }
                  isMyTurn={isMyTurn && gameState.phase === "playing"}
                  actionInProgress={actionInProgress === "playing-card"}
                />
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Score Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Puntaje</span>
                    {gameState.config && (
                      <Badge variant="outline" className="text-xs">
                        Hasta {gameState.config.maxPoints}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {gameState.scores &&
                      Object.entries(gameState.scores).map(([playerId, score]) => (
                        <div key={playerId} className="flex justify-between">
                          <span className={playerId === currentPlayerId ? "font-medium" : ""}>
                            {playerNames[playerId] || "Jugador"}
                          </span>
                          <span className="font-bold">{score}</span>
                        </div>
                      ))}
                  </div>
                  {gameState.envidoPoints && Object.keys(gameState.envidoPoints).length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="text-sm font-medium mb-2">Puntos de Envido:</div>
                      <div className="space-y-1">
                        {Object.entries(gameState.envidoPoints).map(([playerId, points]) => (
                          <div key={playerId} className="flex justify-between text-sm">
                            <span className={playerId === currentPlayerId ? "font-medium" : ""}>
                              {playerNames[playerId] || "Jugador"}
                            </span>
                            <span className="text-blue-600 font-medium">{points}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Game Controls */}
              {gameInProgress && (
                <Card>
                  <CardContent className="pt-6">
                    <GameControls
                      gameState={gameState}
                      currentPlayerId={currentPlayerId}
                      onCallTruco={handleCallTruco}
                      onCallEnvido={handleCallEnvido}
                      onCallFlor={handleCallFlor}
                      onAcceptCall={handleAcceptCall}
                      onRejectCall={handleRejectCall}
                      onSkipPhase={handleSkipPhase}
                      disabled={!connected || !!actionInProgress}
                      actionInProgress={actionInProgress}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Game Messages */}
              <GameMessages messages={messages} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
