import { create } from 'zustand';

export interface Message {
  role: 'user' | 'model';
  text: string;
}

interface AIState {
  input: string;
  messages: Message[];
  isThinking: boolean;
  isMuted: boolean;
  isInputMuted: boolean;
  systemStatus: string;
  hudData: string | null;
  timer: { remaining: number; label: string } | null;
  
  isLiveConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  
  setInput: (input: string) => void;
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  addMessage: (message: Message) => void;
  setIsThinking: (isThinking: boolean) => void;
  setIsMuted: (isMuted: boolean) => void;
  setIsInputMuted: (isInputMuted: boolean) => void;
  setSystemStatus: (status: string) => void;
  setHudData: (data: string | null) => void;
  setTimer: (timer: { remaining: number; label: string } | null | ((prev: { remaining: number; label: string } | null) => { remaining: number; label: string } | null)) => void;
  setIsLiveConnected: (isLiveConnected: boolean) => void;
  setIsListening: (isListening: boolean) => void;
  setIsSpeaking: (isSpeaking: boolean) => void;
}

export const useAIStore = create<AIState>((set) => ({
  input: '',
  messages: [],
  isThinking: false,
  isMuted: false,
  isInputMuted: false,
  systemStatus: 'ONLINE',
  hudData: null,
  timer: null,
  isLiveConnected: false,
  isListening: false,
  isSpeaking: false,

  setInput: (input) => set({ input }),
  setMessages: (updater) => set((state) => ({
    messages: typeof updater === 'function' ? updater(state.messages) : updater
  })),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setIsThinking: (isThinking) => set({ isThinking }),
  setIsMuted: (isMuted) => set({ isMuted }),
  setIsInputMuted: (isInputMuted) => set({ isInputMuted }),
  setSystemStatus: (status) => set({ systemStatus: status }),
  setHudData: (data) => set({ hudData: data }),
  setTimer: (updater) => set((state) => ({
    timer: typeof updater === 'function' ? updater(state.timer) : updater
  })),
  setIsLiveConnected: (isLiveConnected) => set({ isLiveConnected }),
  setIsListening: (isListening) => set({ isListening }),
  setIsSpeaking: (isSpeaking) => set({ isSpeaking })
}));
