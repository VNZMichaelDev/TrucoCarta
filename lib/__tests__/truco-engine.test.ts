import { TrucoEngine } from "../truco-engine"
import type { Card } from "@/types/truco"

describe("TrucoEngine", () => {
  describe("compareCards", () => {
    it("should rank ancho de espadas as highest", () => {
      const anchoEspadas: Card = { suit: "espadas", rank: 1, id: "1" }
      const anchoBastos: Card = { suit: "bastos", rank: 1, id: "2" }

      expect(TrucoEngine.compareCards(anchoEspadas, anchoBastos)).toBe(1)
    })

    it("should rank 7 de espadas higher than 7 de oro", () => {
      const sieteEspadas: Card = { suit: "espadas", rank: 7, id: "1" }
      const sieteOro: Card = { suit: "oros", rank: 7, id: "2" }

      expect(TrucoEngine.compareCards(sieteEspadas, sieteOro)).toBe(1)
    })

    it("should rank all 3s equally", () => {
      const tresEspadas: Card = { suit: "espadas", rank: 3, id: "1" }
      const tresBastos: Card = { suit: "bastos", rank: 3, id: "2" }

      expect(TrucoEngine.compareCards(tresEspadas, tresBastos)).toBe(0)
    })

    it("should rank face cards correctly", () => {
      const rey: Card = { suit: "espadas", rank: 12, id: "1" }
      const caballo: Card = { suit: "espadas", rank: 11, id: "2" }
      const sota: Card = { suit: "espadas", rank: 10, id: "3" }

      expect(TrucoEngine.compareCards(rey, caballo)).toBe(0) // Same rank
      expect(TrucoEngine.compareCards(rey, sota)).toBe(0) // Same rank
    })
  })

  describe("createDeck", () => {
    it("should create a 40-card Spanish deck", () => {
      const deck = TrucoEngine.createDeck()
      expect(deck).toHaveLength(40)
    })

    it("should not include 8s or 9s", () => {
      const deck = TrucoEngine.createDeck()
      const hasEightOrNine = deck.some((card) => card.rank === 8 || card.rank === 9)
      expect(hasEightOrNine).toBe(false)
    })

    it("should include all suits and valid ranks", () => {
      const deck = TrucoEngine.createDeck()
      const suits = new Set(deck.map((card) => card.suit))
      const ranks = new Set(deck.map((card) => card.rank))

      expect(suits.size).toBe(4)
      expect(ranks.size).toBe(10)
      expect(Array.from(ranks).sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 10, 11, 12])
    })
  })

  describe("dealCards", () => {
    it("should deal 3 cards to each player", () => {
      const deck = TrucoEngine.createDeck()
      const playerIds = ["player1", "player2"]
      const { hands } = TrucoEngine.dealCards(deck, playerIds)

      expect(hands.player1).toHaveLength(3)
      expect(hands.player2).toHaveLength(3)
    })

    it("should return remaining deck", () => {
      const deck = TrucoEngine.createDeck()
      const playerIds = ["player1", "player2"]
      const { remainingDeck } = TrucoEngine.dealCards(deck, playerIds)

      expect(remainingDeck).toHaveLength(34) // 40 - 6 dealt cards
    })
  })

  describe("initializeGame", () => {
    it("should initialize game state for 2 players", () => {
      const playerIds = ["player1", "player2"]
      const gameState = TrucoEngine.initializeGame(playerIds)

      expect(gameState.hands.player1).toHaveLength(3)
      expect(gameState.hands.player2).toHaveLength(3)
      expect(gameState.roundNumber).toBe(1)
      expect(gameState.scores.player1).toBe(0)
      expect(gameState.scores.player2).toBe(0)
      expect(playerIds).toContain(gameState.turnPlayerId)
    })

    it("should throw error for wrong number of players", () => {
      expect(() => TrucoEngine.initializeGame(["player1"])).toThrow("Truco requires exactly 2 players")
      expect(() => TrucoEngine.initializeGame(["p1", "p2", "p3"])).toThrow("Truco requires exactly 2 players")
    })
  })

  describe("evaluateTrick", () => {
    it("should determine winner of a trick", () => {
      const anchoEspadas: Card = { suit: "espadas", rank: 1, id: "1" }
      const cuatroBastos: Card = { suit: "bastos", rank: 4, id: "2" }

      const trick = {
        plays: [
          { playerId: "player1", card: cuatroBastos },
          { playerId: "player2", card: anchoEspadas },
        ],
      }

      const winner = TrucoEngine.evaluateTrick(trick)
      expect(winner).toBe("player2") // Ancho de espadas wins
    })

    it("should handle ties (first player wins)", () => {
      const tresEspadas: Card = { suit: "espadas", rank: 3, id: "1" }
      const tresBastos: Card = { suit: "bastos", rank: 3, id: "2" }

      const trick = {
        plays: [
          { playerId: "player1", card: tresEspadas },
          { playerId: "player2", card: tresBastos },
        ],
      }

      const winner = TrucoEngine.evaluateTrick(trick)
      expect(winner).toBe("player1") // First player wins on tie
    })
  })
})
