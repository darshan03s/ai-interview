import { useAuth } from "@/features/auth";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { startInterview, continueInterview, getMessagesHistory, spellCheck } from "@/api";
import type { InterviewType, MessageType } from "@/types";
import { SendIcon, PlayIcon, Loader2, FileText, CirclePlay, SpellCheck, Mic } from "lucide-react";
import { devDir, devLog } from "@/utils/devUtils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import Report from "./components/Report";
import { useParams } from "react-router-dom";

const Interview = () => {
    const { interviewId } = useParams();
    const [startedInterview, setStartedInterview] = useState<boolean>(false);
    const [startingInterview, setStartingInterview] = useState<boolean>(false);
    const [isStreamingResponse, setIsStreamingResponse] = useState<boolean>(false);
    const [currentStreamingMessage, setCurrentStreamingMessage] = useState<string>("");
    const { session, authLoading } = useAuth();
    const [interview, setInterview] = useState<InterviewType | null>(null);
    const [userMessage, setUserMessage] = useState<string>("");
    const [messagesHistory, setMessagesHistory] = useState<MessageType[]>([]);
    const [fetchingMessages, setFetchingMessages] = useState<boolean>(false);
    const [autoPlayTTS, setAutoPlayTTS] = useState<boolean>(true);
    const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
    const [spellChecking, setSpellChecking] = useState<boolean>(false);
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const finalTranscriptRef = useRef<string>('');
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }

    useEffect(() => {
        scrollToBottom();
    }, [messagesHistory]);

    const startInterviewWithAI = async () => {
        const token = session?.access_token;
        if (!token) {
            toast.error('User not signed in');
            console.error('User not signed in');
            return;
        }
        try {
            setStartingInterview(true);
            const response = await startInterview(token, interviewId!);
            if (!response.ok) {
                if (response.status >= 400 && response.status < 500) {
                    toast.error('Unable to start interview. Client error')
                    console.error(`Failed to start interview: Client error (${response.status})`)
                    return
                } else if (response.status >= 500) {
                    toast.error('Unable to start interview. Server error')
                    console.error(`Failed to start interview: Server error (${response.status})`)
                    return
                }
                toast.error('Unable to start interview. Unknown error')
                console.error(`Failed to start interview: Unknown error (${response.status})`)
                return
            }

            const startInterviewResponse = await response.json();

            if (startInterviewResponse.error) {
                toast.error(startInterviewResponse.error.message);
                console.error('Failed to start interview, Error from server:', startInterviewResponse.error);
                return;
            }

            if (!startInterviewResponse) {
                toast.error('Failed to start interview');
                console.error('Failed to start interview');
                return;
            }

            setInterview(startInterviewResponse.data);
        } catch (error) {
            toast.error('Failed to start interview, Unknown error');
            console.error('Failed to start interview, Unknown error:', error);
        } finally {
            setStartingInterview(false);
            setStartedInterview(true);
        }
    };

    const sendMessage = async () => {
        if (!userMessage.trim()) return;
        if (interview?.is_completed) {
            toast.info("Interview is already completed");
            return;
        }
        const token = session?.access_token;
        if (!token) {
            toast.error('User not signed in');
            console.error('User not signed in');
            return;
        }

        // Add user message to history immediately
        const newUserMessage: MessageType = { role: "user", message: userMessage };
        setMessagesHistory(prev => [...prev, newUserMessage]);
        const currentMessage = userMessage;
        setUserMessage("");
        setCurrentStreamingMessage("");

        try {
            setIsStreamingResponse(true);
            const response = await continueInterview(token, interviewId!, currentMessage);

            if (!response.ok) {
                if (response.status >= 400 && response.status < 500) {
                    toast.error('Unable to send message. Client error')
                    console.error(`Failed to send message: Client error (${response.status})`)
                    return
                } else if (response.status >= 500) {
                    toast.error('Unable to send message. Server error')
                    console.error(`Failed to send message: Server error (${response.status})`)
                    return
                }
                toast.error('Unable to send message. Unknown error')
                console.error(`Failed to send message: Unknown error (${response.status})`)
                return
            }

            try {
                const reader = response.body?.getReader();
                if (!reader) {
                    toast.error("ReadableStream not supported");
                    console.error("ReadableStream not supported");
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
                const newModelMessage: MessageType = { role: "model", message: chunks };
                if (autoPlayTTS) {
                    playAudioMessage(chunks);
                }
                setMessagesHistory(prev => [...prev, newModelMessage]);
                if (chunks.includes("Thank you for your time. We will get back to you soon.")) {
                    setInterview((prev) => {
                        if (!prev) return null;
                        return {
                            ...prev,
                            is_completed: true
                        };
                    });
                }
            } catch (error) {
                const resJson = await response.json();
                if (resJson.error) {
                    toast.error(resJson.error.message);
                    console.error('Failed to send message, Error from server:', resJson.error, error);
                }

                if (resJson.message) {
                    toast.info(resJson.message);
                }
            } finally {
                setIsStreamingResponse(false);
                setCurrentStreamingMessage("");
            }

        } catch (error) {
            toast.error('Unknown error from server');
            console.error('Unknown error from server:', error);
        } finally {
            setIsStreamingResponse(false);
            setCurrentStreamingMessage("");
        }
    }

    const getMessages = async () => {
        const token = session?.access_token;
        if (!token) {
            toast.error('User not signed in');
            console.error('User not signed in');
            return;
        }

        try {
            setFetchingMessages(true);
            const response = await getMessagesHistory(token, interviewId!);
            if (!response.ok) {
                if (response.status >= 400 && response.status < 500) {
                    toast.error('Unable to fetch messages. Client error')
                    console.error(`Failed to fetch messages: Client error (${response.status})`)
                    return
                } else if (response.status >= 500) {
                    toast.error('Unable to fetch messages. Server error')
                    console.error(`Failed to fetch messages: Server error (${response.status})`)
                    return
                }
                toast.error('Unable to fetch messages. Unknown error')
                console.error(`Failed to fetch messages: Unknown error (${response.status})`)
                return
            }

            const messagesResponse = await response.json();

            if (!messagesResponse) {
                toast.error('Failed to get messages');
                console.error('Failed to get messages');
                return;
            }

            if (messagesResponse.error) {
                toast.error(messagesResponse.error.message);
                console.error('Failed to get messages, Error from server:', messagesResponse.error);
                return;
            }

            setMessagesHistory(messagesResponse.data);

        } catch (error) {
            toast.error('Failed to get messages, Unknown error');
            console.error('Failed to get messages, Unknown error:', error);
        } finally {
            setFetchingMessages(false);
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

    const aiSpellCheck = async () => {
        if (interview?.is_completed) {
            toast.info("Interview is already completed");
            return;
        }
        const token = session?.access_token;
        if (!token) {
            toast.error('User not signed in');
            console.error('User not signed in');
            return;
        }

        if (!userMessage.trim()) {
            toast.error('Please enter a message to spell check');
            return;
        }

        try {
            setSpellChecking(true);
            const response = await spellCheck(token, userMessage);
            if (!response.ok) {
                if (response.status >= 400 && response.status < 500) {
                    toast.error('Unable to spell check. Client error')
                    console.error(`Failed to spell check: Client error (${response.status})`)
                    return
                } else if (response.status >= 500) {
                    toast.error('Unable to spell check. Server error')
                    console.error(`Failed to spell check: Server error (${response.status})`)
                    return
                }
                toast.error('Unable to spell check. Unknown error')
                console.error(`Failed to spell check: Unknown error (${response.status})`)
                return
            }

            const spellCheckResponse = await response.json();

            if (!spellCheckResponse) {
                toast.error('Failed to spell check');
                console.error('Failed to spell check');
                return;
            }

            if (spellCheckResponse.error) {
                toast.error(spellCheckResponse.error.message);
                console.error('Failed to spell check, Error from server:', spellCheckResponse.error);
                return;
            }

            setUserMessage(spellCheckResponse.data);
        } catch (error) {
            toast.error('Failed to spell check, Unknown error');
            console.error('Failed to spell check, Unknown error:', error);
        } finally {
            setSpellChecking(false);
        }
    }

    const handleVoiceInput = async () => {
        if (interview?.is_completed) {
            toast.info("Interview is already completed");
            return;
        }
        try {
            if (isRecording && recognitionRef.current) {
                recognitionRef.current.stop();
                return;
            }

            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

            if (!SpeechRecognition) {
                toast.error('Speech recognition is not supported in your browser');
                return;
            }

            try {
                await navigator.mediaDevices.getUserMedia({ audio: true });
            } catch (error) {
                toast.error('Microphone permission denied. Please allow microphone access.');
                console.error('Microphone permission denied:', error);
                return;
            }

            const recognition = new SpeechRecognition();
            recognitionRef.current = recognition;
            finalTranscriptRef.current = '';

            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            toast.info('Listening... Press Shift+R or click mic to stop', {
                duration: 1000,
            });

            recognition.onstart = () => {
                setIsRecording(true);
            };

            recognition.onresult = (event) => {
                let interimTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;

                    if (event.results[i].isFinal) {
                        finalTranscriptRef.current += transcript + ' ';
                    } else {
                        interimTranscript += transcript;
                    }
                }

                // Update the textarea with current transcript
                setUserMessage(finalTranscriptRef.current + interimTranscript);
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsRecording(false);
                recognitionRef.current = null;

                switch (event.error) {
                    case 'audio-capture':
                        toast.error('Microphone not accessible. Please check permissions.');
                        break;
                    case 'not-allowed':
                        toast.error('Microphone permission denied.');
                        break;
                    default:
                        toast.error(`Speech recognition error: ${event.error}`);
                }
            };

            recognition.onend = () => {
                setIsRecording(false);
                recognitionRef.current = null;

                const finalText = finalTranscriptRef.current.trim();
                if (finalText) {
                    setUserMessage(finalText);
                }

                finalTranscriptRef.current = '';
            };

            recognition.start();

        } catch (error) {
            console.error('Error with voice input:', error);
            toast.error('Failed to start voice input');
            setIsRecording(false);
            recognitionRef.current = null;
        }
    }

    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
                recognitionRef.current = null;
            }
        };
    }, [interviewId]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            if (e.shiftKey && e.key.toLowerCase() === 'r') {
                e.preventDefault();
                handleVoiceInput();
            }

            if (e.shiftKey && e.key.toLowerCase() === 's') {
                e.preventDefault();
                aiSpellCheck();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [interviewId]);

    useEffect(() => {
        if (!authLoading && interviewId) {
            startInterviewWithAI();
        }
    }, [authLoading, interviewId]);

    useEffect(() => {
        if (startedInterview && interviewId) {
            getMessages();
        }
    }, [startedInterview, interviewId]);

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

    if (startingInterview || !startedInterview) {
        return (
            <div className="max-w-4xl mx-auto min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="interview-container flex flex-col justify-center gap-12 py-4">
            <div className="interview-container-messages flex items-center justify-center gap-4 mx-8 flex-1">
                <div className="interview-container-messages-left w-2/3 space-y-2 h-full flex flex-col gap-2">
                    <div className="resume-url flex items-center justify-center gap-2 h-4">
                        <a
                            href={interview?.resume_url}
                            target="_blank"
                            className="inline-flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group mx-auto"
                        >
                            <FileText className="h-4 w-4 group-hover:scale-110 transition-transform" />
                            View your resume
                        </a>
                    </div>
                    {/* Messages Container */}
                    <div ref={messagesContainerRef} className="chat-section bg-card rounded-2xl ring-1 ring-border shadow-sm overflow-y-auto hide-scrollbar p-4 space-y-4 max-h-[calc(100vh-8rem)] h-[calc(100vh-8rem)]">
                        {!startedInterview ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center text-muted-foreground">
                                    <p className="text-lg font-medium">Your interview will begin shortly...</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {
                                    fetchingMessages ?
                                        <div className="flex items-center justify-center h-full">
                                            <div className="text-center text-muted-foreground">
                                                <p className="text-lg font-medium">Loading...</p>
                                            </div>
                                        </div> : !fetchingMessages && messagesHistory.length === 0 ?
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
                    </div>
                </div>

                {/* Input Section */}
                <div className="bg-card rounded-2xl ring-1 ring-border shadow-sm overflow-hidden h-[-webkit-fill-available] flex-1 flex flex-col">
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
                                        onClick={handleVoiceInput}
                                        disabled={isStreamingResponse || interview?.is_completed}
                                        className={`${isRecording ? 'bg-red-500 animate-pulse' : 'bg-primary'} text-primary-foreground p-2 rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed! transition-all duration-200 hover:scale-105 active:scale-95`}
                                    >
                                        <Mic className="h-4 w-4" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {isRecording ? 'Stop recording (Shift+R)' : 'Start recording (Shift+R)'}
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={aiSpellCheck}
                                        disabled={!userMessage.trim() || spellChecking || interview?.is_completed}
                                        className={`bg-primary text-primary-foreground p-2 rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed! transition-all duration-200 hover:scale-105 active:scale-95`}
                                    >
                                        {spellChecking ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <SpellCheck className="h-4 w-4" />
                                        )}
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    Spell check (Shift+S)
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={toggleAutoPlayTTS}
                                        disabled={interview?.is_completed}
                                        className={`${autoPlayTTS ? 'bg-green-500' : 'bg-red-500'} text-primary-foreground p-2 rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed! transition-all duration-200 hover:scale-105 active:scale-95`}
                                    >
                                        <CirclePlay className="h-4 w-4" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {autoPlayTTS ? 'Disable TTS' : 'Enable TTS'}
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={sendMessage}
                                        disabled={!userMessage.trim() || isStreamingResponse || interview?.is_completed}
                                        className={`bg-primary text-primary-foreground p-2 rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed! transition-all duration-200 hover:scale-105 active:scale-95`}
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

            {interview?.is_completed && (
                <Report interviewId={interviewId!} />
            )}
        </div>
    );
};

export default Interview;