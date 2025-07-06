import { toast } from 'sonner';
import useSpeechStore from '../stores/speechStore';

export default function useTextToSpeech() {
    const autoPlayTextToSpeech = useSpeechStore((state) => state.autoPlayTextToSpeech);
    const setAutoPlayTextToSpeech = useSpeechStore((state) => state.setAutoPlayTextToSpeech);
    const setIsAiResponsePlaying = useSpeechStore((state) => state.setIsAiResponsePlaying);
    const voice = useSpeechStore((state) => state.voice);
    const setCurrentlyPlayingMessage = useSpeechStore((state) => state.setCurrentlyPlayingMessage);

    const playAudioMessage = async (message: string): Promise<void> => {
        try {
            if (!('speechSynthesis' in window)) {
                toast.error('Text-to-speech is not supported in your browser');
                return;
            }

            speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(message);
            utterance.rate = 1;
            utterance.pitch = 1;
            utterance.volume = 1;

            utterance.voice = voice;

            utterance.onstart = () => {
                setIsAiResponsePlaying(true);
                setCurrentlyPlayingMessage(message);
            };

            speechSynthesis.speak(utterance);

            utterance.onend = () => {
                setIsAiResponsePlaying(false);
                setCurrentlyPlayingMessage(null);
            };
        } catch (error) {
            console.error('Error playing audio:', error);
            toast.error('Failed to play audio');
            setIsAiResponsePlaying(false);
            setCurrentlyPlayingMessage(null);
        }
    };

    const toggleAutoPlayTextToSpeech = () => {
        if (autoPlayTextToSpeech) {
            toast.info('Disabled auto play Text-to-Speech', {
                duration: 1500,
            });
        } else {
            toast.info('Enabled auto play Text-to-Speech', {
                duration: 1500,
            });
        }
        setAutoPlayTextToSpeech(!autoPlayTextToSpeech);
    };

    return {
        playAudioMessage,
        toggleAutoPlayTextToSpeech,
    };
}
