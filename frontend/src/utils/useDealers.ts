import { useState, useEffect } from "react";
import { DealerData } from "./dealerTypes";
import { getDealers as getAdminDealers } from "./adminDealerManager";
import { getLocalDealers } from "./localDealerManager";

export const useDealers = () => {
  const [dealers, setDealers] = useState<DealerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDealers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Probeer eerst admin dealers op te halen
        try {
          const adminDealers = await getAdminDealers();
          setDealers(adminDealers);
          return;
        } catch (adminError) {
          console.log("Geen admin dealers gevonden, val terug op lokale dealers");
        }

        // Val terug op lokale dealers als admin dealers niet beschikbaar zijn
        const localDealers = getLocalDealers();
        setDealers(localDealers);
      } catch (err) {
        console.error("Error fetching dealers:", err);
        setError("Kon dealers niet laden");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDealers();
  }, []);

  return { dealers, isLoading, error };
}; 