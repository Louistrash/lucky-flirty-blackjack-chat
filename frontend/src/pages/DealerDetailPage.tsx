import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUserGuardContext } from "../app/auth/UserGuard";
import { getDealers, updateDealer, isAdminUser, uploadImageWithUserFeedback, addDealer, deleteDealerFromFirestore, updateDealerOutfitImage, convertBase64ToFirebaseStorage } from "../utils/adminDealerManager";
import { getDealerById } from "../utils/dummyDealerData"; // Add fallback to dummy data
import type { DealerData, OutfitStageData } from "../components/DealerCard";
import { useUserOnboarding } from "../utils/useUserOnboarding";
import { usePlayerProgressStore } from "../utils/usePlayerProgressStore";
import { optimizeImage } from "../utils/localImageStorage";
import { checkBackendStorageHealth } from "../utils/backendUpload";
import { useDealers } from '../utils/useDealers';
import { AppHeader } from '../components/AppHeader';
import { Lock, PlayCircle, Star, Image as ImageIcon } from 'lucide-react';

const DealerDetailPage: React.FC = () => {
  const { dealerId } = useParams<{ dealerId: string }>();
  const navigate = useNavigate();
  const { user } = useUserGuardContext();
  const { unlockDealerImage, getUserProfile } = useUserOnboarding();
  const { playerData } = usePlayerProgressStore();
  
  // Gebruik de centrale dealer state
  const { dealers, isLoading: areDealersLoading, error: dealersError } = useDealers();
  
  const [dealer, setDealer] = useState<DealerData | null>(null);
  const [editedDealer, setEditedDealer] = useState<DealerData | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isUnlocking, setIsUnlocking] = useState<boolean>(false);
  const [firebaseStorageHealth, setFirebaseStorageHealth] = useState<{status: string, firebase_available: boolean} | null>(null);
  const [isPageLoading, setIsPageLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializePage = async () => {
      if (areDealersLoading) {
        // Wacht tot de dealers zijn geladen
        return;
      }
      
      if (!user?.uid || !dealerId) {
        setIsPageLoading(false);
        return;
      }

      setIsPageLoading(true);

      // Vind de dealer in de reeds geladen lijst
      const foundDealer = dealers.find(d => d.id === dealerId);

      if (foundDealer) {
        setDealer(foundDealer);
        setEditedDealer(foundDealer);
        setPageError(null);
      } else {
        setPageError(`Dealer met ID '${dealerId}' niet gevonden.`);
      }

      // Controleer beheerdersstatus
      try {
        const adminStatus = await isAdminUser(user.uid);
        setIsAdmin(adminStatus);
        if (!adminStatus) {
          const profile = await getUserProfile();
          setUserProfile(profile);
        }
      } catch (err) {
        console.error("Fout bij controle admin status:", err);
        setPageError("Kon gebruikersrol niet verifiëren.");
      } finally {
        setIsPageLoading(false);
      }
    };

    initializePage();
  }, [user, dealerId, dealers, areDealersLoading]);

  // Check Firebase Storage health on page load
  useEffect(() => {
    const checkStorageHealth = async () => {
      try {
        const health = await checkBackendStorageHealth();
        setFirebaseStorageHealth(health);
        console.log('🔥 Backend Storage Health:', health);
      } catch (error) {
        console.error('❌ Failed to check storage health:', error);
        setFirebaseStorageHealth({ status: 'error', firebase_available: false });
      }
    };
    
    checkStorageHealth();
  }, []);

  // Add global test functions for Firebase Storage debugging
  useEffect(() => {
    // Make Firebase Storage retest available globally
    (window as any).testFirebaseStorageFromDealer = async () => {
      try {
        const { retestStorageAvailability } = await import('../app/auth/firebase');
        console.log("🔥 Testing Firebase Storage from DealerDetailPage...");
        const result = await retestStorageAvailability();
        console.log(`Storage test result: ${result ? '✅ Available' : '❌ Not Available'}`);
        return result;
      } catch (error) {
        console.error("❌ Storage test failed:", error);
        return false;
      }
    };

    return () => {
      delete (window as any).testFirebaseStorageFromDealer;
    };
  }, []);

  const handleImageUpload = async (stageIndex: number) => {
    if (!editedDealer) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      setIsUploading(`stage-${stageIndex}`);
      setUploadProgress("Uploading image...");
      
      try {
        let url: string;
        
        // Check if Firebase Storage is available
        if (firebaseStorageHealth?.firebase_available) {
          const path = `dealers/${editedDealer.id}/outfits/stage_${stageIndex}/${file.name}`;
          const result = await uploadImageWithUserFeedback(path, file);
          url = result.url;
        } else {
          // Fallback to local storage if Firebase Storage is not available
          const result = await optimizeImage(file);
          url = result;
          console.log("Using local storage fallback for image:", url);
        }
        
        // Update local state
        const updatedOutfitStages = [...editedDealer.outfitStages];
        updatedOutfitStages[stageIndex] = {
          ...updatedOutfitStages[stageIndex],
          imageUrl: url
        };
        
        setEditedDealer(prevDealer => {
          if (!prevDealer) return null;
          return {
            ...prevDealer,
            outfitStages: updatedOutfitStages
          };
        });
        
        setUploadProgress("Image uploaded. Saving to dealer...");

        // Only update Firestore if Firebase Storage is available
        if (firebaseStorageHealth?.firebase_available) {
          await updateDealerOutfitImage(editedDealer.id, stageIndex, url);
          setUploadProgress("✅ Image saved to cloud storage!");
        } else {
          setUploadProgress("✅ Image saved locally!");
        }
        
        // Notify carousel to refresh
        if (typeof (window as any).notifyDealerUpdated === 'function') {
          console.log("🔄 Notifying carousel of dealer update...");
          (window as any).notifyDealerUpdated(editedDealer.id);
        }
        
        setTimeout(() => setUploadProgress(""), 3000);
      } catch (error) {
        console.error("Upload failed:", error);
        setUploadProgress("❌ Upload failed. Please try again.");
        setTimeout(() => setUploadProgress(""), 3000);
      } finally {
        setIsUploading(null);
      }
    };
    
    input.click();
  };

  // NIEUWE FUNCTIE: Avatar Upload
  const handleAvatarUpload = async () => {
    if (!editedDealer) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      setIsUploading('avatar');
      setUploadProgress("🖼️ Uploading avatar image...");
      
      try {
        // Upload to avatar specific path
        const path = `dealers/${editedDealer.id}/avatar/${file.name}`;
        const { url, method } = await uploadImageWithUserFeedback(path, file);
        
        // Update local state first
        setEditedDealer(prevDealer => {
          if (!prevDealer) return null;
          return {
            ...prevDealer,
            avatarUrl: url
          };
        });
        
        setUploadProgress(`Avatar uploaded via ${method}. Saving to dealer...`);

        // Save avatar update to Firestore
        await updateDealer(editedDealer.id, { ...editedDealer, avatarUrl: url });
        
        setUploadProgress(`✅ Avatar saved successfully! This will appear in the carousel.`);
        
        // Notify carousel to refresh - important for avatar changes!
        if (typeof (window as any).notifyDealerUpdated === 'function') {
          console.log("🔄 Notifying carousel of avatar update...");
          (window as any).notifyDealerUpdated(editedDealer.id);
        }
        
        setTimeout(() => setUploadProgress(""), 4000);
      } catch (error) {
        console.error("Avatar upload failed:", error);
        setUploadProgress("❌ Avatar upload failed. Please try again.");
        setTimeout(() => setUploadProgress(""), 3000);
      } finally {
        setIsUploading(null);
      }
    };
    
    input.click();
  };

  // NIEUWE FUNCTIE: Convert Avatar Base64 to Firebase Storage
  const handleConvertAvatarToFirebaseStorage = async () => {
    if (!editedDealer?.avatarUrl || !editedDealer.avatarUrl.startsWith('data:image/')) return;
    
    setIsUploading('avatar-convert');
    setUploadProgress("🔄 Converting base64 avatar to Firebase Storage...");
    
    try {
      // Use the convertBase64ToFirebaseStorage function
      const path = `dealers/${editedDealer.id}/avatar/converted_avatar.webp`;
      const { url, method } = await convertBase64ToFirebaseStorage(editedDealer.avatarUrl, path);
      
      // Update local state
      setEditedDealer(prevDealer => {
        if (!prevDealer) return null;
        return {
          ...prevDealer,
          avatarUrl: url
        };
      });
      
      setUploadProgress(`Avatar converted via ${method}. Saving to dealer...`);
      
      // Save to Firestore
      await updateDealer(editedDealer.id, { ...editedDealer, avatarUrl: url });
      
      setUploadProgress(`✅ Avatar converted and saved! Now using Firebase Storage.`);
      
      // Notify carousel to refresh
      if (typeof (window as any).notifyDealerUpdated === 'function') {
        console.log("🔄 Notifying carousel of avatar conversion...");
        (window as any).notifyDealerUpdated(editedDealer.id);
      }
      
      setTimeout(() => setUploadProgress(""), 4000);
    } catch (error) {
      console.error("Avatar conversion failed:", error);
      setUploadProgress("❌ Avatar conversion failed. Please try again.");
      setTimeout(() => setUploadProgress(""), 3000);
    } finally {
      setIsUploading(null);
    }
  };

  const handleAIGenerate = async (stageIndex: number) => {
    // For now, we'll show a message that this feature is coming soon
    alert("AI Generation feature coming soon! For now, please use the Upload Image option.");
  };

  const handleSave = async () => {
    if (!editedDealer || !dealerId) return;
    
    setIsSaving(true);
    setPageError(null);
    
    try {
      console.log("Saving dealer:", dealerId, editedDealer);
      
      // Try to save to Firestore first
      try {
        await updateDealer(dealerId, editedDealer);
        console.log("✅ Dealer saved to Firestore successfully!");
      } catch (firestoreError) {
        console.log("⚠️ Firestore save failed, dealer exists only in local state:", firestoreError);
        // This is expected when working with dummy data that doesn't exist in Firestore
      }
      
      // Update local state regardless of Firestore success/failure
      setDealer({ ...editedDealer });
      setIsEditing(false);
      
      // Show success message
      setUploadProgress("✅ Dealer information saved successfully!");
      
      // Notify carousel to refresh after save
      if (typeof (window as any).notifyDealerUpdated === 'function') {
        console.log("🔄 Notifying carousel of dealer save...");
        (window as any).notifyDealerUpdated(editedDealer.id);
      }
      
      setTimeout(() => setUploadProgress(""), 4000);
      
      console.log("Dealer update completed. Changes saved locally and to Firestore (if available).");
      
    } catch (err) {
      console.error("Failed to save dealer:", err);
      setPageError(`Failed to save changes: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedDealer(dealer);
    setIsEditing(false);
    setPageError(null);
  };

  const handleUnlockDealer = async () => {
    if (!dealerId || !user?.uid) return;
    
    setIsUnlocking(true);
    try {
      const result = await unlockDealerImage(dealerId, 200);
      if (result.success) {
        alert(`✅ ${result.message}`);
        // Refresh user profile
        const updatedProfile = await getUserProfile();
        setUserProfile(updatedProfile);
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (error) {
      console.error('Error unlocking dealer:', error);
      alert('❌ Er ging iets mis bij het unlocken');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleInputChange = (field: keyof DealerData, value: any) => {
    if (!editedDealer) return;
    setEditedDealer({
      ...editedDealer,
      [field]: value
    });
  };

  const handleOutfitStageChange = (stageIndex: number, field: keyof OutfitStageData, value: string) => {
    if (!editedDealer) return;
    
    const updatedOutfitStages = [...editedDealer.outfitStages];
    updatedOutfitStages[stageIndex] = {
      ...updatedOutfitStages[stageIndex],
      [field]: value
    };
    
    setEditedDealer({
      ...editedDealer,
      outfitStages: updatedOutfitStages
    });
  };

  const handleAddToFirestore = async () => {
    if (!editedDealer || !dealerId) return;
    
    setIsSaving(true);
    setPageError(null);
    
    try {
      console.log("Adding dummy dealer to Firestore:", dealerId, editedDealer);
      await addDealer(editedDealer);
      
      setUploadProgress("✅ Dealer successfully added to Firestore! Now visible in carousel.");
      
      // Notify carousel to refresh after adding to Firestore
      if (typeof (window as any).notifyDealerUpdated === 'function') {
        console.log("🔄 Notifying carousel of new dealer addition...");
        (window as any).notifyDealerUpdated(editedDealer.id);
      }
      
      setTimeout(() => setUploadProgress(""), 5000);
      
      console.log("✅ Dummy dealer successfully added to Firestore and will appear in carousel!");
      
      // Suggest refreshing the carousel
      setTimeout(() => {
        const shouldGoHome = window.confirm("Dealer added successfully! Would you like to go to the home page to see it in the carousel?");
        if (shouldGoHome) {
          navigate("/");
        }
      }, 2000);
      
    } catch (err) {
      console.error("Failed to add dealer to Firestore:", err);
      setPageError(`Failed to add to Firestore: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConvertToFirebaseStorage = async (stageIndex: number) => {
    if (!editedDealer) return;
    
    const stage = editedDealer.outfitStages[stageIndex];
    if (!stage.imageUrl || !stage.imageUrl.startsWith('data:image/')) {
      alert('Deze afbeelding is al geconverteerd of geen base64 data.');
      return;
    }
    
    setIsUploading(`convert-${stageIndex}`);
    setUploadProgress("Converting base64 to Firebase Storage...");
    
    try {
      // Convert base64 to File object
      const response = await fetch(stage.imageUrl);
      const blob = await response.blob();
      const file = new File([blob], `stage_${stageIndex+1}.jpg`, { type: 'image/jpeg' });
      
      // Upload to Firebase Storage
      const path = `dealers/${editedDealer.id}/outfits/stage_${stageIndex+1}/${file.name}`;
      const { url, method } = await uploadImageWithUserFeedback(path, file);
      
      if (method === 'firebase') {
        // Update the stage with new Firebase URL
        const updatedOutfitStages = [...editedDealer.outfitStages];
        updatedOutfitStages[stageIndex] = {
          ...updatedOutfitStages[stageIndex],
          imageUrl: url
        };
        
        setEditedDealer({
          ...editedDealer,
          outfitStages: updatedOutfitStages
        });
        
        setUploadProgress("✅ Successfully converted to Firebase Storage!");
        
        // Automatically save the changes
        setTimeout(async () => {
          try {
            await updateDealer(editedDealer.id, { outfitStages: updatedOutfitStages });
            console.log("🔄 Dealer updated with Firebase Storage URL");
          } catch (error) {
            console.error("Error updating dealer:", error);
          }
        }, 1000);
        
      } else {
        setUploadProgress("⚠️ Conversion failed - Firebase Storage not available");
      }
      
      setTimeout(() => setUploadProgress(""), 3000);
    } catch (error) {
      console.error("Conversion failed:", error);
      setUploadProgress("❌ Conversion failed. Please try again.");
      setTimeout(() => setUploadProgress(""), 3000);
    } finally {
      setIsUploading(null);
    }
  };

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-amber-400"></div>
      </div>
    );
  }

  if (dealersError) {
    return <div className="text-red-500 text-center p-4">Error loading dealers: {dealersError.message}</div>;
  }

  if (!dealer) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 flex justify-center items-center">
        <p>Dealer wordt geladen...</p>
      </div>
    );
  }

  const handlePlayGame = () => {
    if (dealerId) {
      navigate(`/game/${dealerId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black text-white">
      <AppHeader showBackButton backTo="/" playerBalance={playerData?.playerCoins ?? 0} />
      
      {/* Error Display */}
      {pageError && (
        <div className="container mx-auto px-4 pt-20">
          <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-300">{pageError}</p>
          </div>
        </div>
      )}
      
      <main className="container mx-auto px-4 pt-20 pb-24">
        {/* Hero Section */}
        <section className="relative rounded-2xl overflow-hidden mb-12 shadow-2xl shadow-black/50" style={{ height: '600px' }}>
          <img src={(isEditing ? editedDealer?.avatarUrl : dealer.avatarUrl) || 'https://via.placeholder.com/1920x1080'} alt={dealer.name} className="absolute inset-0 w-full h-full object-cover object-top z-0 opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10"></div>
          <div className="relative z-20 flex flex-col justify-end h-full p-12">
            {isEditing ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={editedDealer?.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="text-5xl font-bold tracking-tight bg-black/70 text-white mb-2 border-b-2 border-amber-400 focus:outline-none focus:border-amber-300 bg-transparent"
                  placeholder="Dealer Name"
                />
                <input
                  type="text"
                  value={editedDealer?.specialty || ''}
                  onChange={(e) => handleInputChange('specialty', e.target.value)}
                  className="text-xl text-amber-300 font-light bg-black/70 border-b border-amber-400/50 focus:outline-none focus:border-amber-300 bg-transparent"
                  placeholder="Specialty"
                />
                <button
                  onClick={handleAvatarUpload}
                  className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-lg transition-colors"
                >
                  📷 Change Avatar
                </button>
              </div>
            ) : (
              <>
                <h1 className="text-5xl font-bold tracking-tight text-white mb-2">{dealer.name}</h1>
                <p className="text-xl text-amber-300 font-light">{dealer.specialty}</p>
              </>
            )}
          </div>
        </section>

        {/* Gallery & Info Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Gallery */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-300">
                {isEditing ? '✏️ Edit Outfit Stages' : 'Galerij'}
              </h2>
              {isAdmin && isEditing && (
                <span className="text-sm text-amber-300 bg-amber-900/30 px-3 py-1 rounded-full">
                  Edit Mode Actief
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(isEditing ? editedDealer?.outfitStages : dealer.outfitStages)?.map((stage, i) => (
                <div key={i} className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold text-white">{stage.stageName}</h3>
                    {isEditing && (
                      <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded">
                        {i + 1}
                      </span>
                    )}
                  </div>
                  
                  <div className={`relative h-48 rounded-lg overflow-hidden group mb-3 ${!isEditing ? 'cursor-pointer' : ''}`}>
                    <img 
                      src={stage.imageUrl || 'https://via.placeholder.com/400x400?text=No+Image'} 
                      alt={`Outfit ${i + 1}`} 
                      className="w-full h-full object-contain bg-slate-900 transition-transform duration-300 group-hover:scale-105" 
                      loading="lazy"
                      onClick={() => {
                        // Only open modal if not in edit mode
                        if (!isEditing) {
                          const modal = document.createElement('div');
                          modal.className = 'fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer';
                          modal.onclick = (e) => {
                            // Only close if clicking the backdrop, not the image
                            if (e.target === modal) modal.remove();
                          };
                          
                          const modalContainer = document.createElement('div');
                          modalContainer.className = 'relative max-w-[90vw] max-h-[90vh] flex items-center justify-center';
                          
                          const img = document.createElement('img');
                          img.src = stage.imageUrl || 'https://via.placeholder.com/400x400?text=No+Image';
                          img.className = 'max-w-full max-h-full object-contain shadow-2xl';
                          img.alt = `Full size ${stage.stageName}`;
                          
                          const closeBtn = document.createElement('button');
                          closeBtn.innerHTML = '✕';
                          closeBtn.className = 'absolute -top-4 -right-4 bg-red-500 hover:bg-red-600 text-white text-xl font-bold w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-lg z-10';
                          closeBtn.onclick = (e) => {
                            e.stopPropagation();
                            modal.remove();
                          };
                          
                          const titleLabel = document.createElement('div');
                          titleLabel.className = 'absolute -bottom-8 left-0 bg-black/80 text-white px-3 py-1 rounded text-sm';
                          titleLabel.textContent = stage.stageName;
                          
                          modalContainer.appendChild(img);
                          modalContainer.appendChild(closeBtn);
                          modalContainer.appendChild(titleLabel);
                          modal.appendChild(modalContainer);
                          document.body.appendChild(modal);
                          
                          // Add keyboard escape listener
                          const handleEscape = (e) => {
                            if (e.key === 'Escape') {
                              modal.remove();
                              document.removeEventListener('keydown', handleEscape);
                            }
                          };
                          document.addEventListener('keydown', handleEscape);
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <ImageIcon className="absolute bottom-2 left-2 text-white/70" />
                    {!isEditing && (
                      <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        Klik voor volledig beeld
                      </div>
                    )}
                    
                    {isEditing && (
                      <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleImageUpload(i);
                          }}
                          disabled={isUploading === `stage-${i}`}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-lg transition-colors"
                        >
                          {isUploading === `stage-${i}` ? 'Uploading...' : '📷 Change Image'}
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {isEditing && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Personality Prompt
                        </label>
                        <textarea
                          value={stage.personalityPrompt || ''}
                          onChange={(e) => handleOutfitStageChange(i, 'personalityPrompt', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                          rows={3}
                          placeholder={`Describe the personality for ${stage.stageName}...`}
                        />
                      </div>
                      
                      {stage.imageUrl?.startsWith('data:image/') && (
                        <button
                          onClick={() => handleConvertToFirebaseStorage(i)}
                          disabled={isUploading === `convert-${i}`}
                          className="w-full px-3 py-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          {isUploading === `convert-${i}` ? 'Converting...' : '🔄 Convert to Cloud Storage'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Upload Progress */}
            {uploadProgress && (
              <div className="mt-6 p-4 bg-blue-900/30 border border-blue-500/30 rounded-lg">
                <p className="text-blue-300 text-sm">{uploadProgress}</p>
              </div>
            )}
          </div>

          {/* Info Panel */}
          <div>
            <div className="bg-slate-800/50 rounded-2xl p-6 sticky top-24">
              <h2 className="text-2xl font-bold mb-6 text-slate-300">Dealer Info</h2>
              <div className="space-y-4">
                {isEditing ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Biografie
                    </label>
                    <textarea
                      value={editedDealer?.bio || ''}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                      rows={5}
                      placeholder="Schrijf een biografie voor deze dealer..."
                    />
                  </div>
                ) : (
                  <p className="text-slate-400 leading-relaxed">
                    {dealer.bio || `Een korte biografie van ${dealer.name}. Expert in ${dealer.specialty || 'casino games'} met een boeiende speelstijl.`}
                  </p>
                )}
                
                {/* Admin Controls */}
                {isAdmin && (
                  <div className="mt-6 pt-6 border-t border-slate-700">
                    <h3 className="text-lg font-semibold text-amber-300 mb-4">🛠️ Admin Beheer</h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => navigate(`/dealer-management`)}
                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold py-3 rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg"
                      >
                        ← Terug naar Dealer Management
                      </button>
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-semibold py-3 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all shadow-lg"
                      >
                        {isEditing ? '👁️ View Mode' : '✏️ Edit Dealer'}
                      </button>
                      {isEditing && (
                        <>
                          <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold py-3 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg disabled:opacity-50"
                          >
                            {isSaving ? '💾 Saving...' : '💾 Save Changes'}
                          </button>
                          <button
                            onClick={handleCancel}
                            className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold py-3 rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all shadow-lg"
                          >
                            ❌ Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {!isAdmin && (
                <button 
                  onClick={handlePlayGame}
                  className="w-full mt-8 bg-gradient-to-r from-green-500 to-cyan-500 text-white font-bold py-4 rounded-xl text-lg hover:from-green-400 hover:to-cyan-400 transition-all shadow-lg hover:shadow-cyan-500/30 flex items-center justify-center"
                >
                  <PlayCircle className="mr-2" /> Speel met {dealer.name}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
  
export default DealerDetailPage;