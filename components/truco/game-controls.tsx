"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Flower, Coins, Zap, Settings } from "lucide-react"
import type { GameState } from "@/types/truco"

interface GameControlsProps {
  gameState: Partial<GameState>
  currentPlayerId: string
  onCallTruco: () => void
  onCallEnvido: (type: "envido" | "real_envido" | "falta_envido") => void
  onCallFlor: () => void
  onAcceptCall: () => void
  onRejectCall: () => void
  onSkipPhase: () => void
  disabled?: boolean
  actionInProgress?: string | null
}

export function GameControls({
  gameState,
  currentPlayerId,
  onCallTruco,
  onCallEnvido,
  onCallFlor,
  onAcceptCall,
  onRejectCall,
  onSkipPhase,
  disabled = false,
  actionInProgress,
}: GameControlsProps) {
  const { call, accepted, turnPlayerId, phase, config, florCalled, envidoCalled } = gameState

  const canCallTruco = () => {
    if (call?.type !== "truco" && call) return false
    const currentLevel = call?.type === "truco" ? call.level : 0
    if (currentLevel >= 4) return false
    return !call || call.by !== currentPlayerId
  }

  const canCallEnvido = () => {
    return phase === "envido" && !envidoCalled && !call
  }

  const canCallFlor = () => {
    return phase === "flor" && config?.withFlor && !florCalled && !call
    // Note: We should also check if player has Flor, but that requires hand data
  }

  const canSkipPhase = () => {
    return (phase === "flor" && !florCalled) || (phase === "envido" && !envidoCalled) || (phase === "truco" && !call)
  }

  const needsResponse = () => {
    return call && !accepted && call.by !== currentPlayerId
  }

  const getTrucoButtonText = () => {
    const currentLevel = call?.type === "truco" ? call.level : 0
    if (currentLevel === 0) return "Truco"
    if (currentLevel === 1) return "ReTruco"
    if (currentLevel === 2) return "Vale 3"
    if (currentLevel === 3) return "Vale 4"
    return "Truco"
  }

  const getCallDescription = () => {
    if (!call) return ""

    if (call.type === "truco") {
      if (call.level === 1) return "Truco (2 puntos)"
      if (call.level === 2) return "ReTruco (3 puntos)"
      if (call.level === 3) return "Vale 3 (4 puntos)"
      if (call.level === 4) return "Vale 4 (5 puntos)"
    } else if (call.type === "envido") {
      return "Envido (2 puntos)"
    } else if (call.type === "real_envido") {
      return "Real Envido (3 puntos)"
    } else if (call.type === "falta_envido") {
      return "Falta Envido (puntos faltantes)"
    } else if (call.type === "flor") {
      return "Flor (3 puntos)"
    }

    return ""
  }

  const getPhaseDescription = () => {
    switch (phase) {
      case "flor":
        return config?.withFlor ? "Fase de Flor" : ""
      case "envido":
        return "Fase de Envido"
      case "truco":
        return "Fase de Truco"
      case "playing":
        return "Jugando cartas"
      default:
        return ""
    }
  }

  const getButtonContent = (action: string, text: string) => {
    const isLoading = actionInProgress === action
    return (
      <>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isLoading ? "Procesando..." : text}
      </>
    )
  }

  const isMyTurn = turnPlayerId === currentPlayerId || needsResponse() || canSkipPhase()
  const canInteract = !disabled && !actionInProgress

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {getPhaseDescription()}
          </Badge>
          {config && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Settings className="h-3 w-3" />
              <span>{config.maxPoints}pts</span>
              {config.withFlor && <Flower className="h-3 w-3" />}
            </div>
          )}
        </div>
      </div>

      {!isMyTurn && !needsResponse() && !canSkipPhase() && (
        <div className="text-xs text-center text-amber-600 bg-amber-50 p-2 rounded">Esperando turno del oponente</div>
      )}

      <div className="space-y-2">
        {needsResponse() ? (
          <div className="space-y-2">
            <div className="text-sm font-medium text-center">
              Responder {call?.type === "truco" ? "Truco" : call?.type === "flor" ? "Flor" : "Envido"}
            </div>
            <div className="flex gap-2">
              <Button onClick={onAcceptCall} disabled={!canInteract} className="flex-1" size="sm">
                {getButtonContent("accepting-call", "Quiero")}
              </Button>
              <Button onClick={onRejectCall} disabled={!canInteract} variant="destructive" className="flex-1" size="sm">
                {getButtonContent("rejecting-call", "No Quiero")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Flor Phase */}
            {phase === "flor" && config?.withFlor && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-center text-muted-foreground">Fase de Flor</div>
                <div className="flex gap-2">
                  <Button
                    onClick={onCallFlor}
                    disabled={!canInteract || !canCallFlor()}
                    variant="secondary"
                    className="flex-1"
                    size="sm"
                  >
                    <Flower className="mr-2 h-4 w-4" />
                    {getButtonContent("calling-flor", "Flor")}
                  </Button>
                  {canSkipPhase() && (
                    <Button onClick={onSkipPhase} disabled={!canInteract} variant="outline" size="sm">
                      Pasar
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Envido Phase */}
            {phase === "envido" && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-center text-muted-foreground">Fase de Envido</div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => onCallEnvido("envido")}
                    disabled={!canInteract || !canCallEnvido()}
                    variant="secondary"
                    size="sm"
                  >
                    <Coins className="mr-1 h-3 w-3" />
                    {getButtonContent("calling-envido", "Envido")}
                  </Button>
                  <Button
                    onClick={() => onCallEnvido("real_envido")}
                    disabled={!canInteract || !canCallEnvido()}
                    variant="secondary"
                    size="sm"
                  >
                    <Coins className="mr-1 h-3 w-3" />
                    {getButtonContent("calling-real-envido", "Real")}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => onCallEnvido("falta_envido")}
                    disabled={!canInteract || !canCallEnvido()}
                    variant="secondary"
                    className="flex-1"
                    size="sm"
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    {getButtonContent("calling-falta-envido", "Falta Envido")}
                  </Button>
                  {canSkipPhase() && (
                    <Button onClick={onSkipPhase} disabled={!canInteract} variant="outline" size="sm">
                      Pasar
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Truco Phase */}
            {(phase === "truco" || phase === "playing") && (
              <div className="space-y-2">
                {phase === "truco" && (
                  <div className="text-sm font-medium text-center text-muted-foreground">Fase de Truco</div>
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={onCallTruco}
                    disabled={!canInteract || !canCallTruco()}
                    variant="secondary"
                    className="flex-1"
                    size="sm"
                  >
                    {getButtonContent("calling-truco", getTrucoButtonText())}
                  </Button>
                  {phase === "truco" && canSkipPhase() && (
                    <Button onClick={onSkipPhase} disabled={!canInteract} variant="outline" size="sm">
                      Pasar
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {call && (
        <div className="space-y-1">
          <div className="text-xs text-center text-muted-foreground">{getCallDescription()}</div>
          {accepted && <div className="text-xs text-center text-green-600 bg-green-50 p-1 rounded">¡Aceptado!</div>}
          {call.points !== undefined && (
            <div className="text-xs text-center text-blue-600 bg-blue-50 p-1 rounded">Puntos: {call.points}</div>
          )}
        </div>
      )}

      {!call && phase === "playing" && isMyTurn && (
        <div className="text-xs text-center text-muted-foreground opacity-75">
          Es tu turno - selecciona una carta para jugar
        </div>
      )}

      {!call && phase !== "playing" && canSkipPhase() && (
        <div className="text-xs text-center text-muted-foreground opacity-75">
          Puedes hacer una jugada o pasar a la siguiente fase
        </div>
      )}
    </div>
  )
}
