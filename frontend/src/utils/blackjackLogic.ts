// In ui/src/utils/blackjackLogic.ts

export type Suit = "♠" | "♥" | "♦" | "♣";
export type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number; // Blackjack value (J,Q,K = 10; A = 1 or 11)
  image: string; // Path to card image (e.g., "/cards/AS.png")
  isFaceDown?: boolean; // For dealer's hidden card
}

const SUITS: Suit[] = ["♠", "♥", "♦", "♣"];
const RANKS: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

const getCardValue = (rank: Rank): number => {
  if (["K", "Q", "J"].includes(rank)) return 10;
  if (rank === "A") return 11; // Initial value for Ace, can be 1 later
  return parseInt(rank);
};

export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        suit,
        rank,
        value: getCardValue(rank),
        // Adjusted image path for simplicity, assuming images are in public/cards/
        // e.g. public/cards/AS.png, public/cards/KD.png, public/cards/TC.png (Ten of Clubs)
        image: `/cards/${rank.length === 1 ? rank : rank.charAt(0)}${suit.charAt(0)}.png`,
        isFaceDown: false,
      });
    }
  }
  return deck;
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  // Fisher-Yates shuffle algorithm
  const shuffledDeck = [...deck];
  for (let i = shuffledDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledDeck[i], shuffledDeck[j]] = [shuffledDeck[j], shuffledDeck[i]];
  }
  return shuffledDeck;
};

// Function to calculate hand score, handling Aces
export const calculateScore = (hand: Card[]): number => {
  let score = 0;
  let aceCount = 0;
  for (const card of hand) {
    if (card.isFaceDown) continue;
    score += card.value;
    if (card.rank === "A") {
      aceCount++;
    }
  }
  // Adjust for Aces if score is over 21
  while (score > 21 && aceCount > 0) {
    score -= 10;
    aceCount--;
  }
  return score;
};