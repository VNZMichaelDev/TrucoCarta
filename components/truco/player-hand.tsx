"use client"

import type { Card } from "@/types/truco"
import { CardComponent } from "./card-component"

interface PlayerHandProps {
  cards: Card[]
  onCardPlay: (cardId: string) => void
  disabled?: boolean
  isMyTurn?: boolean
  actionInProgress?: boolean
}

export function PlayerHand({
  cards,
  onCardPlay,
  disabled = false,
  isMyTurn = false,
  actionInProgress = false,
}: PlayerHandProps) {
  const getTurnIndicator = () => {
    if (actionInProgress) return "Jugando carta..."
    if (isMyTurn) return "Tu turno - Selecciona una carta"
    return "Esperando turno"
  }

  const getIndicatorColor = () => {
    if (actionInProgress) return "text-blue-600"
    if (isMyTurn) return "text-green-600"
    return "text-muted-foreground"
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className={`text-sm font-medium ${getIndicatorColor()} transition-colors`}>{getTurnIndicator()}</div>

      <div className={`flex gap-2 transition-opacity ${disabled && !isMyTurn ? "opacity-50" : "opacity-100"}`}>
        {cards.map((card) => (
          <CardComponent
            key={card.id}
            card={card}
            onClick={() => onCardPlay(card.id)}
            disabled={disabled || !isMyTurn || actionInProgress}
            size="lg"
            className={`transition-all duration-200 ${
              isMyTurn && !disabled && !actionInProgress ? "hover:scale-105 hover:shadow-lg cursor-pointer" : ""
            }`}
          />
        ))}
      </div>

      {cards.length === 3 && isMyTurn && !disabled && (
        <div className="text-xs text-center text-muted-foreground max-w-xs">
          Haz clic en una carta para jugarla. Las cartas más altas ganan la mano.
        </div>
      )}
    </div>
  )
}
