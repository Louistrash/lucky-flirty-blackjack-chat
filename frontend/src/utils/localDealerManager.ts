/**
 * Local Storage Dealer Management
 * Eenvoudige dealer opslag in localStorage
 */

import type { DealerData } from "../components/DealerCard";

const LOCAL_STORAGE_KEY = "flirty_chat_dealers";
const LAST_SYNC_KEY = "flirty_chat_dealers_last_sync";

/**
 * Haalt alle dealers op uit localStorage
 */
export const getLocalDealers = (): DealerData[] => {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) return [];
    
    const dealers = JSON.parse(stored) as DealerData[];
    
    // Voeg 'source' property toe als die ontbreekt (backwards compatibility)
    return dealers.map(dealer => ({
      ...dealer,
      source: dealer.source || 'local'
    }));
  } catch (error) {
    console.error("❌ Fout bij ophalen dealers uit localStorage:", error);
    return [];
  }
};

/**
 * Slaat dealers op in localStorage
 */
export const setLocalDealers = (dealers: DealerData[]): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dealers));
    setLastSync(new Date().toISOString());
    console.log(`✅ ${dealers.length} dealers opgeslagen in localStorage`);
  } catch (error) {
    console.error("❌ Fout bij opslaan dealers in localStorage:", error);
  }
};

/**
 * Haalt een specifieke dealer op uit localStorage
 */
export const getLocalDealer = (dealerId: string): DealerData | null => {
  const dealers = getLocalDealers();
  return dealers.find(d => d.id === dealerId) || null;
};

/**
 * Voegt een nieuwe dealer toe aan localStorage
 */
export const addLocalDealer = (dealer: DealerData): void => {
  try {
    const existingDealers = getLocalDealers();
    const dealerWithSource = { ...dealer, source: 'local' as const };
    
    // Check of dealer al bestaat
    const exists = existingDealers.find(d => d.id === dealer.id);
    if (exists) {
      console.warn(`⚠️ Dealer ${dealer.id} bestaat al in localStorage`);
      return;
    }
    
    const updatedDealers = [...existingDealers, dealerWithSource];
    setLocalDealers(updatedDealers);
    
    console.log(`✅ Dealer ${dealer.name} toegevoegd aan localStorage`);
  } catch (error) {
    console.error("❌ Fout bij toevoegen dealer aan localStorage:", error);
  }
};

/**
 * Werkt een bestaande dealer bij in localStorage
 */
export const updateLocalDealer = (dealerId: string, updates: Partial<DealerData>): void => {
  try {
    const dealers = getLocalDealers();
    const dealerIndex = dealers.findIndex(d => d.id === dealerId);
    
    if (dealerIndex >= 0) {
      dealers[dealerIndex] = {
        ...dealers[dealerIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      setLocalDealers(dealers);
      console.log(`✅ Dealer ${dealerId} bijgewerkt in localStorage`);
    } else {
      console.warn(`⚠️ Dealer ${dealerId} niet gevonden voor update`);
    }
  } catch (error) {
    console.error("❌ Fout bij bijwerken dealer in localStorage:", error);
  }
};

/**
 * Verwijdert een dealer uit localStorage
 */
export const removeLocalDealer = (dealerId: string): void => {
  try {
    const existingDealers = getLocalDealers();
    const filteredDealers = existingDealers.filter(d => d.id !== dealerId);
    
    if (filteredDealers.length === existingDealers.length) {
      console.warn(`⚠️ Dealer ${dealerId} niet gevonden in localStorage`);
      return;
    }
    
    setLocalDealers(filteredDealers);
    console.log(`✅ Dealer ${dealerId} verwijderd uit localStorage`);
  } catch (error) {
    console.error("❌ Fout bij verwijderen dealer uit localStorage:", error);
  }
};

/**
 * Synchroniseert local dealers met Firestore (indien beschikbaar)
 */
export const syncWithFirestore = async (): Promise<{ synced: number; errors: string[] }> => {
  const errors: string[] = [];
  let synced = 0;
  
  try {
    // Probeer Firestore te importeren
    const { getDealers, addDealer } = await import("./adminDealerManager");
    
    const localDealers = getLocalDealers();
    const firestoreDealers = await getDealers();
    
    // Sync local dealers naar Firestore
    for (const localDealer of localDealers) {
      try {
        const existsInFirestore = firestoreDealers.find(fd => fd.id === localDealer.id);
        
        if (!existsInFirestore) {
          await addDealer(localDealer);
          synced++;
          console.log(`✅ Dealer ${localDealer.name} gesynchroniseerd naar Firestore`);
        }
      } catch (error) {
        const errorMsg = `Fout bij sync van ${localDealer.name}: ${error}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }
    
    setLastSync(new Date().toISOString());
    console.log(`✅ Synchronisatie voltooid: ${synced} dealers gesynchroniseerd`);
    
  } catch (error) {
    const errorMsg = `Firestore sync niet beschikbaar: ${error}`;
    errors.push(errorMsg);
    console.warn(errorMsg);
  }
  
  return { synced, errors };
};

/**
 * Export functie voor gebruik op Plesk server
 */
export const exportDealersForPlesk = (): string => {
  const dealers = getLocalDealers();
  
  const exportData = {
    dealers,
    lastSync: getLastSync(),
    exportDate: new Date().toISOString(),
    version: "1.0"
  };
  
  return JSON.stringify(exportData, null, 2);
};

/**
 * Import functie voor gebruik op Plesk server
 */
export const importDealersFromPlesk = (jsonData: string): void => {
  try {
    const data = JSON.parse(jsonData);
    
    if (data.dealers && Array.isArray(data.dealers)) {
      setLocalDealers(data.dealers);
    }
    
    console.log("✅ Dealers succesvol geïmporteerd van Plesk server");
  } catch (error) {
    console.error("❌ Fout bij importeren dealers van Plesk:", error);
    throw new Error("Ongeldige import data");
  }
};

/**
 * Hulpfuncties voor timestamps
 */
const setLastSync = (timestamp: string): void => {
  try {
    localStorage.setItem(LAST_SYNC_KEY, timestamp);
  } catch (error) {
    console.error("❌ Fout bij instellen last sync:", error);
  }
};

export const getLastSync = (): string | null => {
  try {
    return localStorage.getItem(LAST_SYNC_KEY);
  } catch (error) {
    console.error("❌ Fout bij ophalen last sync:", error);
    return null;
  }
};

/**
 * Reset functie voor development
 */
export const resetLocalDealers = (): void => {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem(LAST_SYNC_KEY);
    
    console.log("🔄 Local dealer data gereset");
  } catch (error) {
    console.error("❌ Fout bij resetten local dealers:", error);
  }
};

// Globale functies voor console debugging
if (typeof window !== 'undefined') {
  (window as any).localDealerManager = {
    getLocalDealers,
    exportDealersForPlesk,
    importDealersFromPlesk,
    syncWithFirestore,
    resetLocalDealers
  };
} 