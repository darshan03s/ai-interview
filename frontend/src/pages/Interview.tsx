import { useAuth } from "@/features/auth";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { continueInterview, startInterview, getMessagesHistory } from "@/api";
import type { Interview } from "@/types";
import { SendIcon, PlayIcon, Loader2, FileText, CirclePlay, SpellCheck } from "lucide-react";
import { devDir, devLog } from "@/utils/devUtils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Message {
    role: "user" | "model";
    message: string;
}

const Interview = () => {
    const [startedInterview, setStartedInterview] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isStreamingResponse, setIsStreamingResponse] = useState<boolean>(false);
    const [currentStreamingMessage, setCurrentStreamingMessage] = useState<string>("");
    const { session, authLoading } = useAuth();
    const { interviewId } = useParams();
    const [interview, setInterview] = useState<Interview | null>(null);
    const [userMessage, setUserMessage] = useState<string>("");
    const [messagesHistory, setMessagesHistory] = useState<Message[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [autoPlayTTS, setAutoPlayTTS] = useState<boolean>(true);
    const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);

    const startInterviewWithAI = async () => {
        if (startedInterview) return;
        setIsLoading(true);
        const token = session?.access_token;
        if (!token) {
            console.error('User not signed in');
            return;
        }
        try {
            const response = await startInterview(token, interviewId!);
            if (!response.ok) {
                toast.error('Failed to prepare interview, Bad response from server');
                console.error('Failed to prepare interview, Bad response from server');
                return;
            }
            const interviewResponse = await response.json();

            if (!interviewResponse) {
                toast.error('Failed to prepare interview');
                console.error('Failed to prepare interview');
                return;
            }

            setInterview(interviewResponse.interview);
        } catch (error) {
            toast.error('Failed to prepare interview, Error from server');
            console.error('Failed to prepare interview, Error from server:', error);
        } finally {
            setStartedInterview(true);
            setIsLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!userMessage.trim()) return;
        const token = session?.access_token;
        if (!token) {
            console.error('User not signed in');
            return;
        }

        // Add user message to history immediately
        const newUserMessage: Message = { role: "user", message: userMessage };
        setMessagesHistory(prev => [...prev, newUserMessage]);
        const currentMessage = userMessage;
        setUserMessage("");
        setIsStreamingResponse(true);
        setCurrentStreamingMessage("");

        try {
            const response = await continueInterview(token, interviewId!, currentMessage);

            if (!response.ok) {
                toast.error("Error sending prompt");
                setIsStreamingResponse(false);
                return;
            }

            const reader = response.body?.getReader();
            if (!reader) {
                toast.error("ReadableStream not supported");
                setIsStreamingResponse(false);
                return;
            }

            const decoder = new TextDecoder();
            let chunks = "";

            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                chunks += chunk;
                setCurrentStreamingMessage(chunks);
            }

            // Add the complete AI response to messages history
            const newModelMessage: Message = { role: "model", message: chunks };
            if (autoPlayTTS) {
                playAudioMessage(chunks);
            }
            setMessagesHistory(prev => [...prev, newModelMessage]);

        } catch (error) {
            toast.error('Failed to send message, Error from server');
            console.error('Failed to send message, Error from server:', error);
        } finally {
            setIsStreamingResponse(false);
            setCurrentStreamingMessage("");
        }
    }

    const getMessages = async () => {
        const token = session?.access_token;
        if (!token) {
            console.error('User not signed in');
            return;
        }

        try {
            const response = await getMessagesHistory(token, interviewId!);
            if (!response.ok) {
                toast.error('Failed to get messages, Bad response from server');
                console.error('Failed to get messages, Bad response from server');
                return;
            }
            const messagesResponse = await response.json();

            if (!messagesResponse) {
                toast.error('Failed to get messages');
                console.error('Failed to get messages');
                return;
            }

            setMessagesHistory(messagesResponse.messagesHistory);

        } catch (error) {
            toast.error('Failed to get messages, Error from server');
            console.error('Failed to get messages, Error from server:', error);
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

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

            devLog(voice);
            utterance.voice = voice;

            speechSynthesis.speak(utterance);
        } catch (error) {
            console.error('Error playing audio:', error);
            toast.error('Failed to play audio');
        }
    };

    const toggleAutoPlayTTS = () => {
        if (autoPlayTTS) {
            toast.info("Disabled auto play TTS", {
                duration: 1500,
            });
        } else {
            toast.info("Enabled auto play TTS", {
                duration: 1500,
            });
        }
        setAutoPlayTTS(!autoPlayTTS);
    }

    const spellCheck = () => {
        toast.info("Spell check coming soon", {
            duration: 1500,
        });
    }

    useEffect(() => {
        if (!authLoading) {
            startInterviewWithAI();
        }
    }, [authLoading]);

    useEffect(() => {
        if (startedInterview && messagesHistory.length === 0) {
            getMessages();
        }
    }, [startedInterview]);

    useEffect(() => {
        const initializeVoice = () => {
            try {
                if (!('speechSynthesis' in window)) {
                    toast.error('Text-to-speech is not supported in your browser');
                    return;
                }

                const voices = speechSynthesis.getVoices();
                devDir(voices);

                let selectedVoice = voices.find(voice => voice.name.startsWith('Google UK English Male'));

                if (!selectedVoice) {
                    selectedVoice = voices.find(voice =>
                        voice.lang.startsWith('en') && voice.name.toLowerCase().includes('male')
                    );
                }

                if (!selectedVoice) {
                    selectedVoice = voices.find(voice => voice.lang.startsWith('en'));
                }

                devLog(selectedVoice);
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

    if (isLoading || !startedInterview) {
        return (
            <div className="max-w-4xl mx-auto min-h-[600px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Preparing your interview...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center gap-4 mx-8 min-h-[calc(80vh)] h-[calc(80vh)] my-4">
            <div className="w-2/3 py-1 space-y-2 h-full">
                <a
                    href={interview?.resume_url}
                    target="_blank"
                    className="inline-flex items-center w-full justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group mx-auto"
                >
                    <FileText className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    View your resume
                </a>
                {/* Messages Container */}
                <div className="bg-card h-full rounded-2xl ring-1 ring-border shadow-sm overflow-hidden">
                    <div className="h-full overflow-y-auto hide-scrollbar p-4 space-y-4">
                        {!startedInterview ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center text-muted-foreground">
                                    <p className="text-lg font-medium">Your interview will begin shortly...</p>
                                    <p className="text-sm">AI is preparing questions based on your resume</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {messagesHistory.length === 0
                                    ?
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-center text-muted-foreground">
                                            <p className="text-lg font-medium">Type 'Let's Start' to start the interview</p>
                                        </div>
                                    </div>
                                    :
                                    messagesHistory.map((message, index) => (
                                        <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            {message.role === 'model' && (
                                                <div className="flex items-start gap-3 max-w-[80%]">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                                                        AI
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <div className="bg-muted rounded-2xl rounded-tl-md p-4 shadow-sm">
                                                            <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                                                                {message.message}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => playAudioMessage(message.message)}
                                                            className="self-start flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors group"
                                                        >
                                                            <PlayIcon className="h-3 w-3 group-hover:scale-110 transition-transform" />
                                                            Play audio
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                            {message.role === 'user' && (
                                                <div className="flex items-start gap-3 max-w-[80%]">
                                                    <div className="flex flex-col gap-2">
                                                        <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-md p-4 shadow-sm">
                                                            <p className="whitespace-pre-wrap leading-relaxed">
                                                                {message.message}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-semibold text-sm shrink-0">
                                                        {interview?.username?.[0]?.toUpperCase() || 'U'}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))

                                }

                                {/* Streaming Response */}
                                {isStreamingResponse && (
                                    <div className="flex justify-start">
                                        <div className="flex items-start gap-3 max-w-[80%]">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                                                AI
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <div className="bg-muted rounded-2xl rounded-tl-md p-4 shadow-sm">
                                                    <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                                                        {currentStreamingMessage}
                                                        <span className="inline-block w-2 h-4 bg-primary/60 animate-pulse ml-1"></span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
            </div>

            {/* Input Section */}
            <div className="bg-card rounded-2xl ring-1 ring-border shadow-sm overflow-hidden flex-1 h-full flex flex-col">
                <div className="p-4 flex-1">
                    <textarea
                        value={userMessage}
                        onChange={(e) => setUserMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Type your answer here..."
                        className="w-full bg-transparent resize-none outline-none placeholder:text-muted-foreground h-full leading-relaxed"
                        disabled={isStreamingResponse}
                    />
                </div>
                <div className="px-4 py-4 flex items-center justify-between h-[100px]">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Enter to send • Shift+Enter for new line</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={spellCheck}
                                    className={`bg-primary text-primary-foreground p-2 rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95`}
                                >
                                    <SpellCheck className="h-4 w-4" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                Spell check
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={toggleAutoPlayTTS}
                                    className={`${autoPlayTTS ? 'bg-green-500' : 'bg-red-500'} text-primary-foreground p-2 rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95`}
                                >
                                    <CirclePlay className="h-4 w-4" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                {autoPlayTTS ? 'Auto play TTS' : 'Disable TTS'}
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={sendMessage}
                                    disabled={!userMessage.trim() || isStreamingResponse}
                                    className="bg-primary text-primary-foreground p-2 rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
                                >
                                    {isStreamingResponse ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <SendIcon className="h-4 w-4" />
                                    )}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                Send message
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Interview;