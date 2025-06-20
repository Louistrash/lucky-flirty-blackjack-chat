import type { DealerData } from "./adminDealerManager";

export const dummyDealers: Omit<DealerData, 'outfitStages'>[] = [
  {
    id: "frederique_001",
    name: "Frederique",
    avatarUrl: "/demodealers/1.webp",
    isActive: true,
    displayWinRate: "85%",
    experience: "Expert",
    title: "Blackjack Classic",
    gameStats: {
      totalGamesPlayed: 1247,
      playerWinRateAgainst: 42.3
    }
  },
  {
    id: "isabella_002",
    name: "Isabella", 
    avatarUrl: "/demodealers/2.webp",
    isActive: true,
    displayWinRate: "92%",
    experience: "Master",
    title: "Poker Pro",
    gameStats: {
      totalGamesPlayed: 2156,
      playerWinRateAgainst: 38.9
    }
  },
  {
    id: "sophia_003",
    name: "Sophia",
    avatarUrl: "/demodealers/3.webp",
    isActive: true,
    displayWinRate: "78%",
    experience: "Advanced",
    title: "Roulette Queen",
    gameStats: {
      totalGamesPlayed: 1543,
      playerWinRateAgainst: 41.8
    }
  },
  {
    id: "emma_004", 
    name: "Emma",
    avatarUrl: "/demodealers/4.webp",
    isActive: true,
    displayWinRate: "88%",
    experience: "Expert",
    title: "Baccarat Beauty",
    gameStats: {
      totalGamesPlayed: 856,
      playerWinRateAgainst: 45.2
    }
  },
  {
    id: "olivia_005",
    name: "Luna",
    avatarUrl: "/demodealers/5.webp",
    isActive: true,
    displayWinRate: "83%",
    experience: "Advanced",
    title: "Casino All-rounder",
    gameStats: {
      totalGamesPlayed: 1789,
      playerWinRateAgainst: 35.7
    }
  },
  {
    id: "dealer_carlynne_ara_8682",
    name: "Victoria",
    avatarUrl: "/demodealers/6.webp",
    isActive: true,
    experience: "Professional",
    title: "Premium Dealer",
    displayWinRate: "N/A"
  },
  {
    id: "dealer_aria_007",
    name: "Aria",
    avatarUrl: "/demodealers/7.webp",
    isActive: true,
    experience: "Expert",
    title: "Poker Specialist",
    displayWinRate: "89%",
    gameStats: {
      totalGamesPlayed: 1342,
      playerWinRateAgainst: 40.1
    }
  },
  {
    id: "dealer_maya_008",
    name: "Maya",
    avatarUrl: "/demodealers/8.webp",
    isActive: true,
    experience: "Master",
    title: "High Stakes Dealer",
    displayWinRate: "94%",
    gameStats: {
      totalGamesPlayed: 2890,
      playerWinRateAgainst: 36.8
    }
  },
  {
    id: "dealer_zara_009",
    name: "Zara",
    avatarUrl: "/demodealers/9.webp",
    isActive: true,
    experience: "Advanced",
    title: "VIP Casino Host",
    displayWinRate: "87%",
    gameStats: {
      totalGamesPlayed: 1756,
      playerWinRateAgainst: 43.2
    }
  }
];

// Functions for local data management (if needed, e.g., for testing or local development)
export const getActiveDealers = (): Omit<DealerData, 'outfitStages'>[] => {
  return dummyDealers.filter(dealer => dealer.isActive);
};

export const getAllDealers = (): Omit<DealerData, 'outfitStages'>[] => {
  return dummyDealers;
};

export const getDealerById = (id: string): Omit<DealerData, 'outfitStages'> | undefined => {
  return dummyDealers.find(dealer => dealer.id === id);
};

// Async version to mimic backend fetching
export const getDealerByIdFromBackend = async (id: string): Promise<Omit<DealerData, 'outfitStages'> | undefined> => {
  console.log(`Fetching dealer ${id} from dummy data...`);
  return new Promise(resolve => {
    setTimeout(() => {
      const dealer = dummyDealers.find(d => d.id === id);
      resolve(dealer);
    }, 300); // Simulate network delay
  });
}; 