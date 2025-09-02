"use client"

import type { Card } from "@/types/truco"
import { cn } from "@/lib/utils"

interface CardProps {
  card: Card
  onClick?: () => void
  disabled?: boolean
  size?: "sm" | "md" | "lg"
  faceDown?: boolean
}

const SUIT_SYMBOLS = {
  espadas: "♠",
  bastos: "♣",
  oros: "♦",
  copas: "♥",
}

const SUIT_COLORS = {
  espadas: "text-gray-900",
  bastos: "text-gray-900",
  oros: "text-amber-600",
  copas: "text-red-600",
}

const RANK_DISPLAY = {
  1: "A",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  10: "J",
  11: "Q",
  12: "K",
}

export function CardComponent({ card, onClick, disabled = false, size = "md", faceDown = false }: CardProps) {
  const sizeClasses = {
    sm: "w-12 h-16 text-xs",
    md: "w-16 h-24 text-sm",
    lg: "w-20 h-28 text-base",
  }

  if (faceDown) {
    return (
      <div
        className={cn(
          "bg-gradient-to-br from-blue-900 to-blue-700 border-2 border-blue-800 rounded-lg flex items-center justify-center cursor-pointer shadow-md",
          sizeClasses[size],
          disabled && "opacity-50 cursor-not-allowed",
        )}
        onClick={!disabled ? onClick : undefined}
      >
        <div className="text-blue-200 font-bold text-lg">?</div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "bg-white border-2 border-gray-300 rounded-lg flex flex-col items-center justify-between p-1 cursor-pointer shadow-md hover:shadow-lg transition-all duration-200",
        sizeClasses[size],
        disabled && "opacity-50 cursor-not-allowed",
        onClick && !disabled && "hover:scale-105 hover:border-primary",
      )}
      onClick={!disabled ? onClick : undefined}
    >
      <div className={cn("font-bold", SUIT_COLORS[card.suit])}>{RANK_DISPLAY[card.rank]}</div>
      <div className={cn("text-2xl", SUIT_COLORS[card.suit])}>{SUIT_SYMBOLS[card.suit]}</div>
      <div className={cn("font-bold rotate-180", SUIT_COLORS[card.suit])}>{RANK_DISPLAY[card.rank]}</div>
    </div>
  )
}
