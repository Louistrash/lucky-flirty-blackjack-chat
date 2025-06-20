import React, { useState, useEffect } from "react";
import { DealerData, OutfitStageData, uploadImageWithUserFeedback, deleteImageByUrl } from "../utils/adminDealerManager";
import { generateRandomName } from "../utils/nameGenerator";
import { formatFileSize, estimateBase64Size, isBase64DataUrl, optimizeImageForForm } from "../utils/localImageStorage";
import { generateDealerIdFromName, validateDealerForCarrousel, suggestDealerName } from "../utils/dealerUtils";
import ImageUploadField from "./ImageUploadField";

interface DealerFormProps {
  initialData?: DealerData | null;
  onSubmit: (dealerData: DealerData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const defaultOutfitStages: OutfitStageData[] = [
  { stageName: "Professional (Casino)", imageUrl: "", personalityPrompt: "" },
  { stageName: "Dinner / Cocktail", imageUrl: "", personalityPrompt: "" },
  { stageName: "Casual Lounge", imageUrl: "", personalityPrompt: "" },
  { stageName: "Sport / Relaxed", imageUrl: "", personalityPrompt: "" },
  { stageName: "Swimwear", imageUrl: "", personalityPrompt: "" }, // E.g. shorts or classy swimsuit
  { stageName: "Luxury Lingerie / Swim Bikini", imageUrl: "", personalityPrompt: "" },
];

const DealerForm: React.FC<DealerFormProps> = ({ initialData, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState<Omit<DealerData, 'createdAt' | 'updatedAt'>>(() => {
    if (initialData) {
      // Ensure outfitStages has all 6 stages, even if some are empty from DB
      const stages = defaultOutfitStages.map((defaultStage, index) => ({
        ...defaultStage,
        ...(initialData.outfitStages?.[index] || {}),
      }));
      return { ...initialData, outfitStages: stages, bio: initialData.bio || "" };
    }
    return {
      id: "",
      name: "",
      avatarUrl: "",
      isActive: true,
      bio: "",
      outfitStages: [...defaultOutfitStages.map(stage => ({...stage}))], // Deep copy
      gameStats: { totalGamesPlayed: 0, playerWinRateAgainst: 0 },
    };
  });

  // State voor file inputs en previews
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [outfitFiles, setOutfitFiles] = useState<(File | null)[]>(new Array(defaultOutfitStages.length).fill(null));
  const [outfitPreviews, setOutfitPreviews] = useState<(string | null)[]>(new Array(defaultOutfitStages.length).fill(null));
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [storageMethod, setStorageMethod] = useState<'firebase' | 'local' | null>(null);
  const [validationMessage, setValidationMessage] = useState<string>("");
  const [isValidForCarrousel, setIsValidForCarrousel] = useState<boolean>(false);

  useEffect(() => {
    if (initialData) {
      const stages = defaultOutfitStages.map((defaultStage, index) => ({
        ...defaultStage,
        ...(initialData.outfitStages?.[index] || {}),
      }));
      setFormData({ 
        ...initialData, 
        outfitStages: stages,
        bio: initialData.bio || "",
      });
      setAvatarPreview(initialData.avatarUrl || null); // Set initial avatar preview
      const initialOutfitPreviews = stages.map(stage => stage.imageUrl || null);
      setOutfitPreviews(initialOutfitPreviews); // Set initial outfit previews
    } else {
      // Reset voor nieuw formulier
      setFormData({
        id: "",
        name: "",
        avatarUrl: "",
        isActive: true,
        bio: "",
        outfitStages: [...defaultOutfitStages.map(stage => ({...stage}))],
        gameStats: { totalGamesPlayed: 0, playerWinRateAgainst: 0 },
      });
      setAvatarFile(null);
      setAvatarPreview(null);
      setOutfitFiles(new Array(defaultOutfitStages.length).fill(null));
      setOutfitPreviews(new Array(defaultOutfitStages.length).fill(null));
    }
  }, [initialData]);

  // Effect to validate dealer for carrousel whenever relevant data changes
  useEffect(() => {
    const validation = validateDealerForCarrousel(formData);
    setIsValidForCarrousel(validation.isValid);
    setValidationMessage(validation.message);
  }, [formData.name, formData.id, formData.avatarUrl, formData.outfitStages]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox" && e.target instanceof HTMLInputElement) {
        setFormData(prev => ({ ...prev, [name]: e.target.checked }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Auto-generate dealer ID when name changes (only for new dealers)
        if (name === 'name' && !initialData && value.trim()) {
          const autoId = generateDealerIdFromName(value);
          setFormData(prev => ({ ...prev, id: autoId }));
        }
    }
  };

  const handleOutfitChange = (index: number, field: keyof OutfitStageData, value: string) => {
    setFormData(prev => {
      const newOutfitStages = [...prev.outfitStages];
      newOutfitStages[index] = { ...newOutfitStages[index], [field]: value };
      return { ...prev, outfitStages: newOutfitStages };
    });
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setAvatarFile(null);
      setAvatarPreview(initialData?.avatarUrl || null); // Terug naar origineel of geen preview
    }
  };

  const handleOutfitFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setOutfitFiles(prev => {
        const newFiles = [...prev];
        newFiles[index] = file;
        return newFiles;
      });
      const reader = new FileReader();
      reader.onloadend = () => {
        setOutfitPreviews(prev => {
          const newPreviews = [...prev];
          newPreviews[index] = reader.result as string;
          return newPreviews;
        });
      };
      reader.readAsDataURL(file);
    } else {
      setOutfitFiles(prev => {
        const newFiles = [...prev];
        newFiles[index] = null;
        return newFiles;
      });
      setOutfitPreviews(prev => {
        const newPreviews = [...prev];
        // Terug naar origineel of geen preview
        newPreviews[index] = initialData?.outfitStages?.[index]?.imageUrl || null;
        return newPreviews;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.name) {
      alert("Dealer ID and Name are required.");
      return;
    }

    // Validate for carrousel before submitting
    const validation = validateDealerForCarrousel(formData);
    if (!validation.isValid) {
      alert(`Cannot save dealer: ${validation.message}`);
      return;
    }

    setUploadStatus("Saving dealer...");
    
    try {
      await onSubmit(formData as DealerData);
      setUploadStatus("Successfully saved!");
      
      // Show storage method info to user
      if (storageMethod === 'local') {
        alert("Dealer successfully saved! Images are compressed for optimal performance.");
      }
      
    } catch (error) {
      console.error("Failed to save dealer:", error);
      setUploadStatus("");
      throw error; // Let parent handle the error
    }
  };

  // Handle avatar image change
  const handleAvatarChange = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, avatarUrl: imageUrl }));
  };

  // Handle outfit image change
  const handleOutfitImageChange = (index: number) => (imageUrl: string) => {
    setFormData(prev => {
      const newOutfitStages = [...prev.outfitStages];
      newOutfitStages[index] = { ...newOutfitStages[index], imageUrl };
      return { ...prev, outfitStages: newOutfitStages };
    });
  };

  const handleGenerateName = () => {
    const newName = generateRandomName('full');
    setFormData(prev => ({ 
      ...prev, 
      name: newName,
      // Auto-generate ID for new dealers
      id: !initialData ? generateDealerIdFromName(newName) : prev.id
    }));
  };

  const handleSuggestName = () => {
    const suggestedName = suggestDealerName();
    setFormData(prev => ({ 
      ...prev, 
      name: suggestedName,
      // Auto-generate ID for new dealers
      id: !initialData ? generateDealerIdFromName(suggestedName) : prev.id
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Header Section */}
          <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700/50">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-2">
                {initialData ? "Dealer Bewerken" : "Nieuwe Dealer Toevoegen"}
              </h2>
              <p className="text-gray-300">
                {initialData ? "Pas de dealer informatie en outfit stages aan" : "Maak een nieuwe dealer met alle outfit stages"}
              </p>
            </div>

            {/* Upload Status Display */}
            {uploadStatus && (
              <div className="bg-blue-600/20 border border-blue-400/50 rounded-lg p-3 mb-4">
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-blue-400 font-medium">{uploadStatus}</span>
                </div>
              </div>
            )}

            {/* Storage Method Info */}
            <div className="bg-blue-800/20 border border-blue-400/30 rounded-lg p-3 mb-6">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-blue-300 text-sm font-medium">💾 Opslag: {storageMethod === 'local' ? 'Lokaal (gecomprimeerd)' : 'Firebase Storage'}</p>
                  <p className="text-blue-400 text-xs mt-1">
                    {storageMethod === 'local' 
                      ? "Afbeeldingen worden automatisch gecomprimeerd voor optimale prestaties"
                      : "Afbeeldingen worden opgeslagen in Firebase Storage"
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Carrousel Validation Status */}
            <div className={`rounded-lg p-3 mb-6 ${isValidForCarrousel ? 'bg-green-600/20 border border-green-400/50' : 'bg-orange-600/20 border border-orange-400/50'}`}>
              <div className="flex items-center">
                <svg className={`h-5 w-5 mr-2 ${isValidForCarrousel ? 'text-green-400' : 'text-orange-400'}`} fill="currentColor" viewBox="0 0 20 20">
                  {isValidForCarrousel ? (
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  )}
                </svg>
                <span className={`text-sm ${isValidForCarrousel ? 'text-green-400' : 'text-orange-400'}`}>
                  <strong>Carousel Status:</strong> {validationMessage}
                </span>
              </div>
            </div>

            {/* Basic Dealer Info - Full Width */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Dealer Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">Dealer Name</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 p-3"
                    required
                  />
                  <button type="button" onClick={handleGenerateName} className="p-3 bg-gray-600 hover:bg-gray-500 rounded-md text-xs whitespace-nowrap" title="Generate Random Name">
                    Gen
                  </button>
                  <button type="button" onClick={handleSuggestName} className="p-3 bg-gray-600 hover:bg-gray-500 rounded-md text-xs whitespace-nowrap" title="Suggest Themed Name">
                    Sug
                  </button>
                </div>
              </div>

              {/* Dealer ID */}
              <div>
                <label htmlFor="id" className="block text-sm font-medium text-gray-300 mb-2">Dealer ID (Uniek)</label>
                <input
                  type="text"
                  name="id"
                  id="id"
                  value={formData.id}
                  onChange={handleChange}
                  readOnly={!!initialData}
                  className={`w-full bg-gray-700 border border-gray-600 text-white rounded-md shadow-sm p-3 ${!!initialData ? 'bg-gray-800 cursor-not-allowed' : ''}`}
                  required
                />
              </div>

              {/* Active Status */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                <div className="flex items-center h-12 px-3 bg-gray-700 border border-gray-600 rounded-md">
                  <input
                    type="checkbox"
                    name="isActive"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="h-4 w-4 text-yellow-600 border-gray-600 rounded focus:ring-yellow-500 bg-gray-700"
                  />
                  <label htmlFor="isActive" className="ml-3 block text-sm text-gray-300">Active (visible in game)</label>
                </div>
              </div>

              {/* Avatar Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Avatar Image</label>
                <ImageUploadField
                  label=""
                  currentImageUrl={formData.avatarUrl}
                  onImageChange={handleAvatarChange}
                  uploadPath={`dealers/${formData.id}/avatar`}
                  maxWidth={400}
                  maxHeight={400}
                  quality={0.7}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Bio - Full Width */}
            <div className="mt-6">
              <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-2">
                Biografie
              </label>
              <textarea
                name="bio"
                id="bio"
                value={formData.bio || ""}
                onChange={handleChange}
                rows={3}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 p-3"
                placeholder="Een korte, pakkende biografie voor de dealer."
              />
            </div>
          </div>

          {/* Outfit Stages Section - Full Width */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Outfit Stages
              </h3>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-400">
                  {formData.outfitStages.filter(stage => stage.imageUrl).length}/6 compleet
                </div>
                <div className="w-24 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(formData.outfitStages.filter(stage => stage.imageUrl).length / 6) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {formData.outfitStages.map((stage, index) => {
                const stageIcons = ["💼", "🍸", "👕", "🏃‍♂️", "🏊‍♀️", "💋"];
                const stageColors = [
                  "from-blue-500/20 to-indigo-500/20 border-blue-500/30",
                  "from-purple-500/20 to-pink-500/20 border-purple-500/30", 
                  "from-green-500/20 to-emerald-500/20 border-green-500/30",
                  "from-orange-500/20 to-red-500/20 border-orange-500/30",
                  "from-cyan-500/20 to-blue-500/20 border-cyan-500/30",
                  "from-rose-500/20 to-pink-500/20 border-rose-500/30"
                ];
                
                return (
                  <div 
                    key={index} 
                    className={`bg-gradient-to-br ${stageColors[index]} backdrop-blur-sm rounded-2xl p-6 border transition-all duration-300 hover:scale-105`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{stageIcons[index]}</span>
                        <h4 className="text-lg font-bold text-white">{stage.stageName}</h4>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${
                        stage.imageUrl ? 'bg-green-400' : 'bg-gray-500'
                      }`} />
                    </div>
                    
                    {/* Image Upload Section */}
                    <div className="mb-6">
                      <ImageUploadField
                        label=""
                        currentImageUrl={stage.imageUrl}
                        onImageChange={handleOutfitImageChange(index)}
                        uploadPath={`dealers/${formData.id}/outfits/stage_${index}`}
                        maxWidth={400}
                        maxHeight={400}
                        quality={0.6}
                        disabled={isLoading}
                        className="mb-4"
                      />
                    </div>

                    {/* Personality Prompt Section */}
                    <div>
                      <label className="block text-sm font-bold text-gray-200 mb-3">
                        🎭 Personaliteit Prompt
                      </label>
                      <textarea
                        value={stage.personalityPrompt}
                        onChange={(e) => {
                          const newStages = [...formData.outfitStages];
                          newStages[index] = { ...newStages[index], personalityPrompt: e.target.value };
                          setFormData(prev => ({ ...prev, outfitStages: newStages }));
                        }}
                        className="w-full px-4 py-3 bg-gray-800/50 backdrop-blur-sm border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all resize-none"
                        rows={4}
                        placeholder={`Beschrijf de persoonlijkheid voor ${stage.stageName.toLowerCase()}...`}
                      />
                      <div className="mt-2 text-xs text-gray-500">
                        {stage.personalityPrompt.length}/500 karakters
                      </div>
                    </div>

                    {/* Stage Progress Indicator */}
                    <div className="mt-4 pt-4 border-t border-gray-600/30">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">
                          {stage.imageUrl && stage.personalityPrompt ? 
                            "✅ Compleet" : 
                            stage.imageUrl ? "📷 Afbeelding toegevoegd" :
                            stage.personalityPrompt ? "📝 Tekst toegevoegd" : "⏳ Leeg"
                          }
                        </span>
                        <span className="text-gray-500">Stage {index + 1}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Outfit Stages Progress Summary */}
            <div className="mt-8 bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
              <h4 className="text-lg font-bold text-yellow-300 mb-4">📊 Outfit Voortgang</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {formData.outfitStages.filter(stage => stage.imageUrl && stage.personalityPrompt).length}
                  </div>
                  <div className="text-sm text-gray-400">Volledig Compleet</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {formData.outfitStages.filter(stage => stage.imageUrl).length}
                  </div>
                  <div className="text-sm text-gray-400">Met Afbeelding</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {formData.outfitStages.filter(stage => stage.personalityPrompt).length}
                  </div>
                  <div className="text-sm text-gray-400">Met Personaliteit</div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-6">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Totale voortgang</span>
                  <span>{Math.round((formData.outfitStages.filter(stage => stage.imageUrl && stage.personalityPrompt).length / 6) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(formData.outfitStages.filter(stage => stage.imageUrl && stage.personalityPrompt).length / 6) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
            <div className="flex justify-end space-x-4">
              <button 
                type="button" 
                onClick={onCancel} 
                className="px-8 py-3 border border-gray-600/50 rounded-xl font-semibold text-gray-300 hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all transform hover:scale-105"
                disabled={isLoading || !!uploadStatus}
              >
                Annuleren
              </button>
              <button 
                type="submit" 
                className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 rounded-xl font-semibold text-black focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:hover:scale-100"
                disabled={isLoading || !!uploadStatus || !formData.id || !formData.name}
              >
                {uploadStatus ? uploadStatus : (isLoading ? (initialData ? "Opslaan..." : "Toevoegen...") : (initialData ? "Wijzigingen Opslaan" : "Dealer Toevoegen"))}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DealerForm;
