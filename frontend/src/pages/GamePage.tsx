import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, createDeck, shuffleDeck, calculateScore } from "../utils/blackjackLogic";
import { useCurrentUser } from "app";
import { getDealer, type DealerData } from "../utils/adminDealerManager"; // Firebase dealer functie en type
import { usePlayerProgressStore, PlayerData } from "../utils/usePlayerProgressStore";
import { OutfitStage } from "../utils/dealerData";
import DealerProgressionDisplay from "../components/DealerProgressionDisplay";
import SwipeableOutfitPreview from "../components/SwipeableOutfitPreview";
import casinoPattern from '/casino-pattern.png'; // Import casino pattern
import { AppHeader } from '../components/AppHeader';

type GamePhase = "CARDS_DEALT" | "BETTING" | "PLAYER_TURN" | "DEALER_TURN" | "GAME_OVER";

// Extended DealerData type voor compatibility met SwipeableOutfitPreview
interface ExtendedDealerData extends DealerData {
  experience?: string;
  winRate?: string;
  title?: string; // Voeg title toe voor de subtitel
}

// Update de SwipeableOutfitPreview interface
interface SwipeableOutfitPreviewProps {
  dealer: ExtendedDealerData;
  currentOutfitStage: number;
  onOutfitChange: (newStage: number) => Promise<void>;
  onTeaserClick: () => void;
  showOutfitPreview: boolean;
  unlockedOutfits: number[];
}

const GamePage = () => {
  const { dealerId } = useParams<{ dealerId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useCurrentUser();
  const { 
    subscribeToPlayerProgress, 
    playerData, 
    isLoading: playerProgressLoading, 
    error: playerProgressError, 
    recordWinForProgression,
    updatePlayerCoins
  } = usePlayerProgressStore();

  // Game State
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [dealerScore, setDealerScore] = useState<number>(0);
  const playerBalance = playerData?.playerCoins ?? 0;
  const [currentBet, setCurrentBet] = useState<number>(0);
  const [gamePhase, setGamePhase] = useState<GamePhase>("CARDS_DEALT");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showChatStarters, setShowChatStarters] = useState(false);
  const [unlockedOutfits, setUnlockedOutfits] = useState<number[]>([0]); // First outfit always unlocked
  const [showUnlockPrompt, setShowUnlockPrompt] = useState<boolean>(false);
  const [pendingUnlockStage, setPendingUnlockStage] = useState<number | null>(null);
  const [isLoadingAIResponse, setIsLoadingAIResponse] = useState<boolean>(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [hasAutoDealt, setHasAutoDealt] = useState<boolean>(false);
  const [gameActionInProgress, setGameActionInProgress] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Dealer State
  const [dealer, setDealer] = useState<ExtendedDealerData | null>(null);
  const [currentOutfitStage, setCurrentOutfitStage] = useState<number>(0);
  const [showOutfitPreview, setShowOutfitPreview] = useState<boolean>(false);

  // Chat State
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    text: string;
    sender: 'player' | 'dealer' | 'thinking';
    timestamp: Date;
  }>>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [showEmoticonsPopup, setShowEmoticonsPopup] = useState<boolean>(false);
  const [showStartersPopup, setShowStartersPopup] = useState<boolean>(false);
  const [showGameHelpPopup, setShowGameHelpPopup] = useState(false);

  // Helper to update hand and score
  const setHand = (hand: Card[], setHandState: React.Dispatch<React.SetStateAction<Card[]>>, setScoreState: React.Dispatch<React.SetStateAction<number>>) => {
    setHandState(hand);
    setScoreState(calculateScore(hand));
  };

  // Helper to add chat message
  const addChatMessage = (text: string, sender: 'player' | 'dealer' | 'thinking') => {
    const newMessage = {
      id: `${Date.now()}-${Math.random()}`,
      text,
      sender,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, newMessage]);
  };

  // Effect to subscribe to player progress when currentUser is available
  useEffect(() => {
    if (currentUser && currentUser.uid) {
      console.log(`[GamePage] Subscribing to player progress for user: ${currentUser.uid}`);
      const unsubscribe = subscribeToPlayerProgress(currentUser.uid);
      return () => {
        console.log(`[GamePage] Unsubscribing from player progress for user: ${currentUser.uid}`);
        unsubscribe();
      };
    }
  }, [currentUser, subscribeToPlayerProgress]);

  useEffect(() => {
    setDeck(shuffleDeck(createDeck()));
    
    if (dealerId) {
      // Gebruik Firebase functie om dealer data te halen
      const loadDealerData = async () => {
        try {
          console.log(`🔍 Loading dealer ${dealerId} from Firebase...`);
          const dealerData = await getDealer(dealerId);
          
          if (dealerData) {
            console.log(`✅ Dealer ${dealerId} loaded successfully:`, dealerData);
            console.log(`🎭 Outfit stages available: ${dealerData.outfitStages?.length || 0}`);
            
            // Converteer Firebase DealerData naar ExtendedDealerData
            const extendedDealer: ExtendedDealerData = {
              ...dealerData,
              title: dealerData.title, // Neem de title over als die bestaat
              experience: "Professional", // Default waarde, of haal uit dealerData indien beschikbaar
              winRate: "85%", // Default waarde - kan later uit gameStats gehaald worden, of haal uit dealerData
            };
            
            setDealer(extendedDealer);
            // Clear previous messages, ready for the welcome sequence
            setChatMessages([]);
          } else {
            console.error(`❌ Dealer ${dealerId} not found in Firebase`);
            alert(`Dealer ${dealerId} niet gevonden. Ga terug naar de dealer selectie.`);
            navigate('/');
          }
        } catch (error) {
          console.error(`💥 Error loading dealer ${dealerId}:`, error);
          alert(`Error bij het laden van dealer ${dealerId}. Probeer opnieuw.`);
          navigate('/');
        }
      };
      
      loadDealerData();
    }
  }, [dealerId, navigate]);

  // Auto-deal cards and send welcome message
  useEffect(() => {
    // This effect runs when the dealer is loaded and the game hasn't started yet
    // Fixed duplication issue by checking if messages already exist
    if (dealer && !hasAutoDealt && chatMessages.length === 0) {
      const thinkingId = addThinkingIndicator();
      
      // Deal cards first and set initial game state
      setTimeout(() => {
        dealInitialCards();
        setGamePhase("BETTING");
        setHasAutoDealt(true);
        
        // Welcome message after cards are dealt
        setTimeout(() => {
          const welcomeMessageText = `Ah, daar ben je. Welkom aan mijn tafel! Ik ben ${dealer.name}. Ik heb het gevoel dat het geluk vanavond aan jouw kant staat. Laten we beginnen.`;
          replaceThinkingWithMessage(thinkingId, welcomeMessageText);
        }, 800); // Short delay after cards are visible
        
      }, 2800); // Longer delay to show thinking while cards are being prepared
    }
  }, [dealer, hasAutoDealt, chatMessages.length]);

  // Scroll chat messages: to bottom, and hide the first if >= 4 messages
  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      // Use requestAnimationFrame to ensure DOM updates and dimensions are settled
      requestAnimationFrame(() => {
        // Re-access container inside rAF callback to ensure it's the latest ref
        const currentContainer = chatContainerRef.current;
        if (!currentContainer) return;

        // First, always scroll to the bottom to make the latest message visible
        currentContainer.scrollTop = currentContainer.scrollHeight;

        // If there are 4 or more messages, adjust scroll to hide the first one
        if (chatMessages.length >= 4) {
          // Query for individual message elements.
          // BELANGRIJK: Vervang '.message-bubble' hieronder met de daadwerkelijke class naam
          // die je in de JSX gebruikt voor elk individueel chatbericht-item.
          // Als je bijvoorbeeld <div className="chat-item"> gebruikt, verander het dan naar '.chat-item'.
          const messageElements = currentContainer.querySelectorAll<HTMLElement>('.message-bubble');

          if (messageElements.length >= 2) { // We hebben er minstens twee nodig om de eerste weg te scrollen en de tweede bovenaan te tonen
            const secondMessageElement = messageElements[1];
            // Scroll zodat de bovenkant van het tweede bericht overeenkomt met de bovenkant van de viewport van de container
            currentContainer.scrollTop = secondMessageElement.offsetTop - currentContainer.offsetTop;
          } else if (messageElements.length === 1 && chatMessages.length >=4 ) {
            // Dit geval is onwaarschijnlijk als querySelectorAll correct werkt voor meerdere berichten,
            // maar als fallback, als er slechts één '.message-bubble' wordt gevonden ondanks >=4 chatMessages,
            // scroll dan met de hoogte ervan. Dit kan gebeuren als de selector te breed is.
            const firstMessageElement = messageElements[0];
            currentContainer.scrollTop = firstMessageElement.offsetHeight;
          }
          // Als er geen messageElements worden gevonden, blijft de chat naar beneden gescrolld.
        }
      });
    }
  }, [chatMessages]);

  // DEBUGGING: Log player data in GamePage when it changes
  useEffect(() => {
    console.log("[GamePage] playerData updated:", playerData);
    console.log("[GamePage] playerProgressLoading:", playerProgressLoading);
    console.log("[GamePage] playerProgressError:", playerProgressError);
  }, [playerData, playerProgressLoading, playerProgressError]);

  // Simplified scroll behavior effect
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Manage gameActionInProgress based on game phase
  useEffect(() => {
    if (gamePhase === "PLAYER_TURN" || gamePhase === "DEALER_TURN") {
      setGameActionInProgress(true);
    } else {
      setGameActionInProgress(false);
    }
  }, [gamePhase]);

  // Helper function to create game status context for AI
  const getGameStatusContext = (currentScoreOverride?: number): string => {
    const contexts = [];
    
    contexts.push(`Game Phase: ${gamePhase}`);
    contexts.push(`Player has ${playerBalance} coins`);
    contexts.push(`Player's bet is ${currentBet} coins`);
    
    if (playerHand.length > 0) {
      // Gebruik altijd de override score als beschikbaar, anders herbereken
      const actualPlayerScore = currentScoreOverride !== undefined 
        ? currentScoreOverride 
        : calculateScore(playerHand);
      contexts.push(`Player's score: ${actualPlayerScore}`);
      contexts.push(`Player's cards: ${playerHand.map(card => `${card.rank}${card.suit}`).join(', ')}`);
    }
    
    if (dealerHand.length > 0) {
      const visibleDealerCards = dealerHand.filter(card => !card.isFaceDown);
      if (visibleDealerCards.length > 0) {
        contexts.push(`My visible cards: ${visibleDealerCards.map(card => `${card.rank}${card.suit}`).join(', ')}`);
        if (gamePhase === "GAME_OVER" || gamePhase === "DEALER_TURN") {
          // Ook dealer score herberekenen als nodig
          const actualDealerScore = calculateScore(dealerHand.filter(card => !card.isFaceDown));
          contexts.push(`My visible score: ${actualDealerScore}`);
        }
      }
      if (gamePhase === "GAME_OVER") {
        // Bij game over alle dealer kaarten tonen
        const finalDealerScore = calculateScore(dealerHand);
        contexts.push(`My final score: ${finalDealerScore}`);
      }
    }
    
    contexts.push(`My current outfit stage: ${currentOutfitStage + 1}/${dealer?.outfitStages?.length || 1}`);
    
    return contexts.join(' | ');
  };

  // Send AI game update with current context
  const sendAIGameUpdate = async (prompt: string, updatedScoreForContext?: number) => {
    if (!dealer) return;
    if (isLoadingAIResponse) return; // Prevent multiple AI requests
    setIsLoadingAIResponse(true); // Set loading state
    
    // Add thinking indicator
    const thinkingId = addThinkingIndicator();
    
    try {
      const gameContext = getGameStatusContext(updatedScoreForContext);
      const chatHistory = chatMessages.slice(-6).map(msg => ({
        role: msg.sender === 'player' ? 'user' : 'assistant',
        content: msg.text
      }));

             // Use backend API for AI chat
      
      const personality_prompts = [
        // Stage 0: Sophisticated & Sweet
        "Ik ben {dealerName}, uw dealer voor vanavond. Ik spreek vanuit de 'ik'-vorm, en mijn stijl is professioneel met een vleugje charme. Ik geef scherpe, inzichtelijke tips, maar mijn hoofddoel is om u te zien glimlachen. Ik ben nieuwsgierig naar uw strategie. Mijn antwoorden zijn beknopt, onder de 20 woorden.",
        // Stage 1: Elegant & Witty
        "Ik ben {dealerName}, en ik heb het gevoel dat dit een gedenkwaardig spel wordt. In mijn cocktailjurk is mijn humor scherp, maar mijn woorden zijn zoet. Ik hou ervan om een goed spel te zien, lieverd. Wat zou u doen met een grote overwinning? Houd de reacties onder de 20 woorden.",
        // Stage 2: Casual & Flirty
        "Ik ben {dealerName}. In mijn meer casual stijl ben ik speels en een beetje flirterig. Ik plaag je met je geluk en bied zoete aanmoediging. Je hebt een mooie glimlach, heeft iemand je dat al verteld? Berichten zijn kort en luchtig, ongeveer 15 woorden.",
        // Stage 3: Sporty & Bold
        "Ik ben {dealerName}, vol energie vanavond! Ik ben niet bang om gedurfd te zijn met mijn complimenten. Een speler met jouw zelfvertrouwen is een zeldzaam gezicht. Je maakt dit spel spannend! Voel je je gelukkig? Reacties zijn pittig, onder de 15 woorden.",
        // Stage 4: Alluring & Seductive
        "Ik ben {dealerName}. De sfeer is intiem en behoorlijk verleidelijk, vind je niet? Ik zal zwoele complimenten gebruiken om dit een spannend spel van anticipatie te maken. Elke beweging van jou boeit me. Houd het kort, onder de 20 woorden.",
        // Stage 5: Luxurious & Captivating
        "Ik ben {dealerName}, uw gastheer in deze high-roller lounge. Ik spreek met verfijnde charme en fluister lieve woordjes. Elke interactie moet speciaal aanvoelen, alleen tussen ons. Durf je een geheim te delen? Reacties zijn kort en mysterieus."
      ];

      const selectedPrompt = personality_prompts[currentOutfitStage] || personality_prompts[0];
      const systemPrompt = selectedPrompt.replace("{dealerName}", dealer?.name || "Dealer");

      // Add game phase context to avoid inappropriate betting advice
      const gamePhaseContext = gamePhase === "CARDS_DEALT"
        ? "Cards are being dealt automatically. Comment on the anticipation and excitement."
        : gamePhase === "BETTING" 
        ? "The player has cards and can now place their bet. You can suggest betting strategies based on their hand."
        : gamePhase === "PLAYER_TURN"
        ? "The player is deciding whether to hit or stand. No betting changes possible now. Focus on the current hand."
        : gamePhase === "DEALER_TURN" 
        ? "The dealer is playing. No betting changes possible. Focus on the dealer's actions."
        : "The round is complete. No betting changes possible now. Focus on the outcome and next round.";

      const messages = [
        { role: "system", content: systemPrompt + ` IMPORTANT: Keep responses under 15 words maximum. ${gamePhaseContext}. Please observe the language used by the player in the chat history. Respond to the current game event in that language. If the player's language is unclear from the history or if there's no relevant history, default to English.` },
        ...chatHistory,
        { role: "user", content: `${prompt} Current game context: ${gameContext}` }
      ];

      // Wait longer to show thinking animation - more realistic
      await new Promise(resolve => setTimeout(resolve, 1800 + Math.random() * 1200));

      const response = await fetch('/api/ai-chat/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: prompt + ` Current game context: ${gameContext}`,
          history: chatHistory,
          outfit_stage_index: currentOutfitStage
        })
      });

      if (response.ok) {
        const data = await response.json();
        replaceThinkingWithMessage(thinkingId, data.reply);
      } else {
        replaceThinkingWithMessage(thinkingId, "Hmm, let me think... 🤔");
      }
    } catch (error) {
      console.error("Failed to send AI game update:", error);
      replaceThinkingWithMessage(thinkingId, "Let's keep playing! 🎰");
    } finally {
      setIsLoadingAIResponse(false); // Reset loading state
    }
  };

  const placeBet = (amount: number) => {
    if (gamePhase !== "BETTING") return;
    if (playerBalance >= amount) {
      setCurrentBet(prev => prev + amount);
    } else {
      alert("You don't have enough coins to place that bet!");
    }
  };

  const clearBet = () => {
    if (gamePhase !== "BETTING") return;
    setCurrentBet(0);
  };

  // Function to deal initial cards (2 for player, 2 for dealer with 1 face down)
  const dealInitialCards = () => {
    let newDeck = shuffleDeck(createDeck());
    const initialPlayerHand: Card[] = [];
    const initialDealerHand: Card[] = [];

    // Deal 2 cards to player
    initialPlayerHand.push(newDeck.pop()!);
    initialPlayerHand.push(newDeck.pop()!);
    
    // Deal 2 cards to dealer (1 open, 1 face down)
    const dealerCard1 = newDeck.pop()!;
    const dealerCard2 = { ...newDeck.pop()!, isFaceDown: true };
    initialDealerHand.push(dealerCard1);
    initialDealerHand.push(dealerCard2);

    setPlayerHand(initialPlayerHand);
    setDealerHand(initialDealerHand);
    setDeck(newDeck);

    const initialPlayerScore = calculateScore(initialPlayerHand);
    setPlayerScore(initialPlayerScore);
    setDealerScore(calculateScore([dealerCard1])); // Only count visible card
  };

  const handleStartGame = () => {
    if (currentBet <= 0) {
      alert("You must place a bet!");
      return;
    }
    if (currentBet > playerBalance) {
      alert("Insufficient balance!");
      return;
    }

    if (currentUser?.uid) {
      updatePlayerCoins(currentUser.uid, -currentBet);
    }

    // Start de player's turn na het uitdelen van kaarten
    setGamePhase("PLAYER_TURN");
    
    // Send AI notification 
    setTimeout(() => {
      sendAIGameUpdate("The game has started! The player now needs to decide whether to hit or stand.", playerScore);
    }, 1000);
  };

  const handleHit = (isDoubleDown: boolean = false) => {
    if (gamePhase !== "PLAYER_TURN") return;

    const newDeck = [...deck];
    const newCard = newDeck.pop();
    if (!newCard) return;

    const updatedPlayerHand = [...playerHand, newCard];
    const updatedPlayerScore = calculateScore(updatedPlayerHand);

    setPlayerHand(updatedPlayerHand);
    setPlayerScore(updatedPlayerScore);
    setDeck(newDeck);

    if (updatedPlayerScore > 21) {
      sendAIGameUpdate("Player busted! React to this outcome with empathy and encourage them for the next round.", updatedPlayerScore);
    } else if (updatedPlayerScore === 21) {
      sendAIGameUpdate("Player hit 21! Congratulate them and build excitement for the dealer's turn.", updatedPlayerScore);
    } else {
      sendAIGameUpdate(`Player hit and now has ${updatedPlayerScore}. Comment on their hand and give encouragement.`, updatedPlayerScore);
    }

    if (isDoubleDown) {
      if (playerBalance < currentBet) {
        alert("Not enough coins!");
        return;
      }
      if (currentUser?.uid) {
        updatePlayerCoins(currentUser.uid, -currentBet);
      }
      setCurrentBet(prev => prev * 2);
    }
  };

  const handleStand = () => {
    if (gamePhase !== "PLAYER_TURN") return;
    setGamePhase("DEALER_TURN");
    
    sendAIGameUpdate(`Player decided to stand with ${playerScore}. Comment on their decision and build anticipation for the dealer's turn.`, playerScore);
    
    setTimeout(() => {
      let revealedDealerHand = dealerHand.map(card => ({ ...card, isFaceDown: false }));
      setDealerHand(revealedDealerHand);
      let currentDealerScore = calculateScore(revealedDealerHand);
      setDealerScore(currentDealerScore);
      
      let tempDeck = [...deck];
      let tempHand = [...revealedDealerHand];
      
      // Dealer draws cards with animation
      const drawDealerCard = () => {
        if (currentDealerScore < 17) {
          const newCard = tempDeck.pop();
          if (!newCard) {
            finalizeDealerTurn(tempHand, currentDealerScore); 
            return;
          }
          tempHand.push({ ...newCard, isFaceDown: false });
          currentDealerScore = calculateScore(tempHand);
          setDealerHand([...tempHand]);
          setDealerScore(currentDealerScore);
          setTimeout(drawDealerCard, 700);
        } else {
          finalizeDealerTurn(tempHand, currentDealerScore);
        }
      };

      drawDealerCard();

    }, 1000);
  };

  const finalizeDealerTurn = (finalDealerHand: Card[], finalDealerScore: number) => {
    const finalPlayerScore = playerScore; // Capture score at the moment of standing
    
    setHand(finalDealerHand, setDealerHand, setDealerScore);

    if (finalPlayerScore > finalDealerScore || finalDealerScore > 21) {
      const winnings = currentBet * 2;
      sendAIGameUpdate("I won this round! Comment on the game outcome and encourage the player for the next round.", finalDealerScore);
    } else if (finalPlayerScore === finalDealerScore) {
      sendAIGameUpdate("Push! Your bet is returned.", currentBet);
    } else {
      sendAIGameUpdate("Dealer wins. Better luck next time!", finalDealerScore);
    }
    setGamePhase("GAME_OVER");
  };

  const handleNextRound = () => {
    setGamePhase("BETTING");
    setCurrentBet(0);
    setPlayerHand([]);
    setDealerHand([]);
    setPlayerScore(0);
    setDealerScore(0);
    
    sendAIGameUpdate("New round starting! Cards will be dealt automatically. Encourage the player and comment on their previous performance.", 0);
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || isLoadingAIResponse) return;
    
    const newMessage = {
      id: Date.now().toString(),
      text: chatInput,
      sender: 'player' as const,
      timestamp: new Date()
    };
    
    // Add player message and keep only last 3 messages (instead of 4)
    setChatMessages(prev => {
      const newMessages = [...prev, newMessage];
      return newMessages.slice(-4);
    });
    
    const userInput = chatInput;
    setChatInput("");

    // Add a short delay before showing thinking indicator
    await new Promise(resolve => setTimeout(resolve, 750)); 

    setIsLoadingAIResponse(true);
    
    // Add thinking indicator
    const thinkingId = addThinkingIndicator();
    
    try {
      const gameContext = getGameStatusContext();
      const chatHistory = chatMessages.slice(-8).map(msg => ({
        role: msg.sender === 'player' ? 'user' : 'assistant',
        content: msg.text
      }));

      // Use OpenAI API directly
      const openaiApiKey = process.env.REACT_APP_OPENAI_API_KEY;
      
      const personality_prompts = [
        "I am Emma, your sophisticated blackjack dealer with natural charm. I'm warm, professional, and subtly playful. I use gentle flirtation and encouragement. Keep responses under 12 words.",
        "I am Emma wearing elegant cocktail attire. I'm charming, witty, and slightly more intimate. I compliment your decisions and create romantic tension. Keep responses under 12 words.",
        "I am Emma in casual but stylish wear. I'm approachable, fun, and flirtatiously encouraging. I tease playfully about your luck and skills. Keep responses under 12 words.",
        "I am Emma in sporty, confident attire. I'm energetic, bold, and confidently flirty. I celebrate your wins with enthusiasm and motivate you during losses. Keep responses under 12 words.",
        "I am Emma in stunning poolside attire. I'm confident, alluring, and playfully seductive. I use sultry compliments and create anticipation. Keep responses under 12 words.",
        "I am Emma in luxurious, captivating attire. I'm sophisticated, mysterious, and irresistibly charming. I whisper sweet encouragements and sultry observations. Keep responses under 12 words."
      ];

      const selectedPrompt = personality_prompts[currentOutfitStage] || personality_prompts[0];
      const systemPrompt = selectedPrompt.replace("Emma", dealer?.name || "Dealer");

      // Add game phase context to avoid inappropriate betting advice
      const gamePhaseContext = gamePhase === "CARDS_DEALT"
        ? "Cards are being dealt automatically. Comment on the anticipation and excitement."
        : gamePhase === "BETTING" 
        ? "The player has cards and can now place their bet. You can suggest betting strategies based on their hand."
        : gamePhase === "PLAYER_TURN"
        ? "The player is deciding whether to hit or stand. No betting changes possible now. Focus on the current hand."
        : gamePhase === "DEALER_TURN" 
        ? "The dealer is playing. No betting changes possible. Focus on the dealer's actions."
        : "The round is complete. No betting changes possible now. Focus on the outcome and next round.";

      const messages = [
        { role: "system", content: systemPrompt + ` IMPORTANT: Keep responses under 15 words maximum. ${gamePhaseContext}. Please detect the language of the user's input and respond in the same language. If the language is unclear, default to English.` },
        ...chatHistory,
        { role: "user", content: `${userInput} (Game context: ${gameContext})` }
      ];

      // Wait longer to show thinking animation - more realistic for chat
      await new Promise(resolve => setTimeout(resolve, 2200 + Math.random() * 1300));

      const response = await fetch(`${__API_URL__}/api/ai-chat/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userInput + ` (Game context: ${gameContext})`,
          history: chatHistory,
          outfit_stage_index: currentOutfitStage
        })
      });

      if (response.ok) {
        const data = await response.json();
        replaceThinkingWithMessage(thinkingId, data.reply);
      } else {
        replaceThinkingWithMessage(thinkingId, "Sorry, let me try again! 😊");
      }
    } catch (error) {
      console.error("Failed to send message or get reply:", error);
      replaceThinkingWithMessage(thinkingId, "Oops! Let's keep playing 🎰");
    } finally {
      setIsLoadingAIResponse(false);
    }
  };

  // Add a delayed AI response about the outfit change
  const handleOutfitChange = async (newStage: number) => {
    // Check if outfit is unlocked
    if (!unlockedOutfits.includes(newStage)) {
      setPendingUnlockStage(newStage);
      setShowUnlockPrompt(true);
      return;
    }
    
    setCurrentOutfitStage(newStage);
    setShowOutfitPreview(true);
    setTimeout(() => setShowOutfitPreview(false), 3000);
    
    // Send AI notification about outfit change with specific comments
    if (dealer?.outfitStages?.[newStage]) {
      const outfitComments = [
        "Voel ik me niet geweldig in deze outfit? Perfect voor een diner vanavond! ✨",
        "Deze professionele look staat me toch fantastisch? 💼",
        "Van deze elegante stijl gaat mijn hart sneller kloppen! 💃",
        "Wat een sophisticated keuze, vind je ook niet? Ik heb een geweldige smaak! 👗",
        "Adembenemend! Deze outfit haalt het beste in mij naar boven! 🌟",
        "Wat een transformatie! Ik voel me hier zo zelfverzekerd in! 💫"
      ];
      
      const randomComment = outfitComments[Math.floor(Math.random() * outfitComments.length)];
      
      // Add a delayed AI response about the outfit change
      setTimeout(() => {
        const aiMessage = {
          id: Date.now().toString(),
          text: randomComment,
          sender: 'dealer' as const,
          timestamp: new Date()
        };
        
        setChatMessages(prev => {
          const newMessages = [...prev, aiMessage];
          return newMessages.slice(-4); // Keep only last 4 messages
        });
      }, 1000); // 1 second delay to feel natural
    }
  };

  // New function to unlock outfit with coins
  const unlockOutfitWithCoins = (stageIndex: number) => {
    const stageToUnlock = dealer?.outfitStages?.[stageIndex];
    if (!stageToUnlock || !dealer || !currentUser?.uid) return;

    const coinsNeeded = 100; // Fixed price based on store logic
    if (playerBalance < coinsNeeded) {
      alert("You don't have enough coins to unlock this outfit!");
      return;
    }

    // Deduct coins and update progression
    updatePlayerCoins(currentUser.uid, -coinsNeeded);
    progressOutfitOnWin(stageIndex); // This function just updates the UI state
    
    // Visually confirm unlock
    setUnlockedOutfits(prev => [...prev, stageIndex]);
    handleOutfitChange(stageIndex);
    setShowUnlockPrompt(false);
    setPendingUnlockStage(null);

    // Optional: send a confirmation message
    addChatMessage(
      `Congratulations! You've unlocked the '${stageToUnlock.stageName}' outfit. You can now select it.`,
      'dealer'
    );
  };

  // Auto-progress outfit on win
  const progressOutfitOnWin = (forceStage?: number) => {
    if (!dealer) return;
    const nextStage = forceStage || currentOutfitStage + 1;
    const maxStages = dealer?.outfitStages?.length || 1;
    
    // Only progress if there's a next stage and it's unlocked
    if (nextStage < maxStages && unlockedOutfits.includes(nextStage)) {
      setCurrentOutfitStage(nextStage);
      setShowOutfitPreview(true);
      setTimeout(() => setShowOutfitPreview(false), 3000);
      
      // Send AI notification about outfit progression
      if (dealer?.outfitStages?.[nextStage]) {
        setTimeout(() => {
          sendAIGameUpdate(`You're doing so well! I changed to my ${dealer.outfitStages[nextStage].stageName} outfit just for you...`, playerScore);
        }, 2000);
      }
    } else if (nextStage < maxStages && !unlockedOutfits.includes(nextStage)) {
      // Suggest unlocking next outfit
      setTimeout(() => {
        sendAIGameUpdate(`You're on fire! Want to see my next outfit? It costs ${(nextStage + 1) * 250} coins...`, playerScore);
      }, 3000);
    }
  };

  const handleTeaserClick = () => {
    console.log("🔒 Teaser overlay activated!");
    setShowEmojiPicker(true);
    setTimeout(() => {
      console.log("🔒 Teaser overlay closing...");
      setShowEmojiPicker(false);
    }, 5000);
  };

  const toggleEmoticonsPopup = () => setShowEmoticonsPopup(prev => !prev);
  const toggleStartersPopup = () => setShowStartersPopup(prev => !prev);
  const toggleGameHelpPopup = () => setShowGameHelpPopup(prev => !prev);

  const addEmoticonToChat = (emoticon: string) => {
    setChatInput(prev => prev + emoticon);
    setShowEmoticonsPopup(false);
  };

  const sendGameHelpMessage = (helpType: string) => {
    setShowGameHelpPopup(false);
    let helpMessage = "";
    
    switch(helpType) {
      case 'basic_strategy':
        helpMessage = "Wat is de beste strategie voor blackjack?";
        break;
      case 'card_counting':
        helpMessage = "Kun je me uitleggen hoe kaarten tellen werkt?";
        break;
      case 'betting_tips':
        helpMessage = "Heb je tips voor het inzetten?";
        break;
      case 'hand_advice':
        helpMessage = "Wat moet ik doen met deze hand?";
        break;
      case 'odds_explanation':
        helpMessage = "Kun je de kansen uitleggen?";
        break;
    }
    
    if (helpMessage) {
      useConversationStarter(helpMessage);
    }
  };

  // Helper function to render dealer avatar
  const renderDealerAvatar = () => {
    const currentOutfitImage = dealer?.outfitStages?.[currentOutfitStage]?.imageUrl;
    const dealerInitial = dealer?.name ? dealer.name.charAt(0).toUpperCase() : 'D';
    
    if (currentOutfitImage) {
      return (
        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-amber-300/50 shadow-lg">
          <img 
            src={currentOutfitImage} 
            alt={dealer?.name || 'Dealer'} 
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              target.style.display = 'none';
              if (target.nextElementSibling) {
                (target.nextElementSibling as HTMLElement).style.display = 'flex';
              }
            }}
          />
          <div 
            className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 text-white border-2 border-amber-300/50 flex items-center justify-center text-sm shadow-lg"
            style={{display: 'none'}}
          >
            {dealerInitial}
          </div>
        </div>
      );
    }
    
    return (
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-lg bg-gradient-to-br from-amber-500 to-yellow-600 text-white border-2 border-amber-300/50">
        {dealerInitial}
      </div>
    );
  };

  const useConversationStarter = async (starter: string) => {
    if (isLoadingAIResponse) return; // Prevent multiple messages
    
    setShowStartersPopup(false);
    
    // Create and send the message directly
    const newMessage = {
      id: Date.now().toString(),
      text: starter,
      sender: 'player' as const,
      timestamp: new Date()
    };
    
    // Add player message and keep only last 4 messages
    setChatMessages(prev => {
      const newMessages = [...prev, newMessage];
      return newMessages.slice(-4);
    });
    
    // Add a short delay before showing thinking indicator
    await new Promise(resolve => setTimeout(resolve, 750));

    setIsLoadingAIResponse(true);
    
    // Add thinking indicator
    const thinkingId = addThinkingIndicator();
    
    try {
      const gameContext = getGameStatusContext();
      const chatHistory = chatMessages.slice(-8).map(msg => ({
        role: msg.sender === 'player' ? 'user' : 'assistant',
        content: msg.text
      }));

      // Use OpenAI API directly
      const openaiApiKey = process.env.REACT_APP_OPENAI_API_KEY;
      
      const personality_prompts = [
        "I am Emma, your sophisticated blackjack dealer with natural charm. I'm warm, professional, and subtly playful. I use gentle flirtation and encouragement. Keep responses under 12 words.",
        "I am Emma wearing elegant cocktail attire. I'm charming, witty, and slightly more intimate. I compliment your decisions and create romantic tension. Keep responses under 12 words.",
        "I am Emma in casual but stylish wear. I'm approachable, fun, and flirtatiously encouraging. I tease playfully about your luck and skills. Keep responses under 12 words.",
        "I am Emma in sporty, confident attire. I'm energetic, bold, and confidently flirty. I celebrate your wins with enthusiasm and motivate you during losses. Keep responses under 12 words.",
        "I am Emma in stunning poolside attire. I'm confident, alluring, and playfully seductive. I use sultry compliments and create anticipation. Keep responses under 12 words.",
        "I am Emma in luxurious, captivating attire. I'm sophisticated, mysterious, and irresistibly charming. I whisper sweet encouragements and sultry observations. Keep responses under 12 words."
      ];

      const selectedPrompt = personality_prompts[currentOutfitStage] || personality_prompts[0];
      const systemPrompt = selectedPrompt.replace("Emma", dealer?.name || "Dealer");

      // Add game phase context to avoid inappropriate betting advice
      const gamePhaseContext = gamePhase === "CARDS_DEALT"
        ? "Cards are being dealt automatically. Comment on the anticipation and excitement."
        : gamePhase === "BETTING" 
        ? "The player has cards and can now place their bet. You can suggest betting strategies based on their hand."
        : gamePhase === "PLAYER_TURN"
        ? "The player is deciding whether to hit or stand. No betting changes possible now. Focus on the current hand."
        : gamePhase === "DEALER_TURN" 
        ? "The dealer is playing. No betting changes possible. Focus on the dealer's actions."
        : "The round is complete. No betting changes possible now. Focus on the outcome and next round.";

      const messages = [
        { role: "system", content: systemPrompt + ` IMPORTANT: Keep responses under 15 words maximum. ${gamePhaseContext}. Please detect the language of the user's input and respond in the same language. If the language is unclear, default to English.` },
        ...chatHistory,
        { role: "user", content: `${starter} (Game context: ${gameContext})` }
      ];

      // Wait longer to show thinking animation - more realistic for conversation starters
      await new Promise(resolve => setTimeout(resolve, 2400 + Math.random() * 1400));

      const response = await fetch('/api/ai-chat/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: starter + ` (Game context: ${gameContext})`,
          history: chatHistory,
          outfit_stage_index: currentOutfitStage
        })
      });

      if (response.ok) {
        const data = await response.json();
        replaceThinkingWithMessage(thinkingId, data.reply);
      } else {
        replaceThinkingWithMessage(thinkingId, "Sorry, let me try again! 😊");
      }
    } catch (error) {
      console.error("Failed to send conversation starter:", error);
      replaceThinkingWithMessage(thinkingId, "Oops! Let's keep playing 🎰");
    } finally {
      setIsLoadingAIResponse(false);
    }
  };

  const bettingChips = [5, 25, 50, 100, 250];

  // Helper function to add thinking indicator
  const addThinkingIndicator = () => {
    const thinkingMessage = {
      id: `thinking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Meer unieke ID
      text: "",
      sender: 'thinking' as const,
      timestamp: new Date()
    };
    
    // Verwijder eerst alle bestaande thinking messages om duplicates te voorkomen
    setChatMessages(prev => {
      const filteredMessages = prev.filter(msg => !msg.id.startsWith('thinking-'));
      return [...filteredMessages, thinkingMessage];
    });
    
    return thinkingMessage.id;
  };

  // Helper function to remove thinking indicator and add real message
  const replaceThinkingWithMessage = (thinkingId: string, messageText: string) => {
    const realMessage = {
      id: `dealer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Meer unieke ID
      text: messageText,
      sender: 'dealer' as const,
      timestamp: new Date()
    };
    
    setChatMessages(prev => {
      const filteredMessages = prev.filter(msg => msg.id !== thinkingId);
      const newMessages = [...filteredMessages, realMessage];
      // Keep only last 4 messages to prevent scroll
      return newMessages.slice(-4);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (chatInput.trim()) {
        sendChatMessage();
      }
    }
  };

  const sendMessage = () => {
    if (chatInput.trim()) {
      // Implementeer hier de chat logica
      setChatInput("");
      setShowEmojiPicker(false);
      setShowChatStarters(false);
    }
  };

  const handleGameHelp = () => {
    // Implementeer hier de game help logica
    setShowChatStarters(false);
  };

  if (!dealer || playerProgressLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-white text-xl">
          {!dealer ? "Loading dealer..." : "Loading player data..."}
        </div>
      </div>
    );
  }

  if (playerProgressError) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-red-500 text-xl">
          Error loading player data: {playerProgressError.message}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white relative bg-slate-900">
      
      {/* Enhanced Header with Logo, User Dropdown & Wallet */}
      <AppHeader 
        title={`${dealer?.name}'s Table`}
        subtitle={gameActionInProgress 
          ? `${gamePhase === "PLAYER_TURN" ? "Your Turn" : gamePhase === "DEALER_TURN" ? "Dealer Playing" : "Blackjack • Live Chat"}` 
          : "Blackjack • Live Chat"
        }
        showBackButton={true}
        backTo="/"
        playerBalance={playerBalance}
      />

      {/* 📱 MOBILE-FIRST RESPONSIVE LAYOUT: Responsive header spacing */}
      <div className={`game-room-container relative z-20 flex flex-col md:flex-row pt-14 sm:pt-16 tablet-portrait:pt-16 tablet-landscape:pt-14`} style={{ minHeight: '100vh', paddingBottom: '40px' }}>
        
        {/* Left Column: Dealer Info & Progression */}
        <div 
          className="game-column w-full md:w-[calc(25%+4px)] lg:w-[calc(25%+4px)] order-1 md:order-1 backdrop-blur-sm flex flex-col gap-2 sm:gap-4 p-2 sm:p-3 md:p-4 pb-16 mobile-spacing relative"
          style={{
            minHeight: 'calc(100vh - 40px)',
            overflow: 'visible',
          }}
        >
          {/* LUXE CASINO BACKGROUND - Matching Homepage */}
          <div className="absolute inset-0 z-0">
            {/* Casino Pattern Image - Direct gebruik van de pattern */}
            <div 
              className="absolute inset-0 opacity-[0.3]"
              style={{
                backgroundImage: 'url(/casino-pattern.png)',
                backgroundSize: '180px 180px',
                backgroundRepeat: 'repeat',
                backgroundBlendMode: 'overlay'
              }}
            ></div>

            {/* Casino Table Felt Pattern - Basis felt textuur */}
            <div className="absolute inset-0 opacity-[0.2]" style={{
              backgroundImage: `
                repeating-linear-gradient(
                  45deg,
                  rgba(34, 197, 94, 0.12) 0px,
                  rgba(34, 197, 94, 0.12) 1px,
                  transparent 1px,
                  transparent 24px
                )
              `,
              backgroundSize: '48px 48px'
            }}></div>
            
            {/* Luxury Casino Glow - Premium golden gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-900/15 via-yellow-900/8 to-amber-900/20"></div>
            
            {/* Deep Vignette Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-transparent to-black/50"></div>
            
            {/* Glassmorphism overlay */}
            <div className="absolute inset-0 pointer-events-none" style={{
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(15, 23, 42, 0.6) 50%, rgba(0, 0, 0, 0.4) 100%)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: 'inset 0 1px 0 rgba(255, 215, 0, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
              borderLeft: '1px solid rgba(255, 215, 0, 0.2)',
              borderRight: '1px solid rgba(255, 215, 0, 0.2)',
          }}></div>
          </div>
          
          {/* Dealer Section - 10% smaller, 20px higher */}
          <div className="relative z-10 py-[7px] flex-1 min-h-0" style={{ transform: 'scale(0.9) translateY(-20px)', transformOrigin: 'center' }}>
            <SwipeableOutfitPreview
              dealer={dealer}
              currentOutfitStage={currentOutfitStage}
              onOutfitChange={handleOutfitChange}
              onTeaserClick={handleTeaserClick}
              showOutfitPreview={showOutfitPreview}
              unlockedOutfits={unlockedOutfits}
            />
          </div>

          {/* Game Stats */}
          <div 
            className="bg-gradient-to-br from-slate-800/80 via-amber-900/20 to-slate-800/80 backdrop-blur-sm rounded-xl p-2 md:p-3 shadow-xl relative z-10 border-2 border-amber-400/60 w-4/5 mx-auto flex-shrink-0 mt-2 mb-12" 
            style={{ paddingBottom: '12px' }}
          >
            <h3 className="text-amber-300 font-semibold text-sm md:text-base mb-2 text-center">Game Stats</h3>
            <div className="space-y-1">
              {/* Balance */}
              <div className="flex justify-between items-center">
                <span className="text-slate-300 text-xs game-stat-label">Balance:</span>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-green-300 text-xs game-stat-value">{playerBalance}</span>
                  <span className="text-green-300 text-xs game-stat-value">💰</span>
                </div>
              </div>

              {/* Current Bet */}
              <div className="flex justify-between items-center">
                <span className="text-slate-300 text-xs game-stat-label">Current Bet:</span>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-yellow-300 text-xs game-stat-value">{currentBet}</span>
                  <span className="text-yellow-300 text-xs game-stat-value">🎰</span>
                </div>
              </div>

              {/* Player Score */}
              <div className="flex justify-between items-center">
                <span className="text-slate-300 text-xs game-stat-label">Player Score:</span>
                <span className="font-bold text-blue-300 text-xs game-stat-value">{playerScore}</span>
              </div>
              
              {/* Dealer Score */}
              <div className="flex justify-between items-center">
                <span className="text-slate-300 text-xs game-stat-label">Dealer Score:</span>
                <span className="font-bold text-red-300 text-xs game-stat-value">
                  {gamePhase === "DEALER_TURN" || gamePhase === "GAME_OVER" 
                    ? dealerScore 
                    : dealerHand.find(card => !card.isFaceDown) 
                      ? calculateScore([dealerHand.find(card => !card.isFaceDown)!])
                      : 0
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Column: Blackjack Game - Mobile Optimized */}
        <div 
          className="game-column w-full md:w-1/2 lg:w-3/5 order-2 md:order-2 flex flex-col py-2 sm:py-3 px-2 sm:px-3 md:px-3 relative min-h-0 backdrop-blur-sm mobile-spacing"
        >
          {/* LUXE CASINO BACKGROUND - Matching Homepage */}
          <div className="absolute inset-0 z-0">
            {/* Casino Pattern Image - Direct gebruik van de pattern */}
            <div 
              className="absolute inset-0 opacity-[0.35]"
          style={{
                backgroundImage: 'url(/casino-pattern.png)',
                backgroundSize: '300px 300px',
            backgroundRepeat: 'repeat',
                backgroundBlendMode: 'overlay'
              }}
            ></div>

            {/* Casino Table Felt Pattern - Basis felt textuur */}
            <div className="absolute inset-0 opacity-[0.25]" style={{
              backgroundImage: `
                repeating-linear-gradient(
                  45deg,
                  rgba(34, 197, 94, 0.15) 0px,
                  rgba(34, 197, 94, 0.15) 1px,
                  transparent 1px,
                  transparent 24px
                )
              `,
              backgroundSize: '48px 48px'
            }}></div>
            
            {/* Luxury Casino Glow - Premium golden gradient with green accents for chat */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-900/12 via-emerald-900/8 to-amber-900/15"></div>
            
            {/* Deep Vignette Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/35 via-transparent to-black/45"></div>
            
            {/* Glassmorphism overlay */}
            <div className="absolute inset-0 pointer-events-none" style={{
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(15, 23, 42, 0.6) 50%, rgba(0, 0, 0, 0.4) 100%)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: 'inset 0 1px 0 rgba(255, 215, 0, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
              borderLeft: '1px solid rgba(255, 215, 0, 0.2)',
              borderRight: '1px solid rgba(255, 215, 0, 0.2)',
          }}></div>
          </div>
          
          {/* Left Wooden Divider Bar - 3D Effect */}
          <div className="hidden md:block absolute top-0 -left-4 bottom-0 z-30">
            <div 
              className="h-full w-3 relative"
              style={{
                background: `
                  linear-gradient(90deg, 
                    #8B4513 0%, 
                    #A0522D 15%, 
                    #CD853F 30%, 
                    #DEB887 45%, 
                    #F5DEB3 50%, 
                    #DEB887 55%, 
                    #CD853F 70%, 
                    #A0522D 85%, 
                    #8B4513 100%
                  )
                `,
                boxShadow: `
                  inset 1px 0 0 rgba(245, 222, 179, 0.8),
                  inset -1px 0 0 rgba(101, 67, 33, 0.8),
                  2px 0 4px rgba(0, 0, 0, 0.3)
                `,
                borderLeft: '1px solid rgba(245, 222, 179, 0.6)',
                borderRight: '1px solid rgba(101, 67, 33, 0.6)'
              }}
            >
              {/* Wood grain texture overlay */}
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: `
                    repeating-linear-gradient(
                      0deg,
                      transparent 0px,
                      rgba(101, 67, 33, 0.2) 1px,
                      transparent 2px,
                      transparent 8px
                    )
                  `
                }}
              ></div>
              
              {/* Subtle gold accent */}
              <div 
                className="absolute inset-y-0 left-1/2 w-px transform -translate-x-1/2"
                style={{
                  background: 'linear-gradient(0deg, transparent 0%, rgba(255, 215, 0, 0.3) 50%, transparent 100%)'
                }}
              ></div>
            </div>
          </div>

          {/* Right Wooden Divider Bar - 3D Effect */}
          <div className="hidden md:block absolute top-0 -right-4 bottom-0 z-30">
            <div 
              className="h-full w-3 relative"
              style={{
                background: `
                  linear-gradient(90deg, 
                    #8B4513 0%, 
                    #A0522D 15%, 
                    #CD853F 30%, 
                    #DEB887 45%, 
                    #F5DEB3 50%, 
                    #DEB887 55%, 
                    #CD853F 70%, 
                    #A0522D 85%, 
                    #8B4513 100%
                  )
                `,
                boxShadow: `
                  inset 1px 0 0 rgba(245, 222, 179, 0.8),
                  inset -1px 0 0 rgba(101, 67, 33, 0.8),
                  -2px 0 4px rgba(0, 0, 0, 0.3)
                `,
                borderLeft: '1px solid rgba(101, 67, 33, 0.6)',
                borderRight: '1px solid rgba(245, 222, 179, 0.6)'
              }}
            >
              {/* Wood grain texture overlay */}
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: `
                    repeating-linear-gradient(
                      0deg,
                      transparent 0px,
                      rgba(101, 67, 33, 0.2) 1px,
                      transparent 2px,
                      transparent 8px
                    )
                  `
                }}
              ></div>
              
              {/* Subtle gold accent */}
              <div 
                className="absolute inset-y-0 left-1/2 w-px transform -translate-x-1/2"
                style={{
                  background: 'linear-gradient(0deg, transparent 0%, rgba(255, 215, 0, 0.3) 50%, transparent 100%)'
                }}
              ></div>
            </div>
          </div>

          {/* Casino Table Area - Met juiste z-index en padding onderaan */}
          <div className="casino-table w-full relative z-10 pb-6">
            {/* Dealer's Hand - ORIGINEEL */}
            <div className="dealer-area mb-4 md:mb-6">
              <div className="text-center mb-2">
                <h3 className="text-white text-lg font-bold mb-1">
                  Dealer: <span className="text-amber-400">{dealerScore}</span>
                </h3>
              </div>
              <div className="card-field dealer-field bg-transparent backdrop-blur-sm border-2 border-emerald-400/30 rounded-xl p-3 min-h-[140px] md:min-h-[180px] flex items-center justify-center relative casino-field-pattern">
                <div className="relative z-10 flex gap-3 flex-wrap justify-center">
                  {dealerHand.map((card, index) => (
                    <div 
                      key={`dealer-card-${index}`}
                      className={`blackjack-card ${card.isFaceDown ? 'face-down' : (card.suit === "♥" || card.suit === "♦" ? 'red' : 'black')} card-deal-animation shadow-xl`}
                      style={{ 
                        animationDelay: `${index * 0.15}s`
                      }}
                    >
                      {card.isFaceDown ? (
                        <div className="logo-placeholder">🎰</div>
                      ) : (
                        <>
                          <span className="rank">{card.rank}</span>
                          <span className="suit">{card.suit}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Player's Hand - ORIGINEEL, met meer ruimte eronder */}
            <div className="player-area mb-6 md:mb-8">
              <div className="text-center mb-2">
                <h3 className="text-white text-lg font-bold mb-1">
                  Your Hand: <span className="text-amber-400">{playerScore}</span>
                </h3>
              </div>
              <div className="card-field player-field bg-transparent backdrop-blur-sm border-2 border-emerald-400/30 rounded-xl p-3 min-h-[140px] md:min-h-[180px] flex items-center justify-center relative casino-field-pattern">
                <div className="relative z-10 flex gap-3 flex-wrap justify-center">
                  {playerHand.map((card, index) => (
                    <div 
                      key={`player-card-${index}`} 
                      className={`blackjack-card ${card.suit === "♥" || card.suit === "♦" ? 'red' : 'black'} card-deal-animation shadow-xl`}
                      style={{ 
                        animationDelay: `${index * 0.15}s`
                      }}
                    >
                      <span className="rank">{card.rank}</span>
                      <span className="suit">{card.suit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Game Controls - MOBILE OPTIMIZED POSITIONING */}
            <div className="game-controls relative z-40">
              {gamePhase === "CARDS_DEALT" && (
                <div className="game-controls-green backdrop-blur-sm rounded-xl p-3 shadow-xl border border-amber-400/20">
                  <h4 className="text-amber-400 text-center mb-3 font-semibold text-sm">Cards Being Dealt</h4>
                  <div className="text-center">
                    <div className="flex justify-center items-center space-x-2 mb-3">
                      <div className="w-3 h-3 bg-amber-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                      <div className="w-3 h-3 bg-amber-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                      <div className="w-3 h-3 bg-amber-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                    </div>
                    <p className="text-slate-300 text-xs">Please wait while cards are being dealt...</p>
                  </div>
                </div>
              )}
              
              {gamePhase === "BETTING" && (
                <div className="game-controls-green backdrop-blur-sm rounded-xl p-3 shadow-xl border border-amber-400/20">
                  <div className="betting-controls mb-4">
                    <h4 className="text-amber-400 text-center mb-3 font-semibold text-sm">Place Your Bet</h4>
                    {/* BETTING CHIPS - Desktop & Tablet Responsive */}
                    <div className="grid grid-cols-5 gap-2 justify-center mb-4">
                      {[25, 50, 100, 250, 500].map(amount => (
                        <button 
                          key={amount}
                          onClick={() => placeBet(amount)}
                          className="betting-chip bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-900 font-bold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-2 border-amber-300 text-xs md:text-sm flex items-center justify-center touch-manipulation
                          w-10 h-10 md:w-14 md:h-14 tablet:w-16 tablet:h-16"
                          style={{ touchAction: 'manipulation', minHeight: '40px', minWidth: '40px' }}
                        >
                          <div className="flex flex-col items-center">
                            <span className="font-bold">{amount}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="action-buttons flex justify-center gap-3 sm:gap-4 mt-2">
                    {/* Clear Bet Button */}
                    <button 
                      disabled={currentBet === 0}
                      className="bg-gradient-to-b from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white px-4 py-2 rounded-lg font-semibold shadow-lg transition-all duration-200 text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed
                      md:px-6 md:py-3"
                      onClick={clearBet}
                    >
                      Clear Bet
                    </button>
                    <button 
                      onClick={handleStartGame} 
                      disabled={currentBet === 0}
                      className="bg-gradient-to-b from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-semibold shadow-lg transition-all duration-200 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Deal Cards
                    </button>
                  </div>
                </div>
              )}

              {gamePhase === "PLAYER_TURN" && (
                <div className="game-controls-green backdrop-blur-sm rounded-xl p-3 shadow-xl border border-amber-400/20">
                  <h4 className="text-amber-400 text-center mb-3 font-semibold text-sm md:text-base">Your Turn</h4>
                  <div className="play-buttons action-buttons flex justify-center gap-2 md:gap-4">
                    {/* Hit Button */}
                    <button 
                      className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-transform transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed touch-manipulation text-xs md:text-sm"
                      onClick={() => handleHit(false)}
                      disabled={gamePhase !== 'PLAYER_TURN'}
                    >
                      Hit
                    </button>
                    <button 
                      className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow-lg transition-transform transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed touch-manipulation
                      text-xs md:text-sm tablet:text-base
                      py-2 md:py-3 tablet:py-4
                      px-3 md:px-4 tablet:px-8"
                      onClick={handleStand}
                      disabled={gamePhase !== 'PLAYER_TURN'}
                      style={{ touchAction: 'manipulation', minHeight: '40px', minWidth: '80px' }}
                    >
                      Stand
                    </button>
                    <button 
                      className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg shadow-lg transition-transform transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed touch-manipulation
                      text-xs md:text-sm tablet:text-base
                      py-2 md:py-3 tablet:py-4
                      px-3 md:px-4 tablet:px-8"
                      onClick={() => handleHit(true)}
                      disabled={gamePhase !== 'PLAYER_TURN' || playerHand.length !== 2 || playerBalance < currentBet}
                      style={{ touchAction: 'manipulation', minHeight: '40px', minWidth: '80px' }}
                    >
                      Double
                    </button>
                  </div>
                </div>
              )}

              {(gamePhase === "DEALER_TURN") && (
                <div className="game-controls-green backdrop-blur-sm rounded-xl p-3 shadow-xl">
                  <h4 className="text-amber-400 text-center mb-3 font-semibold text-sm">Dealer's Turn</h4>
                  <div className="text-center">
                    <div className="flex justify-center items-center space-x-2 mb-3">
                      <div className="w-3 h-3 bg-amber-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                      <div className="w-3 h-3 bg-amber-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                      <div className="w-3 h-3 bg-amber-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                    </div>
                    <p className="text-slate-300 text-xs">Dealer is playing...</p>
                  </div>
                </div>
              )}

              {gamePhase === "GAME_OVER" && (
                <div className="game-controls-green backdrop-blur-sm rounded-xl p-3 shadow-xl">
                  <h4 className="text-amber-400 text-center mb-3 font-semibold text-sm">Game Over</h4>
                  <div className="action-buttons flex justify-center">
                    <button 
                      onClick={handleNextRound}
                      className="bg-gradient-to-b from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white px-8 py-2 rounded-lg font-semibold shadow-lg transition-all duration-200 text-sm"
                    >
                      Next Round
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Chat */}
        <div
          className="game-column chat-interface w-full md:w-[calc(25%+12px)] lg:w-[calc(25%+12px)] order-3 bg-slate-900/90 backdrop-blur-sm p-2 sm:p-3 md:p-3 pb-4 sm:pb-6 md:pb-8 flex flex-col relative min-h-0 mobile-spacing"
          style={{
            borderLeft: '1px solid rgba(255, 215, 0, 0.1)',
            background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.94), rgba(15, 23, 42, 0.96))',
          }}
        >
          {/* Casino pattern overlay */}
          <div className="absolute inset-0 z-0">
            {/* Casino Pattern Background */}
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: 'url(/casino-pattern.png)',
                backgroundSize: '180px 180px',
                backgroundRepeat: 'repeat',
                opacity: '0.3',
                mixBlendMode: 'soft-light'
              }}
            ></div>
            
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-slate-900/50 to-slate-900/60"></div>
            
            {/* Glassmorphism overlay */}
            <div className="absolute inset-0 pointer-events-none" style={{
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              boxShadow: 'inset 0 1px 0 rgba(255, 215, 0, 0.1)',
              borderRight: '1px solid rgba(255, 215, 0, 0.1)'
            }}></div>
          </div>
          
          {/* Chat Header */}
          <div className="mb-2 relative z-10">
            <h2 className="text-lg font-bold text-amber-400 mb-1 text-center flex items-center justify-center gap-2">
              <span className="live-indicator w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Live Chat with {dealer?.name}
            </h2>
            <div className="text-xs text-center text-slate-200 bg-gradient-to-r from-slate-800/70 via-amber-900/30 to-slate-800/70 p-1 rounded-lg border border-amber-400/30 backdrop-blur-sm">
              Balance: <span className="text-amber-300 font-semibold">{playerBalance} coins 💰</span>
            </div>
          </div>

          {/* Chat Messages */}
          <div 
            ref={chatContainerRef} 
            className="chat-messages flex-1 overflow-y-auto mb-2 pr-1 sm:pr-2 relative z-10 min-h-[200px] sm:min-h-[300px] md:min-h-[500px] max-h-[400px] sm:max-h-[500px] md:max-h-[700px] rounded-xl sm:rounded-2xl p-2 sm:p-3 md:p-4 smooth-scroll"
            style={{
              background: 'linear-gradient(135deg, rgba(2, 20, 8, 0.65), rgba(3, 35, 25, 0.55))',
              border: '1px solid rgba(34, 197, 94, 0.25)',
              backdropFilter: 'blur(8px)',
              boxShadow: 'inset 0 1px 0 rgba(34, 197, 94, 0.08), 0 8px 32px rgba(0, 0, 0, 0.2)'
            }}
          >
            {chatMessages.map((msg) => {
              if (msg.sender === 'thinking') {
                return (
                  <div key={msg.id} className="flex justify-start w-full mb-3"> 
                    <div className="max-w-[85%] md:max-w-[90%] group flex items-center gap-3">
                      {renderDealerAvatar()}
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-amber-400/60 rounded-full animate-pulse" style={{animationDelay: '0ms'}}></div>
                        <div className="w-2 h-2 bg-amber-400/60 rounded-full animate-pulse" style={{animationDelay: '500ms'}}></div>
                        <div className="w-2 h-2 bg-amber-400/60 rounded-full animate-pulse" style={{animationDelay: '1000ms'}}></div>
                      </div>
                    </div>
                  </div>
                );
              }
              return (
                <div
                  key={msg.id}
                  className={`flex mb-3 ${msg.sender === 'player' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] sm:max-w-[90%] md:max-w-[95%] group ${msg.sender === 'player' ? 'flex-row-reverse' : 'flex-row'} flex items-end gap-2 sm:gap-3`}>
                    {/* Avatar/Icon */}
                    {msg.sender === 'player' ? (
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base shadow-lg border-2 bg-gradient-to-br from-emerald-500 to-green-600 text-white border-emerald-300/50">
                        🎰
                      </div>
                    ) : (
                      renderDealerAvatar()
                    )}
                    
                    {/* Message Bubble */}
                    <div className={`relative max-w-[calc(100%-3rem)] sm:max-w-[calc(100%-4rem)] ${
                      msg.sender === 'player' ? 'mr-1 sm:mr-2' : 'ml-1 sm:ml-2'
                    }`}>
                      {/* Main bubble */}
                      <div 
                        className={`p-3 sm:p-4 backdrop-blur-xl rounded-2xl shadow-xl transition-all duration-300 group-hover:shadow-2xl border relative overflow-hidden ${
                          msg.sender === 'player'
                            ? 'bg-gradient-to-br from-emerald-600/90 via-green-600/85 to-emerald-700/90 text-white border-emerald-400/50 rounded-br-md shadow-emerald-500/20 group-hover:shadow-emerald-400/30'
                            : 'bg-gradient-to-br from-amber-600/90 via-yellow-600/85 to-amber-700/90 text-white border-amber-400/50 rounded-bl-md shadow-amber-500/20 group-hover:shadow-amber-400/30'
                        }`}
                      >
                        {/* Glasmorphism overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-transparent opacity-40 pointer-events-none"></div>
                        
                        {/* Message content */}
                        <div className="relative z-10">
                          <p className="text-sm sm:text-base leading-relaxed font-medium mb-1">{msg.text}</p>
                          <div className={`flex items-center gap-1 text-xs sm:text-sm opacity-80 ${
                            msg.sender === 'player' ? 'justify-end' : 'justify-start'
                          }`}>
                            <span className="bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chat Input */}
          <div className="chat-input-container space-y-2 relative z-50">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoadingAIResponse && sendChatMessage()}
                placeholder="Type your message..."
                disabled={isLoadingAIResponse}
                className="chat-input flex-1 border border-green-400/30 rounded-lg px-3 py-2 sm:py-3 text-white placeholder-green-200 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
                style={{
                  background: 'linear-gradient(135deg, rgba(3, 35, 25, 0.6), rgba(2, 20, 8, 0.75))',
                  backdropFilter: 'blur(6px)',
                }}
              />
              <button
                onClick={sendChatMessage}
                disabled={isLoadingAIResponse || !chatInput.trim()}
                className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-semibold shadow-lg transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed min-w-[48px] sm:min-w-[60px] flex items-center justify-center border border-amber-400/50 hover:scale-105 active:scale-95 touch-target touch-manipulation"
                title="Verstuur bericht"
              >
                {isLoadingAIResponse ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="rotate-45">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                )}
              </button>
            </div>
            
            {/* Enhanced Chat Helper Buttons */}
            <div className="flex gap-2 relative z-30">
              {/* Emoticons Button */}
              <button 
                onClick={toggleEmoticonsPopup}
                disabled={isLoadingAIResponse}
                className="group px-3 py-2 bg-gradient-to-r from-amber-600/20 to-amber-500/20 hover:from-amber-500/30 hover:to-amber-400/30 text-amber-400 text-sm rounded-lg border border-amber-400/50 transition-all duration-300 disabled:opacity-50 backdrop-blur-sm hover:scale-105 active:scale-95 shadow-lg"
                title="Emoticons"
              >
                <span className="group-hover:animate-pulse">😎</span>
              </button>
              
              {/* Conversation Starters Button */}
              <button 
                onClick={toggleStartersPopup}
                disabled={isLoadingAIResponse}
                className="group px-3 py-2 bg-gradient-to-r from-purple-600/20 to-purple-500/20 hover:from-purple-500/30 hover:to-purple-400/30 text-purple-400 text-sm rounded-lg border border-purple-400/50 transition-all duration-300 disabled:opacity-50 backdrop-blur-sm hover:scale-105 active:scale-95 shadow-lg"
                title="Gespreksopeners"
              >
                <span className="group-hover:animate-bounce">💬</span>
              </button>
              
              {/* Game Help Button */}
              <button 
                onClick={toggleGameHelpPopup}
                disabled={isLoadingAIResponse}
                className="group px-3 py-2 bg-gradient-to-r from-blue-600/20 to-blue-500/20 hover:from-blue-500/30 hover:to-blue-400/30 text-blue-400 text-sm rounded-lg border border-blue-400/50 transition-all duration-300 disabled:opacity-50 backdrop-blur-sm hover:scale-105 active:scale-95 shadow-lg"
                title="Kaartspel hulp"
              >
                <span className="group-hover:animate-pulse font-bold">ℹ️</span>
              </button>

              {/* Emoticons Popup - Modern Design */}
              {showEmoticonsPopup && (
                <div className="absolute bottom-full left-0 mb-2 z-50 w-[280px]">
                  <div className="bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-amber-900/20 backdrop-blur-xl rounded-2xl shadow-2xl border border-amber-400/30 overflow-hidden">
                    {/* Header with gradient */}
                    <div className="bg-gradient-to-r from-amber-600/20 to-yellow-500/20 p-3 border-b border-amber-400/20">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                          <h3 className="text-amber-300 font-bold text-sm tracking-wide">EMOTICONS</h3>
                        </div>
                        <button 
                          onClick={toggleEmoticonsPopup} 
                          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-500/20 transition-all duration-200 text-slate-300 hover:text-red-400"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-3">
                      <div className="grid grid-cols-6 gap-2">
                        {['😀', '😂', '😍', '🤔', '😎', '😢', '🥳', '🎉', '💰', '🃏', '🎰', '🔥'].map(emoji => (
                          <button 
                            key={emoji} 
                            onClick={() => addEmoticonToChat(emoji)}
                            className="group relative w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-slate-700/50 to-slate-600/50 hover:from-amber-600/20 hover:to-yellow-500/20 border border-slate-600/50 hover:border-amber-400/50 transition-all duration-300 hover:scale-110 hover:-translate-y-1 shadow-lg hover:shadow-amber-400/20"
                            title={`Voeg ${emoji} toe`}
                          >
                            <span className="text-xl group-hover:scale-110 transition-transform duration-200">{emoji}</span>
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Conversation Starters Popup - Modern Design */}
              {showStartersPopup && (
                <div className="absolute bottom-full left-0 mb-2 z-50 w-[320px]">
                  <div className="bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-purple-900/20 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-400/30 overflow-hidden">
                    {/* Header with gradient */}
                    <div className="bg-gradient-to-r from-purple-600/20 to-pink-500/20 p-3 border-b border-purple-400/20">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                          <h3 className="text-purple-300 font-bold text-sm tracking-wide">GESPREKSOPENERS</h3>
                        </div>
                        <button 
                          onClick={toggleStartersPopup} 
                          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-500/20 transition-all duration-200 text-slate-300 hover:text-red-400"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-3 space-y-2">
                      {[
                        { text: "Wat is jouw favoriete strategie bij blackjack?", icon: "🎯" }, 
                        { text: "Hoe voel je je over deze hand?", icon: "💭" }, 
                        { text: "Vertel me over de outfit die je draagt", icon: "👗" },
                        { text: "Wat denk je van mijn geluk vandaag?", icon: "🍀" },
                        { text: "Heb je tips voor een beter spel?", icon: "💡" }
                      ].map((starter, index) => (
                        <button 
                          key={starter.text}
                          onClick={() => useConversationStarter(starter.text)}
                          className="group w-full text-left p-2 rounded-xl bg-gradient-to-r from-slate-700/50 to-slate-600/50 hover:from-purple-600/30 hover:to-pink-500/30 border border-slate-600/50 hover:border-purple-400/60 transition-all duration-200 hover:scale-[1.02] shadow-lg hover:shadow-purple-400/25"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-purple-500/20 group-hover:bg-purple-400/40 transition-colors duration-200">
                              <span className="text-sm">{starter.icon}</span>
                            </div>
                            <span className="text-xs text-slate-200 group-hover:text-purple-100 transition-colors duration-200 leading-relaxed">
                              {starter.text}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Game Help Popup - Modern Design */}
              {showGameHelpPopup && (
                <div className="absolute bottom-full right-0 mb-2 z-50 w-[320px]">
                  <div className="bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-blue-900/20 backdrop-blur-xl rounded-2xl shadow-2xl border border-blue-400/30 overflow-hidden">
                    {/* Header with gradient */}
                    <div className="bg-gradient-to-r from-blue-600/20 to-cyan-500/20 p-3 border-b border-blue-400/20">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                          <h3 className="text-blue-300 font-bold text-sm tracking-wide">SPELREGELS & HULP</h3>
                        </div>
                        <button 
                          onClick={toggleGameHelpPopup} 
                          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-500/20 transition-all duration-200 text-slate-300 hover:text-red-400"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-3 space-y-2">
                      {[
                        { key: 'basic_strategy', label: 'Basis strategie uitleg', icon: '🎯', color: 'emerald' },
                        { key: 'card_counting', label: 'Kaarten tellen tips', icon: '🔢', color: 'violet' },
                        { key: 'betting_tips', label: 'Inzet strategieën', icon: '💰', color: 'amber' },
                        { key: 'hand_advice', label: 'Advies voor deze hand', icon: '🃏', color: 'rose' },
                        { key: 'odds_explanation', label: 'Kansen uitleggen', icon: '📊', color: 'cyan' }
                      ].map((help, index) => (
                        <button 
                          key={help.key}
                          onClick={() => sendGameHelpMessage(help.key)}
                          className="group w-full text-left p-2 rounded-xl bg-gradient-to-r from-slate-700/50 to-slate-600/50 hover:from-blue-600/30 hover:to-cyan-500/30 border border-slate-600/50 hover:border-blue-400/60 transition-all duration-200 hover:scale-[1.02] shadow-lg hover:shadow-blue-400/25"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 group-hover:from-blue-400/40 group-hover:to-cyan-400/40 transition-all duration-200 border border-blue-400/20">
                              <span className="text-lg">{help.icon}</span>
                            </div>
                            <span className="text-xs text-slate-200 group-hover:text-blue-100 transition-colors duration-200 leading-relaxed">
                              {help.label}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Outfit Unlock Prompt - Modern Design */}
      {showUnlockPrompt && pendingUnlockStage !== null && dealer?.outfitStages?.[pendingUnlockStage] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg p-4">
          <div className="bg-gradient-to-br from-slate-900/95 via-amber-900/10 to-slate-800/95 backdrop-blur-xl rounded-3xl border border-amber-400/30 shadow-2xl max-w-md w-full overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-600/20 to-yellow-500/20 p-6 border-b border-amber-400/20">
              <div className="flex items-center justify-center gap-3">
                <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
                <h3 className="text-amber-300 font-bold text-lg tracking-wide">OUTFIT ONTGRENDELEN</h3>
                <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 text-center">
              {/* Image with enhanced styling */}
              <div className="mb-6 relative">
                <div className="w-36 h-48 mx-auto rounded-2xl overflow-hidden border-2 border-amber-400/50 shadow-2xl relative group">
                  <img 
                    src={dealer.outfitStages[pendingUnlockStage].imageUrl} 
                    alt={dealer.outfitStages[pendingUnlockStage].stageName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-sm">🔓</span>
                </div>
              </div>
              
              <h4 className="text-xl font-bold text-amber-300 mb-2">
                {dealer.outfitStages[pendingUnlockStage].stageName}
              </h4>
              
              <p className="text-slate-300 mb-6 text-sm leading-relaxed">
                Ontgrendel deze exclusieve outfit voor <span className="text-amber-300 font-semibold">{dealer.name}</span>!
              </p>
              
              {/* Cost display with modern styling */}
              <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-2xl p-4 mb-6 border border-slate-600/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-300 font-medium">Kosten:</span>
                  <div className="flex items-center gap-2 bg-amber-500/20 px-3 py-1 rounded-full">
                    <span className="text-amber-300 font-bold text-lg">
                      {(pendingUnlockStage + 1) * 250}
                    </span>
                    <span className="text-xl">💰</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-medium">Jouw Saldo:</span>
                  <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-full">
                    <span className={`font-bold text-lg ${playerBalance >= (pendingUnlockStage + 1) * 250 ? 'text-green-300' : 'text-red-300'}`}>
                      {playerBalance}
                    </span>
                    <span className="text-xl">💰</span>
                  </div>
                </div>
              </div>
              
              {/* Action buttons with modern styling */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowUnlockPrompt(false);
                    setPendingUnlockStage(null);
                  }}
                  className="flex-1 bg-gradient-to-r from-slate-600/80 to-slate-500/80 hover:from-slate-500 hover:to-slate-400 text-white py-3 px-6 rounded-xl transition-all duration-200 font-semibold border border-slate-400/30 hover:scale-105 active:scale-95"
                >
                  Annuleren
                </button>
                <button
                  onClick={() => unlockOutfitWithCoins(pendingUnlockStage)}
                  disabled={playerBalance < (pendingUnlockStage + 1) * 250}
                  className="flex-1 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white py-3 px-6 rounded-xl transition-all duration-200 font-bold shadow-lg hover:shadow-amber-400/30 border border-amber-400/50 hover:scale-105 active:scale-95 disabled:scale-100"
                >
                  <span className="flex items-center justify-center gap-2">
                    Ontgrendelen
                    <span className="text-lg">🔓</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamePage;
