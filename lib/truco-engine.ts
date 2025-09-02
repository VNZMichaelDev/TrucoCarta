import type { Card, Suit, Rank, GameState, Trick, GameConfig } from "@/types/truco"

// Card hierarchy for Argentine Truco (higher number = stronger card)
const CARD_HIERARCHY: { [key: string]: number } = {
  // Strongest cards
  "1-espadas": 14, // Ancho de espadas
  "1-bastos": 13, // Ancho de bastos
  "7-espadas": 12,
  "7-oros": 11, // 7 de oro

  // Threes
  "3-espadas": 10,
  "3-bastos": 10,
  "3-oros": 10,
  "3-copas": 10,

  // Twos
  "2-espadas": 9,
  "2-bastos": 9,
  "2-oros": 9,
  "2-copas": 9,

  // Other aces
  "1-oros": 8,
  "1-copas": 8,

  // Face cards
  "12-espadas": 7,
  "12-bastos": 7,
  "12-oros": 7,
  "12-copas": 7,
  "11-espadas": 6,
  "11-bastos": 6,
  "11-oros": 6,
  "11-copas": 6,
  "10-espadas": 5,
  "10-bastos": 5,
  "10-oros": 5,
  "10-copas": 5,

  // Other sevens
  "7-bastos": 4,
  "7-copas": 4,

  // Low cards
  "6-espadas": 3,
  "6-bastos": 3,
  "6-oros": 3,
  "6-copas": 3,
  "5-espadas": 2,
  "5-bastos": 2,
  "5-oros": 2,
  "5-copas": 2,
  "4-espadas": 1,
  "4-bastos": 1,
  "4-oros": 1,
  "4-copas": 1,
}

export class TrucoEngine {
  /**
   * Compare two cards according to Truco hierarchy
   * @returns -1 if a < b, 0 if equal, 1 if a > b
   */
  static compareCards(a: Card, b: Card): -1 | 0 | 1 {
    const aKey = `${a.rank}-${a.suit}`
    const bKey = `${b.rank}-${b.suit}`

    const aValue = CARD_HIERARCHY[aKey] || 0
    const bValue = CARD_HIERARCHY[bKey] || 0

    if (aValue > bValue) return 1
    if (aValue < bValue) return -1
    return 0
  }

  /**
   * Create a Spanish deck (40 cards, no 8s or 9s)
   */
  static createDeck(): Card[] {
    const suits: Suit[] = ["espadas", "bastos", "oros", "copas"]
    const ranks: Rank[] = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12]
    const deck: Card[] = []

    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({
          suit,
          rank,
          id: `${rank}-${suit}-${Math.random().toString(36).substring(2, 9)}`,
        })
      }
    }

    return this.shuffleDeck(deck)
  }

  /**
   * Shuffle deck using Fisher-Yates algorithm
   */
  static shuffleDeck(deck: Card[]): Card[] {
    const shuffled = [...deck]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  /**
   * Deal 3 cards to each player
   */
  static dealCards(
    deck: Card[],
    playerIds: string[],
  ): { hands: { [playerId: string]: Card[] }; remainingDeck: Card[] } {
    const hands: { [playerId: string]: Card[] } = {}
    let deckIndex = 0

    // Initialize hands
    for (const playerId of playerIds) {
      hands[playerId] = []
    }

    // Deal 3 cards to each player
    for (let cardNum = 0; cardNum < 3; cardNum++) {
      for (const playerId of playerIds) {
        if (deckIndex < deck.length) {
          hands[playerId].push(deck[deckIndex])
          deckIndex++
        }
      }
    }

    return {
      hands,
      remainingDeck: deck.slice(deckIndex),
    }
  }

  /**
   * Initialize a new game state with configuration
   */
  static initializeGame(playerIds: string[], config: GameConfig): GameState {
    if (playerIds.length !== 2) {
      throw new Error("Truco requires exactly 2 players")
    }

    const deck = this.createDeck()
    const { hands, remainingDeck } = this.dealCards(deck, playerIds)
    const handStarterId = playerIds[Math.floor(Math.random() * playerIds.length)]

    return {
      deck: remainingDeck,
      hands,
      table: { plays: [] },
      wonTricks: { [playerIds[0]]: 0, [playerIds[1]]: 0 },
      turnPlayerId: handStarterId,
      handStarterId,
      roundNumber: 1,
      call: null,
      accepted: false,
      scores: { [playerIds[0]]: 0, [playerIds[1]]: 0 },
      phase: config.withFlor ? "flor" : "envido",
      config,
      envidoPoints: {},
      florCalled: false,
      envidoCalled: false,
    }
  }

  /**
   * Validate if a player can play a specific card
   */
  static canPlayCard(gameState: GameState, playerId: string, cardId: string): boolean {
    // Check if it's the player's turn
    if (gameState.turnPlayerId !== playerId) {
      return false
    }

    // Check if player has the card
    const playerHand = gameState.hands[playerId] || []
    return playerHand.some((card) => card.id === cardId)
  }

  /**
   * Play a card and update game state
   */
  static playCard(gameState: GameState, playerId: string, cardId: string): GameState {
    if (!this.canPlayCard(gameState, playerId, cardId)) {
      throw new Error("Invalid card play")
    }

    const newState = { ...gameState }
    const playerHand = [...(newState.hands[playerId] || [])]
    const cardIndex = playerHand.findIndex((card) => card.id === cardId)

    if (cardIndex === -1) {
      throw new Error("Card not found in player's hand")
    }

    const playedCard = playerHand[cardIndex]

    // Remove card from hand
    playerHand.splice(cardIndex, 1)
    newState.hands = { ...newState.hands, [playerId]: playerHand }

    // Add card to table
    newState.table = {
      ...newState.table,
      plays: [...newState.table.plays, { playerId, card: playedCard }],
    }

    // Check if trick is complete (2 cards played)
    if (newState.table.plays.length === 2) {
      const trickWinner = this.evaluateTrick(newState.table)
      newState.table.winnerId = trickWinner

      // Update won tricks
      newState.wonTricks = {
        ...newState.wonTricks,
        [trickWinner]: (newState.wonTricks[trickWinner] || 0) + 1,
      }

      // Check if hand is complete (someone won 2 tricks or it's round 3)
      const playerIds = Object.keys(newState.wonTricks)
      const maxTricks = Math.max(...Object.values(newState.wonTricks))

      if (maxTricks >= 2 || newState.roundNumber === 3) {
        // Hand is complete, calculate points
        const handWinner = this.determineHandWinner(newState)
        const points = this.calculateHandPoints(newState)

        newState.scores = {
          ...newState.scores,
          [handWinner]: (newState.scores[handWinner] || 0) + points,
        }

        // Check for game winner (15 points)
        if (newState.scores[handWinner] >= newState.config.maxPoints) {
          newState.winnerId = handWinner
        } else {
          // Start new hand
          return this.startNewHand(newState, playerIds)
        }
      } else {
        // Continue with next round
        newState.roundNumber = (newState.roundNumber + 1) as 1 | 2 | 3
        newState.table = { plays: [] }
        newState.turnPlayerId = trickWinner // Winner starts next round
      }
    } else {
      // Switch turns
      const playerIds = Object.keys(newState.hands)
      const currentIndex = playerIds.indexOf(playerId)
      const nextIndex = (currentIndex + 1) % playerIds.length
      newState.turnPlayerId = playerIds[nextIndex]
    }

    return newState
  }

  /**
   * Evaluate who wins a trick (2 cards)
   */
  static evaluateTrick(trick: Trick): string {
    if (trick.plays.length !== 2) {
      throw new Error("Trick must have exactly 2 cards")
    }

    const [play1, play2] = trick.plays
    const comparison = this.compareCards(play1.card, play2.card)

    if (comparison > 0) {
      return play1.playerId
    } else if (comparison < 0) {
      return play2.playerId
    } else {
      // Tie - first player wins
      return play1.playerId
    }
  }

  /**
   * Determine who wins the hand based on tricks won
   */
  static determineHandWinner(gameState: GameState): string {
    const playerIds = Object.keys(gameState.wonTricks)
    const [player1, player2] = playerIds

    const tricks1 = gameState.wonTricks[player1] || 0
    const tricks2 = gameState.wonTricks[player2] || 0

    if (tricks1 > tricks2) {
      return player1
    } else if (tricks2 > tricks1) {
      return player2
    } else {
      // Tie - hand starter wins
      return gameState.handStarterId
    }
  }

  /**
   * Calculate points for a completed hand
   */
  static calculateHandPoints(gameState: GameState): number {
    if (gameState.call && gameState.accepted) {
      // Truco was called and accepted
      return gameState.call.level + 1 // 1=Truco(2pts), 2=ReTruco(3pts), 3=Vale4(4pts)
    } else if (gameState.call && !gameState.accepted) {
      // Truco was called but not accepted
      return gameState.call.level // Points for the level that was rejected
    } else {
      // Normal hand
      return 1
    }
  }

  /**
   * Calculate Envido points for a player's hand
   */
  static calculateEnvidoPoints(hand: Card[]): number {
    const suitGroups: { [suit: string]: Card[] } = {}

    // Group cards by suit
    for (const card of hand) {
      if (!suitGroups[card.suit]) {
        suitGroups[card.suit] = []
      }
      suitGroups[card.suit].push(card)
    }

    let maxPoints = 0

    // Calculate points for each suit
    for (const suit in suitGroups) {
      const cards = suitGroups[suit]
      if (cards.length >= 2) {
        // Sort cards by Envido value (face cards = 0, others = face value)
        const envidoValues = cards.map((card) => (card.rank >= 10 ? 0 : card.rank)).sort((a, b) => b - a)

        // Take the two highest cards + 20
        const points = envidoValues[0] + envidoValues[1] + 20
        maxPoints = Math.max(maxPoints, points)
      }
    }

    // If no suit has 2+ cards, take highest card
    if (maxPoints === 0) {
      const highestCard = Math.max(...hand.map((card) => (card.rank >= 10 ? 0 : card.rank)))
      maxPoints = highestCard
    }

    return maxPoints
  }

  /**
   * Check if a player has Flor (3 cards of same suit)
   */
  static hasFlor(hand: Card[]): boolean {
    const suitCounts: { [suit: string]: number } = {}

    for (const card of hand) {
      suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1
    }

    return Object.values(suitCounts).some((count) => count === 3)
  }

  /**
   * Calculate Flor points (sum of all 3 cards + 20)
   */
  static calculateFlorPoints(hand: Card[]): number {
    const suitGroups: { [suit: string]: Card[] } = {}

    for (const card of hand) {
      if (!suitGroups[card.suit]) {
        suitGroups[card.suit] = []
      }
      suitGroups[card.suit].push(card)
    }

    for (const suit in suitGroups) {
      const cards = suitGroups[suit]
      if (cards.length === 3) {
        const points =
          cards.map((card) => (card.rank >= 10 ? 0 : card.rank)).reduce((sum, value) => sum + value, 0) + 20
        return points
      }
    }

    return 0
  }

  /**
   * Handle Envido call
   */
  static callEnvido(
    gameState: GameState,
    playerId: string,
    type: "envido" | "real_envido" | "falta_envido",
  ): GameState {
    if (gameState.phase !== "envido") {
      throw new Error("Cannot call Envido in this phase")
    }

    if (gameState.envidoCalled) {
      throw new Error("Envido already called this hand")
    }

    const levelMap = { envido: 1, real_envido: 2, falta_envido: 3 }
    const level = levelMap[type]

    // Calculate caller's Envido points
    const callerHand = gameState.hands[playerId] || []
    const envidoPoints = this.calculateEnvidoPoints(callerHand)

    return {
      ...gameState,
      call: {
        type: type,
        level,
        by: playerId,
        points: envidoPoints,
      },
      accepted: false,
      envidoCalled: true,
    }
  }

  /**
   * Handle Flor call
   */
  static callFlor(gameState: GameState, playerId: string): GameState {
    if (gameState.phase !== "flor") {
      throw new Error("Cannot call Flor in this phase")
    }

    if (gameState.florCalled) {
      throw new Error("Flor already called this hand")
    }

    const callerHand = gameState.hands[playerId] || []
    if (!this.hasFlor(callerHand)) {
      throw new Error("Player does not have Flor")
    }

    const florPoints = this.calculateFlorPoints(callerHand)

    return {
      ...gameState,
      call: {
        type: "flor",
        level: 1,
        by: playerId,
        points: florPoints,
      },
      accepted: false,
      florCalled: true,
    }
  }

  /**
   * Handle response to any call (Truco, Envido, Flor)
   */
  static respondToCall(gameState: GameState, playerId: string, accept: boolean): GameState {
    if (!gameState.call) {
      throw new Error("No call to respond to")
    }

    if (gameState.call.by === playerId) {
      throw new Error("Cannot respond to your own call")
    }

    const newState = { ...gameState }

    if (accept) {
      newState.accepted = true

      // For Envido/Flor, compare points and award winner
      if (
        gameState.call.type === "envido" ||
        gameState.call.type === "real_envido" ||
        gameState.call.type === "falta_envido"
      ) {
        const responderHand = newState.hands[playerId] || []
        const responderPoints = this.calculateEnvidoPoints(responderHand)
        const callerPoints = gameState.call.points || 0

        let winner: string
        if (callerPoints > responderPoints) {
          winner = gameState.call.by
        } else if (responderPoints > callerPoints) {
          winner = playerId
        } else {
          // Tie - hand starter wins
          winner = gameState.handStarterId
        }

        // Calculate points to award
        let pointsToAward = 2 // Base Envido
        if (gameState.call.type === "real_envido") pointsToAward = 3
        if (gameState.call.type === "falta_envido") {
          // Falta Envido: points needed to win the game
          const winnerCurrentScore = newState.scores[winner] || 0
          pointsToAward = newState.config.maxPoints - winnerCurrentScore
        }

        newState.scores = {
          ...newState.scores,
          [winner]: (newState.scores[winner] || 0) + pointsToAward,
        }

        // Store Envido points for display
        newState.envidoPoints = {
          [gameState.call.by]: callerPoints,
          [playerId]: responderPoints,
        }

        // Move to next phase
        newState.phase = "truco"
        newState.call = null
        newState.accepted = false
      } else if (gameState.call.type === "flor") {
        const responderHand = newState.hands[playerId] || []

        if (this.hasFlor(responderHand)) {
          // Both have Flor - compare points
          const responderPoints = this.calculateFlorPoints(responderHand)
          const callerPoints = gameState.call.points || 0

          let winner: string
          if (callerPoints > responderPoints) {
            winner = gameState.call.by
          } else if (responderPoints > callerPoints) {
            winner = playerId
          } else {
            winner = gameState.handStarterId
          }

          newState.scores = {
            ...newState.scores,
            [winner]: (newState.scores[winner] || 0) + 3, // Flor = 3 points
          }
        } else {
          // Only caller has Flor
          newState.scores = {
            ...newState.scores,
            [gameState.call.by]: (newState.scores[gameState.call.by] || 0) + 3,
          }
        }

        // Move to next phase
        newState.phase = "envido"
        newState.call = null
        newState.accepted = false
      }
    } else {
      // Rejected - caller wins points from previous level
      let points = 1

      if (gameState.call.type === "envido") points = 1
      else if (gameState.call.type === "real_envido") points = 1
      else if (gameState.call.type === "falta_envido") points = 1
      else if (gameState.call.type === "flor") points = 3
      else if (gameState.call.type === "truco") points = gameState.call.level

      const callerId = gameState.call.by

      newState.scores = {
        ...newState.scores,
        [callerId]: (newState.scores[callerId] || 0) + points,
      }

      // Move to appropriate next phase
      if (gameState.call.type === "flor") {
        newState.phase = "envido"
      } else if (
        gameState.call.type === "envido" ||
        gameState.call.type === "real_envido" ||
        gameState.call.type === "falta_envido"
      ) {
        newState.phase = "truco"
      }

      newState.call = null
      newState.accepted = false

      // Check for game winner
      if (newState.scores[callerId] >= newState.config.maxPoints) {
        newState.winnerId = callerId
      }
    }

    return newState
  }

  /**
   * Get valid actions for a player based on current game phase
   */
  static getValidActions(gameState: GameState, playerId: string): string[] {
    const actions: string[] = []

    // Phase-specific actions
    if (gameState.phase === "flor" && gameState.config.withFlor) {
      const playerHand = gameState.hands[playerId] || []
      if (this.hasFlor(playerHand) && !gameState.florCalled) {
        actions.push("call_flor")
      }
      if (!gameState.florCalled) {
        actions.push("skip_flor") // Move to next phase
      }
    }

    if (gameState.phase === "envido") {
      if (!gameState.envidoCalled) {
        actions.push("call_envido", "call_real_envido", "call_falta_envido")
      }
      if (!gameState.envidoCalled) {
        actions.push("skip_envido") // Move to next phase
      }
    }

    if (gameState.phase === "truco" || gameState.phase === "playing") {
      // Can call Truco if no current call or can raise
      const currentLevel = gameState.call?.level || 0
      if (gameState.call?.type === "truco" || !gameState.call) {
        if (currentLevel < 4 && (!gameState.call || gameState.call.by !== playerId)) {
          actions.push("call_truco")
        }
      }

      // Can play cards in playing phase
      if (gameState.phase === "playing" && gameState.turnPlayerId === playerId) {
        actions.push("play_card")
      }
    }

    // Can respond to any call
    if (gameState.call && !gameState.accepted && gameState.call.by !== playerId) {
      actions.push("accept_call", "reject_call")
    }

    return actions
  }

  /**
   * Start a new hand after one is completed
   */
  static startNewHand(gameState: GameState, playerIds: string[]): GameState {
    const deck = this.createDeck()
    const { hands, remainingDeck } = this.dealCards(deck, playerIds)

    const currentStarterIndex = playerIds.indexOf(gameState.handStarterId)
    const newStarterIndex = (currentStarterIndex + 1) % playerIds.length
    const newHandStarter = playerIds[newStarterIndex]

    return {
      ...gameState,
      deck: remainingDeck,
      hands,
      table: { plays: [] },
      wonTricks: { [playerIds[0]]: 0, [playerIds[1]]: 0 },
      turnPlayerId: newHandStarter,
      handStarterId: newHandStarter,
      roundNumber: 1,
      call: null,
      accepted: false,
      phase: gameState.config.withFlor ? "flor" : "envido",
      envidoPoints: {},
      florCalled: false,
      envidoCalled: false,
    }
  }
}
