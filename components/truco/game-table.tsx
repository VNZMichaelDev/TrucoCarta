import type { Card, GameState } from "@/types/truco"
import { CardComponent } from "./card-component"
import { cn } from "@/lib/utils"
import { Clock, Trophy } from "lucide-react"

interface GameTableProps {
  gameState: Partial<GameState>
  playerNames: { [playerId: string]: string }
  currentPlayerId: string
  actionInProgress?: string | null
}

export function GameTable({ gameState, playerNames, currentPlayerId, actionInProgress }: GameTableProps) {
  const { table, turnPlayerId, roundNumber, wonTricks, call, accepted } = gameState

  const getPlayerPosition = (playerId: string) => {
    return playerId === currentPlayerId ? "bottom" : "top"
  }

  const renderPlayedCard = (play: { playerId: string; card: Card }, index: number) => {
    const position = getPlayerPosition(play.playerId)
    const playerName = playerNames[play.playerId] || "Jugador"
    const isCurrentPlayer = play.playerId === currentPlayerId
    const isWinner = table?.winnerId === play.playerId

    return (
      <div
        key={`${play.playerId}-${index}`}
        className={cn(
          "flex flex-col items-center gap-2 transition-all duration-300",
          position === "bottom" ? "order-2" : "order-1",
          isWinner && "scale-105",
        )}
      >
        <div
          className={cn(
            "text-sm font-medium flex items-center gap-1",
            isCurrentPlayer ? "text-primary" : "text-muted-foreground",
            isWinner && "text-amber-600",
          )}
        >
          {isWinner && <Trophy className="h-3 w-3" />}
          {playerName}
          {isCurrentPlayer && " (Tú)"}
        </div>
        <div className={cn("transition-all duration-300", isWinner && "ring-2 ring-amber-400 rounded-lg")}>
          <CardComponent card={play.card} size="lg" />
        </div>
      </div>
    )
  }

  const getCurrentTurnDisplay = () => {
    if (actionInProgress) {
      return (
        <div className="flex items-center gap-2 text-blue-600">
          <Clock className="h-4 w-4 animate-pulse" />
          <span>Procesando...</span>
        </div>
      )
    }

    if (turnPlayerId) {
      const isMyTurn = turnPlayerId === currentPlayerId
      return (
        <div className={cn("flex items-center gap-2", isMyTurn ? "text-green-600" : "text-muted-foreground")}>
          <Clock className="h-4 w-4" />
          <span>
            Turno: {playerNames[turnPlayerId] || "Jugador"}
            {isMyTurn && " (Tu turno)"}
          </span>
        </div>
      )
    }

    return null
  }

  return (
    <div className="relative flex flex-col items-center justify-center h-full min-h-96 bg-gradient-to-br from-green-100 to-green-200 rounded-lg p-8">
      {/* Round and Turn Info */}
      <div className="absolute top-4 left-4 space-y-1 text-sm">
        <div className="text-muted-foreground">Ronda: {roundNumber || 1}</div>
        {getCurrentTurnDisplay()}
      </div>

      {/* Truco Call Info */}
      {call && (
        <div
          className={cn(
            "absolute top-4 right-4 px-3 py-1 rounded-lg text-sm font-medium transition-colors",
            accepted
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-amber-100 text-amber-800 border border-amber-200 animate-pulse",
          )}
        >
          {call.level === 1 && "Truco"}
          {call.level === 2 && "ReTruco"}
          {call.level === 3 && "Vale 3"}
          {call.level === 4 && "Vale 4"}
          {!accepted && " (Esperando respuesta)"}
        </div>
      )}

      {/* Won Tricks Display */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex gap-4 text-sm">
        {wonTricks &&
          Object.entries(wonTricks).map(([playerId, tricks]) => (
            <div key={playerId} className="text-center">
              <div className={cn("text-xs", playerId === currentPlayerId ? "text-primary" : "text-muted-foreground")}>
                {playerNames[playerId]}
                {playerId === currentPlayerId && " (Tú)"}
              </div>
              <div className="font-bold text-primary flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                {tricks} bazas
              </div>
            </div>
          ))}
      </div>

      {/* Played Cards */}
      <div className="flex items-center justify-center gap-8">
        {table?.plays && table.plays.length > 0 ? (
          table.plays.map((play, index) => renderPlayedCard(play, index))
        ) : (
          <div className="text-muted-foreground text-lg text-center">
            {actionInProgress ? (
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 animate-pulse" />
                Procesando jugada...
              </div>
            ) : (
              "Esperando que se jueguen las cartas..."
            )}
          </div>
        )}
      </div>

      {/* Trick Winner Indicator */}
      {table?.winnerId && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium flex items-center gap-2 animate-in slide-in-from-bottom-2">
          <Trophy className="h-4 w-4" />
          {playerNames[table.winnerId]} ganó la baza
          {table.winnerId === currentPlayerId && " (¡Tú!)"}
        </div>
      )}

      {!table?.plays?.length && roundNumber && (
        <div className="absolute bottom-4 right-4 text-xs text-muted-foreground bg-white/50 px-2 py-1 rounded">
          Baza {table?.trickNumber || 1} de 3
        </div>
      )}
    </div>
  )
}
