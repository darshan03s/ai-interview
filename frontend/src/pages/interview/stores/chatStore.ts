import type { MessageType } from '@/types';
import { create } from 'zustand';

interface ChatStore {
    messagesHistory: MessageType[];
    setMessagesHistory: (messagesHistory: MessageType[]) => void;
    addMessage: (message: MessageType) => void;
    currentStreamingMessage: string;
    setCurrentStreamingMessage: (message: string) => void;
    isResponseLoading: boolean;
    setIsResponseLoading: (isLoading: boolean) => void;
    ws: WebSocket | null;
    setWs: (ws: WebSocket | null) => void;
}

const useChatStore = create<ChatStore>((set) => ({
    messagesHistory: [],
    currentStreamingMessage: '',
    isResponseLoading: false,
    setMessagesHistory: (messagesHistory: MessageType[]) => set({ messagesHistory }),
    addMessage: (message: MessageType) =>
        set((state) => ({ messagesHistory: [...state.messagesHistory, message] })),
    setCurrentStreamingMessage: (message: string) => set({ currentStreamingMessage: message }),
    setIsResponseLoading: (isLoading: boolean) => set({ isResponseLoading: isLoading }),
    ws: null,
    setWs: (ws: WebSocket | null) => set({ ws }),
}));

export default useChatStore;
