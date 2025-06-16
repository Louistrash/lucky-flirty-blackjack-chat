import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AiChatRequest, ChatMessageInput as BrainChatMessageInput } from 'types'; // Adjust path if brain types are elsewhere
import { useCurrentUser } from 'app';
import { usePlayerProgressStore } from '../utils/usePlayerProgressStore';

interface Message {
  id: string;
  text: string;
  sender: 'player' | 'dealer';
  timestamp: Date;
  dealerName?: string; // Optional: for dealer's name
  // dealerAvatar?: string; // Optional: for dealer's avatar URL
}

interface ChatInterfaceProps {
  // We might pass down the current dealer's info later
  // dealerProfile?: Dealer; // Assuming Dealer type is defined elsewhere
}

// Touch/Swipe interface for message interactions
interface TouchPosition {
  x: number;
  y: number;
  time: number;
}

interface SwipeState {
  isDragging: boolean;
  startPos: TouchPosition | null;
  messageId: string | null;
  direction: 'left' | 'right' | null;
}

const getTouchPosition = (event: TouchEvent | MouseEvent): TouchPosition => {
  const touch = 'touches' in event ? event.touches[0] : event;
  return {
    x: touch.clientX,
    y: touch.clientY,
    time: Date.now()
  };
};

const getSwipeDirection = (start: TouchPosition, end: TouchPosition): 'left' | 'right' | null => {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  
  // Only horizontal swipes, minimum 50px distance
  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
    return deltaX > 0 ? 'right' : 'left';
  }
  return null;
};

const ChatInterface: React.FC<ChatInterfaceProps> = (/* { dealerProfile } */) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoadingApiCall, setIsLoadingApiCall] = useState(false);
  const [swipeState, setSwipeState] = useState<SwipeState>({
    isDragging: false,
    startPos: null,
    messageId: null,
    direction: null
  });
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { user: currentUser } = useCurrentUser();
  const {
    playerData,
    subscribeToPlayerProgress,
  } = usePlayerProgressStore();

  // Hardcoded for now, this would come from GamePage or global state
  const selectedDealerId = "dealer1_sophia"; 

  useEffect(() => {
    if (currentUser?.uid) {
      const unsubscribe = subscribeToPlayerProgress(currentUser.uid);
      return () => unsubscribe();
    }
  }, [currentUser, subscribeToPlayerProgress]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Touch event handlers for message swipe actions
  const handleMessageTouchStart = useCallback((e: TouchEvent | MouseEvent, messageId: string) => {
    e.stopPropagation();
    const position = getTouchPosition(e);
    setSwipeState({
      isDragging: true,
      startPos: position,
      messageId,
      direction: null
    });
  }, []);

  const handleMessageTouchMove = useCallback((e: TouchEvent | MouseEvent) => {
    if (!swipeState.isDragging || !swipeState.startPos) return;

    const position = getTouchPosition(e);
    const direction = getSwipeDirection(swipeState.startPos, position);
    
    setSwipeState(prev => ({
      ...prev,
      direction
    }));

    // Prevent default scrolling if we're handling a horizontal swipe
    if (direction) {
      e.preventDefault();
    }
  }, [swipeState.isDragging, swipeState.startPos]);

  const handleMessageTouchEnd = useCallback(() => {
    if (!swipeState.isDragging || !swipeState.startPos || !swipeState.messageId) {
      setSwipeState({ isDragging: false, startPos: null, messageId: null, direction: null });
      return;
    }

    const { direction, messageId } = swipeState;
    
    if (direction === 'left') {
      // Could implement delete message functionality
      console.log('Swipe left on message:', messageId);
      if ('vibrate' in navigator) {
        navigator.vibrate(15);
      }
    } else if (direction === 'right') {
      // Could implement reply/react functionality
      console.log('Swipe right on message:', messageId);
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
    }

    setSwipeState({
      isDragging: false,
      startPos: null,
      messageId: null,
      direction: null
    });
  }, [swipeState]);

  const handleSendMessage = () => {
    if (inputValue.trim() === '') return;

    const newMessage: Message = {
      id: new Date().toISOString(), // Simple ID for now
      text: inputValue,
      sender: 'player',
      timestamp: new Date(),
    };
    setMessages(prevMessages => [...prevMessages, newMessage]);
    setInputValue('');
    setIsLoadingApiCall(true);

    // Add haptic feedback for sending
    if ('vibrate' in navigator) {
      navigator.vibrate(5);
    }

    // Prepare history for API
    const historyForApi: BrainChatMessageInput[] = messages.map(msg => ({
      role: msg.sender === 'player' ? 'user' : 'assistant',
      content: msg.text,
    }));

    let currentOutfitStage = 0; // Default to professional
    if (currentUser && playerData && playerData.dealerProgress && playerData.dealerProgress[selectedDealerId]) {
      currentOutfitStage = playerData.dealerProgress[selectedDealerId].currentOutfitStageIndex;
    }

    const requestBody: AiChatRequest = {
      message: newMessage.text,
      history: historyForApi, // Send messages *before* the current one
      outfit_stage_index: currentOutfitStage,
    };

    fetch('/api/ai-chat/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })
      .then(async response => {
        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }
        const data = await response.json();
        const dealerResponse: Message = {
          id: new Date().toISOString() + '-dealer',
          text: data.reply, 
          sender: 'dealer',
          timestamp: new Date(),
          dealerName: 'Royal AI Dealer', // Consistent with backend prompt for now
        };
        setMessages(prevMessages => [...prevMessages, dealerResponse]);
      })
      .catch(error => {
        console.error("Failed to send message or get reply:", error);
        const errorResponse: Message = {
          id: new Date().toISOString() + '-error',
          text: "Sorry, I couldn't get a response. Please try again.",
          sender: 'dealer',
          timestamp: new Date(),
          dealerName: 'System',
        };
        setMessages(prevMessages => [...prevMessages, errorResponse]);
      })
      .finally(() => {
        setIsLoadingApiCall(false);
      });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="w-full sm:w-80 h-full bg-gray-800 text-white flex flex-col border-l border-gray-700 shadow-lg">
      {/* Header */}
      <div className="p-3 sm:p-4 bg-gray-900 border-b border-gray-700">
        <h2 className="text-lg sm:text-xl font-semibold text-yellow-400">
          Chat with {/* dealerProfile?.name || 'Dealer' */ 'Dealer'}
        </h2>
        <div className="text-xs text-gray-400 mt-1 sm:hidden">
          Tik en houd vast voor opties
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-grow p-3 sm:p-4 overflow-y-auto space-y-3 sm:space-y-4 bg-gray-800/50 relative">
        {isLoadingApiCall && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 z-10">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400"></div>
              <p className='text-yellow-400 text-base sm:text-lg font-semibold'>Dealer is thinking...</p>
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'player' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[80%] p-3 sm:p-3 rounded-lg shadow transition-all duration-200 touch-manipulation ${
                msg.sender === 'player'
                  ? 'bg-blue-600 text-white rounded-br-none hover:bg-blue-700'
                  : 'bg-gray-700 text-gray-200 rounded-bl-none hover:bg-gray-600'
              } ${swipeState.messageId === msg.id && swipeState.isDragging ? 'scale-95' : ''}`}
              onTouchStart={(e) => handleMessageTouchStart(e.nativeEvent, msg.id)}
              onTouchMove={(e) => handleMessageTouchMove(e.nativeEvent)}
              onTouchEnd={handleMessageTouchEnd}
              onMouseDown={(e) => handleMessageTouchStart(e.nativeEvent, msg.id)}
              onMouseMove={(e) => handleMessageTouchMove(e.nativeEvent)}
              onMouseUp={handleMessageTouchEnd}
              onMouseLeave={handleMessageTouchEnd}
            >
              {msg.sender === 'dealer' && (
                <p className="text-xs text-yellow-300 mb-1">{msg.dealerName || 'Dealer'}</p>
              )}
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
              <p className={`text-xs mt-2 ${msg.sender === 'player' ? 'text-blue-200' : 'text-gray-400'} text-right`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 sm:p-4 bg-gray-900 border-t border-gray-700">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-grow p-3 sm:p-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-base sm:text-sm touch-manipulation"
            disabled={isLoadingApiCall}
            style={{ fontSize: '16px' }} // Prevents zoom on iOS
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoadingApiCall || inputValue.trim() === ''}
            className="px-4 sm:px-4 py-3 sm:py-2 bg-yellow-500 text-gray-900 font-bold rounded-md hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 touch-manipulation min-w-[60px] sm:min-w-[auto]"
          >
            {isLoadingApiCall ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
            ) : (
              <span className="text-sm sm:text-base">Send</span>
            )}
          </button>
        </div>
        {/* Mobile hint */}
        <div className="text-xs text-gray-500 mt-2 text-center sm:hidden">
          Swipe berichten voor opties • Tik Send om te verzenden
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
