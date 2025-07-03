import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useParams } from 'react-router-dom';

export default function useTTS() {
    const { interviewId } = useParams();
    const [autoPlayTTS, setAutoPlayTTS] = useState<boolean>(true);
    const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const [isAiResponsePlaying, setIsAiResponsePlaying] = useState<boolean>(false);

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
            };

            speechSynthesis.speak(utterance);

            utterance.onend = () => {
                setIsAiResponsePlaying(false);
            };
        } catch (error) {
            console.error('Error playing audio:', error);
            toast.error('Failed to play audio');
        }
    };

    const toggleAutoPlayTTS = () => {
        if (autoPlayTTS) {
            toast.info('Disabled auto play TTS', {
                duration: 1500,
            });
        } else {
            toast.info('Enabled auto play TTS', {
                duration: 1500,
            });
        }
        setAutoPlayTTS(!autoPlayTTS);
    };

    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
                recognitionRef.current = null;
            }
        };
    }, [interviewId]);

    useEffect(() => {
        const initializeVoice = () => {
            try {
                if (!('speechSynthesis' in window)) {
                    toast.error('Text-to-speech is not supported in your browser');
                    return;
                }

                const voices = speechSynthesis.getVoices();

                let selectedVoice = voices.find((voice) =>
                    voice.name.startsWith('Google UK English Male')
                );

                if (!selectedVoice) {
                    selectedVoice = voices.find(
                        (voice) =>
                            voice.lang.startsWith('en') && voice.name.toLowerCase().includes('male')
                    );
                }

                if (!selectedVoice) {
                    selectedVoice = voices.find((voice) => voice.lang.startsWith('en'));
                }

                if (selectedVoice) {
                    setVoice(selectedVoice);
                }
            } catch (error) {
                console.error('Error initializing voice:', error);
                toast.error('Failed to initialize voice');
            }
        };

        initializeVoice();

        const handleVoicesChanged = () => {
            initializeVoice();
        };

        speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

        return () => {
            speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        };
    }, []);

    return {
        playAudioMessage,
        toggleAutoPlayTTS,
        autoPlayTTS,
        voice,
        setVoice,
        recognitionRef,
        isAiResponsePlaying,
    };
}
