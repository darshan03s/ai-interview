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
    isResponseStreaming: boolean;
    setIsResponseStreaming: (isStreaming: boolean) => void;
}

const useChatStore = create<ChatStore>((set) => ({
    messagesHistory: [],
    currentStreamingMessage: '',
    isResponseLoading: false,
    isResponseStreaming: false,
    setMessagesHistory: (messagesHistory: MessageType[]) => set({ messagesHistory }),
    addMessage: (message: MessageType) =>
        set((state) => ({ messagesHistory: [...state.messagesHistory, message] })),
    setCurrentStreamingMessage: (message: string) => set({ currentStreamingMessage: message }),
    setIsResponseLoading: (isLoading: boolean) => set({ isResponseLoading: isLoading }),
    setIsResponseStreaming: (isStreaming: boolean) => set({ isResponseStreaming: isStreaming }),
}));

export default useChatStore;
