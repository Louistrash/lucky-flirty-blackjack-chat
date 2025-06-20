import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useCurrentUser } from 'app';
import { usePlayerProgressStore } from '../utils/usePlayerProgressStore';
import { useChatStore, Message } from '../utils/useChatStore';
import { DealerData } from '../utils/adminDealerManager';
import { formatTimestamp } from '../utils/helpers';

// Using Message from useChatStore instead of defining it here

interface ChatInterfaceProps {
  dealer: DealerData | null;
  currentOutfitStage: number;
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

const ChatInterface: React.FC<ChatInterfaceProps> = ({ dealer, currentOutfitStage }) => {
  const { messages, isLoadingApiCall, thinkingText, sendMessage } = useChatStore();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [swipeState, setSwipeState] = useState<SwipeState>({
    isDragging: false,
    startPos: null,
    messageId: null,
    direction: null
  });
  const { user: currentUser } = useCurrentUser();
  const {
    playerData,
    subscribeToPlayerProgress,
  } = usePlayerProgressStore();

  useEffect(() => {
    if (currentUser?.uid) {
      const unsubscribe = subscribeToPlayerProgress(currentUser.uid);
      return unsubscribe;
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
    if (inputValue.trim() === '' || isLoadingApiCall) return;
    
    sendMessage(inputValue, messages, currentOutfitStage, dealer);
    setInputValue('');
    
    // Add haptic feedback for sending
    if ('vibrate' in navigator) {
      navigator.vibrate(5);
    }
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
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {/* Only show the last 3 messages */}
        {messages.slice(-3).map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            onTouchStart={(e) => handleMessageTouchStart(e.nativeEvent, message.id)}
            onTouchMove={(e) => handleMessageTouchMove(e.nativeEvent)}
            onTouchEnd={handleMessageTouchEnd}
            onMouseDown={(e) => handleMessageTouchStart(e.nativeEvent, message.id)}
            onMouseMove={(e) => handleMessageTouchMove(e.nativeEvent)}
            onMouseUp={handleMessageTouchEnd}
            onMouseLeave={handleMessageTouchEnd}
          >
            <div
              className={`relative max-w-[80%] rounded-lg px-4 py-2 ${message.sender === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-gray-700 text-white rounded-bl-none'}`}
              style={{
                transform: swipeState.isDragging && swipeState.messageId === message.id 
                  ? `translateX(${swipeState.direction === 'left' ? '-40px' : '40px'})` 
                  : 'translateX(0)',
                transition: swipeState.isDragging ? 'none' : 'transform 0.2s ease-out'
              }}
            >
              <p className="text-sm sm:text-base">{message.text}</p>
              <div className="text-[10px] text-gray-400 mt-1 text-right">
                {message.sender === 'user' ? '' : dealer?.name || 'Dealer'} {formatTimestamp(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        
        {/* Thinking indicator */}
        {isLoadingApiCall && (
          <div className="flex justify-start p-4">
            <div className="bg-gray-700 text-white rounded-lg px-4 py-2 rounded-bl-none max-w-[80%]">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <p className="text-sm italic text-gray-400">{thinkingText}</p>
            </div>
          </div>
        )}
        
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
