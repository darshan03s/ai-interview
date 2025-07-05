import { create } from 'zustand';

interface SpeechStore {
    autoPlayTextToSpeech: boolean;
    setAutoPlayTextToSpeech: (autoPlayTextToSpeech: boolean) => void;
    isAiResponsePlaying: boolean;
    setIsAiResponsePlaying: (isAiResponsePlaying: boolean) => void;
    currentlyPlayingMessage: string | null;
    setCurrentlyPlayingMessage: (message: string | null) => void;
    voice: SpeechSynthesisVoice | null;
    setVoice: (voice: SpeechSynthesisVoice | null) => void;
    speechRecognition: SpeechRecognition | null;
    setSpeechRecognition: (speechRecognition: SpeechRecognition | null) => void;
}

const useSpeechStore = create<SpeechStore>((set) => ({
    autoPlayTextToSpeech: true,
    setAutoPlayTextToSpeech: (autoPlayTextToSpeech: boolean) => set({ autoPlayTextToSpeech }),
    isAiResponsePlaying: false,
    setIsAiResponsePlaying: (isAiResponsePlaying: boolean) => set({ isAiResponsePlaying }),
    voice: null,
    setVoice: (voice: SpeechSynthesisVoice | null) => set({ voice }),
    speechRecognition: null,
    setSpeechRecognition: (speechRecognition: SpeechRecognition | null) =>
        set({ speechRecognition }),
    currentlyPlayingMessage: null,
    setCurrentlyPlayingMessage: (message: string | null) =>
        set({ currentlyPlayingMessage: message }),
}));

export default useSpeechStore;
