import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface GameMessage {
  type: "info" | "action" | "truco" | "winner"
  text: string
  timestamp: Date
}

interface GameMessagesProps {
  messages: GameMessage[]
}

export function GameMessages({ messages }: GameMessagesProps) {
  const getMessageColor = (type: GameMessage["type"]) => {
    switch (type) {
      case "info":
        return "text-muted-foreground"
      case "action":
        return "text-foreground"
      case "truco":
        return "text-secondary font-medium"
      case "winner":
        return "text-primary font-bold"
      default:
        return "text-foreground"
    }
  }

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Eventos del Juego</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-64 px-4">
          <div className="space-y-2">
            {messages.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">No hay eventos aún...</div>
            ) : (
              messages.map((message, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-xs text-muted-foreground min-w-12">{formatTime(message.timestamp)}</span>
                  <span className={getMessageColor(message.type)}>{message.text}</span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
