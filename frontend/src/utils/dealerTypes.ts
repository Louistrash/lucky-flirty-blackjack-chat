export interface Dealer {
  id: string; // Firestore document ID
  name: string;
  gender: 'male' | 'female' | 'other';
  personalityTraits: string[]; // e.g., ["Charming", "Witty", "Professional"]
  bio: string; // Professional description
  outfitImages: {
    professional: string;    // URL for Professional (Casino)
    dinner: string;          // URL for Dinner / Cocktail
    casual: string;          // URL for Casual Lounge
    sport: string;           // URL for Sport / Relaxed
    swimwear: string;        // URL for Swimwear (shorts or classy swimsuit)
    luxuryLingerie: string;  // URL for Luxury Lingerie / Swim Bikini
  };
  chatPersonalityPrompt: string; // System prompt for the LLM
  experienceLevel: 'novice' | 'intermediate' | 'expert';
  winPercentage: number; // 0-100
}