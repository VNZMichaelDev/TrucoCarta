"use client"

import { useState } from "react"
import { StartScreen } from "@/components/truco/start-screen"
import { LobbyScreen } from "@/components/truco/lobby-screen"
import { GameScreen } from "@/components/truco/game-screen"
import type { GameConfig } from "@/types/truco"

type Screen = "start" | "lobby" | "game"

export default function TrucoGame() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("start")
  const [playerName, setPlayerName] = useState("")
  const [roomId, setRoomId] = useState("")
  const [gameConfig, setGameConfig] = useState<GameConfig>({ maxPoints: 15, withFlor: true })

  const handleStartGame = (name: string, config: GameConfig) => {
    setPlayerName(name)
    setGameConfig(config)
    setCurrentScreen("lobby")
  }

  const handleJoinRoom = (id: string) => {
    setRoomId(id)
    setCurrentScreen("game")
  }

  const handleBackToLobby = () => {
    setCurrentScreen("lobby")
  }

  return (
    <main className="min-h-screen bg-background">
      {currentScreen === "start" && <StartScreen onStart={handleStartGame} />}
      {currentScreen === "lobby" && (
        <LobbyScreen
          playerName={playerName}
          gameConfig={gameConfig}
          onJoinRoom={handleJoinRoom}
          onBack={() => setCurrentScreen("start")}
        />
      )}
      {currentScreen === "game" && <GameScreen playerName={playerName} roomId={roomId} onBack={handleBackToLobby} />}
    </main>
  )
}
