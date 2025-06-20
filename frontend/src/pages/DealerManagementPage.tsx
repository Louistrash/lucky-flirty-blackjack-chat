import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserGuardContext } from "app";
import { getDealers, addDealer, isAdminUser } from "../utils/adminDealerManager";
import type { DealerData } from '../utils/adminDealerManager';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import DealerForm from "../components/DealerForm";
import DealerDataImporter from "../components/DealerDataImporter";
import { getValidImageUrl } from "../utils/placeholderImages";
import { AppHeader } from "../components/AppHeader";
import DealerCarousel from "../components/DealerCarousel";
import { 
  getLocalDealers,
  setLocalDealers 
} from "../utils/localDealerManager";
import { validateDealerForCarrousel } from "../utils/dealerUtils";
import { useTranslation } from 'react-i18next';
import { usePlayerProgressStore } from "../utils/usePlayerProgressStore";

const DealerManagementPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useUserGuardContext();
  const { t } = useTranslation();
  const { playerData } = usePlayerProgressStore();
  const playerBalance = playerData?.coins || 0;
  
  const [dealers, setDealers] = useState<DealerData[]>([]);
  const [carouselDealers, setCarouselDealersState] = useState<DealerData[]>([]);
  const [carouselDealerIds, setCarouselDealerIds] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "carousel">("grid");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "draft">("all");
  const [filterGender, setFilterGender] = useState<string>("all");
  const [filterSpecialty, setFilterSpecialty] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showAddDealerModal, setShowAddDealerModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [currentCarouselPage, setCurrentCarouselPage] = useState<number>(1);
  const CAROUSEL_ITEMS_PER_PAGE = 10;

  // Unified data loading function
  const loadData = async () => {
    setIsDataLoading(true);
    setError(null);
    try {
      if (user && !authLoading) {
        const fetchedDealersFromDB = await getDealers();
        const localDealersFromStorage = getLocalDealers(); // Assuming this is still relevant for merging
        const combinedDealers = [...fetchedDealersFromDB, ...localDealersFromStorage.filter(ld => 
          !fetchedDealersFromDB.find(fd => fd.id === ld.id)
        )];
        
        const activeDealers = combinedDealers.filter(d => d.isActive);
        // Ensure carousel logic uses currently fetched and filtered dealers
        const currentCarouselIds = getLocalDealers().map(d => d.id); // Or however carousel preference is stored
        
        // Filter active dealers to those valid for carousel
        let validDealers: DealerData[] = [];
        let validDealerIds: string[] = [];
        for (const dealer of activeDealers) {
          const result = validateDealerForCarrousel(dealer);
          if (result.isValid) {
            validDealers.push(dealer);
            validDealerIds.push(dealer.id);
          }
        }
        
        // Prioritize dealers that are already in the carousel (by ID)
        const orderedCarouselDealers = [
          ...validDealers.filter(d => currentCarouselIds.includes(d.id)),
          ...validDealers.filter(d => !currentCarouselIds.includes(d.id))
        ].slice(0, 17); // Maximum of 17 dealers
        
        const orderedCarouselIds = orderedCarouselDealers.map(d => d.id);

        setDealers(combinedDealers);
        setCarouselDealersState(orderedCarouselDealers);
        setCarouselDealerIds(orderedCarouselIds);
        setIsAdmin(await isAdminUser(user.uid));
        console.log(`📊 Loaded: ${combinedDealers.length} total dealers, ${orderedCarouselDealers.length} carousel dealers`);
      } else if (!user && !authLoading) {
        setError("User not authenticated. Please log in to manage dealers.");
        setDealers([]);
        setCarouselDealersState([]);
        setCarouselDealerIds([]);
        setIsAdmin(false);
      }
    } catch (err: any) {
      console.error("Failed to load dealers:", err);
      if (err.code === 'permission-denied' || (err.message && err.message.toLowerCase().includes('permission denied'))) {
        setError("Permission denied. You might need to log in or have proper rights to view dealers.");
      } else {
        setError(err.message || "Failed to load dealers. Check console for details.");
      }
      setDealers([]);
      setCarouselDealersState([]);
      setCarouselDealerIds([]);
      setIsAdmin(false);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadData();
    } else {
      setIsDataLoading(true);
    }
  }, [user, authLoading]);

  const handleAddToCarousel = (dealer: DealerData) => {
    if (carouselDealerIds.length >= 17) {
      setError("Carousel can hold a maximum of 17 dealers.");
      return;
    }
    if (!carouselDealerIds.includes(dealer.id)) {
      const newCarouselIds = [...carouselDealerIds, dealer.id];
      setCarouselDealerIds(newCarouselIds);
      setCarouselDealersState(prev => [...prev, dealer]);
      // Persist this change if needed (e.g., to local storage for carousel order)
      // For now, a full data reload isn't strictly necessary unless backend state changes
    } else {
      setError(`${dealer.name} is already in the carousel.`);
    }
  };

  const handleRemoveFromCarousel = (dealerId: string) => {
    const newCarouselIds = carouselDealerIds.filter(id => id !== dealerId);
    setCarouselDealerIds(newCarouselIds);
    setCarouselDealersState(prev => prev.filter(d => d.id !== dealerId));
    // Persist this change if needed
  };

  const handleSaveCarouselOrder = async () => {
    // Assuming carouselDealers state is the source of truth for the new order
    const dealersToSaveForCarousel = carouselDealers.map(d => ({ 
      id: d.id, 
      name: d.name, 
      isActive: d.isActive, 
      gender: d.gender, 
      professionalImageUrl: d.professionalImageUrl || "", 
      specialties: d.specialties || [], 
      shortDescription: d.shortDescription || "" 
      // Ensure all fields required by setLocalDealers are present
    }));
    setLocalDealers(dealersToSaveForCarousel); 
    console.log(`✅ Homepage carousel order saved locally.`);
    // Optionally, reload data if saving order might affect other things or to confirm
    // await loadData(); 
  };

  const handleAddNewDealer = async (dealerData: DealerData) => {
    if (!user) {
      setError("You must be logged in to add a dealer.");
      return;
    }
    setIsDataLoading(true);
    try {
      // addDealer expects Omit<DealerData, "createdAt" | "updatedAt">
      // Extract the required fields from dealerData
      const requiredData = {
        id: dealerData.id,
        name: dealerData.name,
        isActive: dealerData.isActive,
        avatarUrl: dealerData.avatarUrl,
        outfitStages: dealerData.outfitStages,
        // Include any other required fields here
      };
      await addDealer(requiredData);
      setShowAddDealerModal(false);
      await loadData(); // Reload data to see the new dealer
    } catch (error) {
      console.error("Error adding new dealer:", error);
      setError("Failed to add new dealer.");
      setIsDataLoading(false); // Ensure loading state is reset on error
    }
  };

  const handleImportDealers = async (importedDealers: DealerData[]) => {
    if (!user) {
      setError("You must be logged in to import dealers.");
      return;
    }
    setIsDataLoading(true);
    try {
      const currentDealerIds = dealers.map(d => d.id);
      let newDealersAddedCount = 0;
      for (const importedDealer of importedDealers) {
        const dealerToAdd = { 
          ...importedDealer, 
          id: importedDealer.id || `imported-${Date.now()}-${Math.random().toString(36).substring(2,9)}`,
        };
        if (!currentDealerIds.includes(dealerToAdd.id)) {
          await addDealer(dealerToAdd);
          newDealersAddedCount++;
        }
      }
      setShowImportModal(false);
      console.log(`${newDealersAddedCount} dealers processed for import.`);
      if (newDealersAddedCount > 0) {
        await loadData(); // Reload data if new dealers were added
      } else {
        setIsDataLoading(false); // No changes, just reset loading state
      }
    } catch (error) {
      console.error("Error importing dealers:", error);
      setError("Failed to import dealers.");
      setIsDataLoading(false);
    }
  };
  
  const handleUpdateDealerInCarousel = (dealerId: string, updatedData: Partial<DealerData>) => {
    // This function should ideally update the backend, then reload data.
    // For now, it's an optimistic local update.
    setCarouselDealersState(prevDealers => 
      prevDealers.map(dealer => 
        dealer.id === dealerId ? { ...dealer, ...updatedData } : dealer
      )
    );
    setDealers(prevDealers => 
      prevDealers.map(dealer => 
        dealer.id === dealerId ? { ...dealer, ...updatedData } : dealer
      )
    );
    // If isLocal was a property, update local storage here too
  };

  const handlePageChange = (newPage: number) => {
    setCurrentCarouselPage(newPage);
  };

  const handleDealerClick = (dealerId: string) => {
    navigate(`/dealer-detail/${dealerId}`);
  };

  // Filter and sort logic for the main dealer grid/list
  const filteredDealers = dealers
    .filter(dealer => {
      if (filterStatus === "active") return dealer.isActive;
      if (filterStatus === "draft") return !dealer.isActive;
      return true;
    })
    .filter(dealer => filterGender === "all" || dealer.gender === filterGender)
    .filter(dealer => filterSpecialty === "all" || dealer.specialties?.includes(filterSpecialty))
    .filter(dealer => 
      dealer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dealer.shortDescription && dealer.shortDescription.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      const fieldA = String(a[sortField as keyof DealerData] ?? '').toLowerCase();
      const fieldB = String(b[sortField as keyof DealerData] ?? '').toLowerCase();
      let comparison = 0;
      if (fieldA > fieldB) comparison = 1;
      else if (fieldA < fieldB) comparison = -1;
      return sortOrder === "desc" ? comparison * -1 : comparison;
    });

  const totalCarouselPages = Math.ceil(carouselDealers.length / CAROUSEL_ITEMS_PER_PAGE) || 1;

  const paginatedCarouselDealers = carouselDealers.slice(
    (currentCarouselPage - 1) * CAROUSEL_ITEMS_PER_PAGE,
    currentCarouselPage * CAROUSEL_ITEMS_PER_PAGE
  );

  if (authLoading || isDataLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 flex justify-center items-center">
        <p className="text-xl text-yellow-400">Loading dealer management...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 flex flex-col justify-center items-center">
        <h1 className="text-4xl font-bold text-red-500 mb-4">Access Denied</h1>
        <p className="text-lg text-gray-300">You do not have permission to view this page.</p>
      </div>
    );
  }
  
  if (showAddDealerModal) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => setShowAddDealerModal(false)} 
            className="mb-4 text-yellow-400 hover:text-yellow-300"
          >
            ← Back to Dealer Management
          </button>
          <DealerForm 
            onSubmit={handleAddNewDealer}
            onCancel={() => setShowAddDealerModal(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <AppHeader playerBalance={playerBalance} />
      
      <div className="container mx-auto px-4 pt-24 pb-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-4">
            Dealer Management
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Beheer alle dealers en hun outfit stages voor een optimale casino-ervaring
          </p>
        </div>

        {/* Action Bar */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700/50">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    viewMode === "grid" 
                      ? "bg-yellow-500 text-black font-semibold" 
                      : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                  }`}
                >
                  <span className="mr-2">⊞</span> Grid View
                </button>
                <button
                  onClick={() => setViewMode("carousel")}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    viewMode === "carousel" 
                      ? "bg-yellow-500 text-black font-semibold" 
                      : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                  }`}
                >
                  <span className="mr-2">⊡</span> Carousel View
                </button>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAddDealerModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg"
                disabled={isDataLoading}
              >
                <span className="mr-2">+</span> Nieuwe Dealer
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg"
                disabled={isDataLoading}
              >
                <span className="mr-2">⥁</span> Import
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-800 text-white p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Carousel Section */}
        {viewMode === "carousel" && (
          <div className="mb-12">
            <div className="bg-gradient-to-r from-purple-800/30 to-blue-800/30 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-amber-300 mb-2">Carousel Dealers</h2>
                  <p className="text-gray-300">Deze dealers verschijnen in de hoofdcarrousel op de homepage (max 17)</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-yellow-400">{carouselDealers.length}/17</div>
                  <div className="text-sm text-gray-400">Active in Carousel</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {carouselDealers.map((dealer, index) => (
                  <div key={dealer.id} className="relative group">
                    <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-600/50 hover:border-yellow-400/50 transition-all duration-300 transform hover:scale-105">
                      <div className="relative">
                        <div className="aspect-[4/5]">
                          <Avatar className="w-full h-full rounded-none bg-slate-900">
                            <AvatarImage 
                              src={getValidImageUrl(dealer.avatarUrl, 'AVATAR')}
                              alt={dealer.name}
                              className="object-contain w-full h-full"
                            />
                            <AvatarFallback className="w-full h-full rounded-none bg-gradient-to-br from-purple-600 to-blue-600 text-white text-2xl flex items-center justify-center">
                              {dealer.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1">
                          <span className="text-yellow-400 font-bold text-sm">#{index + 1}</span>
                        </div>
                        <div className="absolute top-2 right-2">
                          <button
                            onClick={() => handleRemoveFromCarousel(dealer.id)}
                            className="bg-red-500/80 hover:bg-red-500 rounded-full p-1 transition-all"
                            title="Remove from carousel"
                          >
                            <span className="text-white text-xs">✕</span>
                          </button>
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="font-bold text-white truncate">{dealer.name}</h3>
                        <div className="flex items-center justify-between mt-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            dealer.isActive 
                              ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                              : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                          }`}>
                            {dealer.isActive ? "Active" : "Draft"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Add to Carousel Slots */}
                {carouselDealers.length < 17 && (
                  <div className="bg-gray-800/30 border-2 border-dashed border-gray-600 rounded-xl aspect-[4/5] flex items-center justify-center hover:border-yellow-400/50 transition-all">
                    <div className="text-center text-gray-500">
                      <div className="text-3xl mb-2">+</div>
                      <div className="text-sm">Add Dealer</div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleSaveCarouselOrder}
                  className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 rounded-xl font-semibold text-black transition-all transform hover:scale-105 shadow-lg"
                >
                  Save Carousel Order
                </button>
              </div>
            </div>
          </div>
        )}

        {/* All Dealers Section */}
        {viewMode === "grid" && (
          <div className="mb-12">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-amber-300">Alle Dealers</h2>
                
                {/* Search and Filter Bar */}
                <div className="flex items-center space-x-4">
                  <input
                    type="text"
                    placeholder="Zoek dealers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  >
                    <option value="all">Alle Status</option>
                    <option value="active">Actief</option>
                    <option value="draft">Concept</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredDealers.map((dealer) => (
                  <div 
                    key={dealer.id}
                    className={`group relative bg-gray-800/60 backdrop-blur-sm border border-gray-600/50 hover:border-yellow-400/50 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${isDataLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => handleDealerClick(dealer.id)}
                  >
                    <div className="relative">
                      <div className="aspect-[4/5]">
                        <Avatar className="w-full h-full rounded-none bg-slate-900">
                          <AvatarImage 
                            src={getValidImageUrl(dealer.avatarUrl, 'AVATAR')}
                            alt={dealer.name}
                            className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-300"
                          />
                          <AvatarFallback className="w-full h-full rounded-none bg-gradient-to-br from-purple-600 to-blue-600 text-white text-3xl flex items-center justify-center">
                            {dealer.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      
                      {/* Status Badge */}
                      <div className="absolute top-3 right-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm ${
                          dealer.isActive 
                            ? "bg-green-500/80 text-green-100 border border-green-400/50" 
                            : "bg-orange-500/80 text-orange-100 border border-orange-400/50"
                        }`}>
                          {dealer.isActive ? "ACTIEF" : "CONCEPT"}
                        </span>
                      </div>

                      {/* Carousel Status */}
                      {carouselDealerIds.includes(dealer.id) && (
                        <div className="absolute top-3 left-3">
                          <span className="px-2 py-1 bg-yellow-500/90 text-black text-xs font-bold rounded-full">
                            ★ CAROUSEL
                          </span>
                        </div>
                      )}

                      {/* Outfit Stages Preview */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                        <div className="flex justify-center space-x-1">
                          {dealer.outfitStages?.slice(0, 6).map((stage, index) => (
                            <div 
                              key={index}
                              className={`w-2 h-2 rounded-full ${
                                stage.imageUrl ? 'bg-green-400' : 'bg-gray-500'
                              }`}
                              title={stage.stageName}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Add to Carousel Button */}
                      {!carouselDealerIds.includes(dealer.id) && carouselDealers.length < 17 && (
                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCarousel(dealer);
                            }}
                            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-lg transition-colors"
                          >
                            + Carousel
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-white truncate mb-2">{dealer.name}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">{dealer.id}</span>
                        <div className="flex items-center space-x-1">
                          {dealer.outfitStages?.filter(stage => stage.imageUrl).length || 0}
                          <span className="text-xs text-gray-500">/6 outfits</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Total Dealers */}
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-2xl p-6 border border-yellow-500/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-yellow-400">{dealers.length}</div>
                <div className="text-sm text-gray-300 font-medium">Totaal Dealers</div>
              </div>
              <div className="text-4xl text-yellow-400/50">👥</div>
            </div>
            <div className="mt-4 text-xs text-gray-400">
              Alle dealers in het systeem
            </div>
          </div>

          {/* Active Dealers */}
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-green-400">
                  {dealers.filter(d => d.isActive).length}
                </div>
                <div className="text-sm text-gray-300 font-medium">Actieve Dealers</div>
              </div>
              <div className="text-4xl text-green-400/50">✅</div>
            </div>
            <div className="mt-4 text-xs text-gray-400">
              Zichtbaar voor spelers
            </div>
          </div>

          {/* Carousel Dealers */}
          <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-purple-400">
                  {carouselDealers.length}
                </div>
                <div className="text-sm text-gray-300 font-medium">Carousel Dealers</div>
              </div>
              <div className="text-4xl text-purple-400/50">🎠</div>
            </div>
            <div className="mt-4 text-xs text-gray-400">
              In hoofdcarrousel (max 17)
            </div>
          </div>

          {/* Complete Outfits */}
          <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-blue-400">
                  {dealers.filter(d => d.outfitStages?.filter(stage => stage.imageUrl).length === 6).length}
                </div>
                <div className="text-sm text-gray-300 font-medium">Complete Outfits</div>
              </div>
              <div className="text-4xl text-blue-400/50">👗</div>
            </div>
            <div className="mt-4 text-xs text-gray-400">
              Alle 6 outfits compleet
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealerManagementPage; 