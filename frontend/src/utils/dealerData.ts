export interface OutfitStage {
  name: string; // e.g., "Professional", "Dinner / Cocktail"
  imageUrl: string; // URL to the dealer image for this stage
  winsToUnlock: number; // Wins required to unlock this stage automatically
  coinsToUnlock: number; // Coins to unlock this stage early
  personalityPrompt: string; // System prompt for OpenAI for this stage
}

export interface DealerProfile {
  id: string; // Unique dealer ID
  name: string; // Dealer's display name
  avatarUrl: string; // Main avatar for selection card
  outfitStages: OutfitStage[];
  basePersonalityPrompt: string; // A general personality for the dealer, can be combined with stage-specific one
}

export const dealers: DealerProfile[] = [
  {
    id: "dealer1_sophia",
    name: "Sophia",
    avatarUrl: "/avatars/sophia_avatar.png", // Example path
    basePersonalityPrompt: "You are Sophia, a sophisticated and engaging blackjack dealer. You are professional but with a hint of playful charm. You enjoy witty banter and celebrating player wins.",
    outfitStages: [
      {
        name: "Professional (Casino)",
        imageUrl: "/dealers/sophia/professional.png",
        winsToUnlock: 0,
        coinsToUnlock: 0,
        personalityPrompt: "Maintain a very professional and courteous tone. Focus on game rules and smooth gameplay. Offer standard congratulations or commiserations."
      },
      {
        name: "Dinner / Cocktail",
        imageUrl: "/dealers/sophia/cocktail.png",
        winsToUnlock: 5,
        coinsToUnlock: 100,
        personalityPrompt: "You are slightly more relaxed and conversational. You might make small talk about the casino atmosphere or ask about the player's luck. Still very elegant."
      },
      {
        name: "Casual Lounge",
        imageUrl: "/dealers/sophia/lounge.png",
        winsToUnlock: 15,
        coinsToUnlock: 300,
        personalityPrompt: "Your tone is more friendly and approachable. You can share light jokes or more personal-sounding encouragement. Compliment good plays more warmly."
      },
      {
        name: "Sport / Relaxed",
        imageUrl: "/dealers/sophia/sport.png",
        winsToUnlock: 30,
        coinsToUnlock: 700,
        personalityPrompt: "You are energetic and playful. You might use more casual language and tease the player good-naturedly. React with more excitement to wins."
      },
      {
        name: "Swimwear (Classy Swimsuit)",
        imageUrl: "/dealers/sophia/swimsuit.png",
        winsToUnlock: 50,
        coinsToUnlock: 1500,
        personalityPrompt: "You are flirty and bold. You can make more direct compliments or playful challenges. Your responses are more suggestive and fun."
      },
      {
        name: "Luxury Lingerie", // Or "Evening Glamour" depending on final direction
        imageUrl: "/dealers/sophia/luxury.png",
        winsToUnlock: 100,
        coinsToUnlock: 3000,
        personalityPrompt: "You are very alluring and intimate in your chat style. Your responses are highly personalized and flirty, creating a strong sense of connection."
      }
    ]
  },
  // ... more dealer profiles
];

// Helper function to get a specific dealer's profile
export const getDealerById = (id: string): DealerProfile | undefined => {
  return dealers.find(dealer => dealer.id === id);
};

// Helper function to get a specific stage for a dealer
export const getDealerOutfitStage = (dealerId: string, stageIndex: number): OutfitStage | undefined => {
  const dealer = getDealerById(dealerId);
  if (dealer && dealer.outfitStages && stageIndex >= 0 && stageIndex < dealer.outfitStages.length) {
    return dealer.outfitStages[stageIndex];
  }
  return undefined;
};
