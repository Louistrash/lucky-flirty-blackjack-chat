import create from 'zustand';
import { API_URL } from '../constants';
import { DealerData } from './adminDealerManager';

// Helper function to generate unique IDs
const generateUniqueId = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'dealer';
  timestamp: string;
  avatar?: string;
  isAction?: boolean;
}

type ChatStore = {
  messages: Message[];
  isLoadingApiCall: boolean;
  thinkingText: string;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  clearMessages: () => void; // Add function to clear messages
  sendMessage: (text: string, history: Message[], outfitStage: number, dealer: DealerData | null, messageType?: string) => Promise<void>;
};

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isLoadingApiCall: false,
  thinkingText: '',
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [] }),
  sendMessage: async (text, history, outfitStage, dealer, messageType) => {
    set({ isLoadingApiCall: true, thinkingText: 'Dealer is thinking...' });

    const newMessage: Message = {
      id: generateUniqueId(),
      text: text,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };
    get().addMessage(newMessage);

    try {
      const response = await fetch(`${API_URL}/ai-chat/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          history: history.slice(-6).map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })),
          outfit_stage_index: outfitStage,
          message_type: messageType || 'user_typed',
        }),
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }

      const data = await response.json();

      const apiReply: Message = {
        id: generateUniqueId(),
        text: data.reply,
        sender: 'dealer',
        timestamp: new Date().toISOString(),
        avatar: dealer?.avatarUrl, // Fix the avatar property name
      };

      get().addMessage(apiReply);
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorReply: Message = {
        id: generateUniqueId(),
        text: "Sorry, I'm having a little trouble thinking right now. Let's try again in a moment.",
        sender: 'dealer',
        timestamp: new Date().toISOString(),
        avatar: dealer?.avatarUrl,
      };
      get().addMessage(errorReply);
    } finally {
      set({ isLoadingApiCall: false, thinkingText: '' });
    }
  },
}));
