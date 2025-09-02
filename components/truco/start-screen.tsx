"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GameConfigComponent } from "./game-config"
import type { GameConfig } from "@/types/truco"

interface StartScreenProps {
  onStart: (name: string, config: GameConfig) => void
}

export function StartScreen({ onStart }: StartScreenProps) {
  const [name, setName] = useState("")
  const [showConfig, setShowConfig] = useState(false)

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      setShowConfig(true)
    }
  }

  const handleConfigSet = (config: GameConfig) => {
    onStart(name.trim(), config)
  }

  const handleBack = () => {
    setShowConfig(false)
  }

  if (showConfig) {
    return <GameConfigComponent onConfigSet={handleConfigSet} onBack={handleBack} />
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Truco Online</CardTitle>
          <CardDescription className="text-lg">El juego de cartas argentino más popular</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleNameSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Ingresá tu nombre
              </label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre..."
                className="w-full"
                maxLength={20}
                required
              />
            </div>

            <div className="bg-muted/30 p-3 rounded-lg">
              <h4 className="font-medium text-sm mb-2">¿Cómo se juega?</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Flor: 3 cartas del mismo palo</li>
                <li>• Envido: suma de 2 cartas del mismo palo + 20</li>
                <li>• Truco: apostar por ganar la mano</li>
                <li>• Gana quien llegue primero a los puntos configurados</li>
              </ul>
            </div>

            <Button type="submit" className="w-full" disabled={!name.trim()}>
              Continuar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
