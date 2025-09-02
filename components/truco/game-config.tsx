"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import type { GameConfig } from "@/types/truco"

interface GameConfigProps {
  onConfigSet: (config: GameConfig) => void
  onBack: () => void
}

export function GameConfigComponent({ onConfigSet, onBack }: GameConfigProps) {
  const [maxPoints, setMaxPoints] = useState<15 | 30>(15)
  const [withFlor, setWithFlor] = useState(true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onConfigSet({ maxPoints, withFlor })
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Configuración del Juego</CardTitle>
          <CardDescription>Elegí las reglas para tu partida</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Points Configuration */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Puntos para ganar</Label>
              <RadioGroup
                value={maxPoints.toString()}
                onValueChange={(value) => setMaxPoints(value === "30" ? 30 : 15)}
                className="grid grid-cols-2 gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="15" id="points-15" />
                  <Label htmlFor="points-15" className="cursor-pointer">
                    15 puntos
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="30" id="points-30" />
                  <Label htmlFor="points-30" className="cursor-pointer">
                    30 puntos
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Flor Configuration */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="flor-switch" className="text-base font-medium cursor-pointer">
                  Jugar con Flor
                </Label>
                <p className="text-sm text-muted-foreground">Incluir la jugada de Flor (3 cartas del mismo palo)</p>
              </div>
              <Switch id="flor-switch" checked={withFlor} onCheckedChange={setWithFlor} />
            </div>

            {/* Game Rules Summary */}
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">Resumen de la configuración:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Partida hasta {maxPoints} puntos</li>
                <li>• {withFlor ? "Con" : "Sin"} Flor</li>
                <li>• Envido, Real Envido y Falta Envido disponibles</li>
                <li>• Truco, ReTruco y Vale 4 disponibles</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onBack} className="flex-1 bg-transparent">
                Volver
              </Button>
              <Button type="submit" className="flex-1">
                Continuar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
