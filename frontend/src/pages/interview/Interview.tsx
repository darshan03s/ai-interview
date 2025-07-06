import { useEffect, useRef } from "react";
import Report from "./components/Report";
import useInterview from "./hooks/useInterview";
import ViewResume from "./components/ViewResume";
import PageLoading from "./components/PageLoading";
import InterviewLoading from "./components/InterviewLoading";
import DisplayMessages from "./components/DisplayMessages";
import UserInputArea from "./components/UserInputArea";
import { useParams } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { Badge } from "@/components/ui/badge";
import useInterviewStore from "./stores/interviewStore";
import { toast } from "sonner";
import useSpeechStore from "./stores/speechStore";
import useChatStore from "./stores/chatStore";

const Interview = () => {
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const { interviewId } = useParams();
    const { authLoading } = useAuth();
    const setInterviewId = useInterviewStore((state) => state.setInterviewId);
    const speechRecognition = useSpeechStore((state) => state.speechRecognition);
    const setSpeechRecognition = useSpeechStore((state) => state.setSpeechRecognition);
    const setVoice = useSpeechStore((state) => state.setVoice);

    const {
        fetchReport,
        startInterviewWithAI,
    } = useInterview();

    const { messagesHistory, setWs } = useChatStore();
    const isInterviewStarted = useInterviewStore((state) => state.isInterviewStarted);
    const isInterviewCompleted = useInterviewStore((state) => state.isInterviewCompleted);
    const setIsInterviewCompleted = useInterviewStore((state) => state.setIsInterviewCompleted);
    const interview = useInterviewStore((state) => state.interview);
    const report = useInterviewStore((state) => state.report);
    const isInterviewStarting = useInterviewStore((state) => state.isInterviewStarting);
    const isRecording = useInterviewStore((state) => state.isRecording);

    useEffect(() => {
        if (interviewId) {
            setInterviewId(interviewId);
        }
    }, [interviewId, setInterviewId]);

    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [messagesHistory]);

    useEffect(() => {
        if (!authLoading && interviewId) {
            startInterviewWithAI();
        }
    }, [authLoading, interviewId, startInterviewWithAI]);

    useEffect(() => {
        if (!authLoading && isInterviewStarted && interviewId && !interview?.is_completed) {
            const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
            const ws = new WebSocket(`${wsProtocol}://${import.meta.env.VITE_API_URL.split("//")[1]}`);

            ws.onopen = () => {
                console.log('[WS] Connected to server');
                ws.send(`START_INTERVIEW ${interview?.user_id} ${interview?.interview_id}`);
            };

            ws.onerror = (error) => {
                console.error('[WS] Connection error:', error);
                toast.error('Failed to connect to interview service');
            };

            setWs(ws);

            ws.onclose = () => {
                console.log('[WS] Connection closed');
            }

            return () => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(`END_INTERVIEW ${interview?.user_id} ${interview?.interview_id}`);
                }
                ws.close();
            };
        }
    }, [authLoading, isInterviewStarted, interviewId, setWs, interview?.is_completed]);

    useEffect(() => {
        if (interview?.is_completed) {
            fetchReport();
        }
    }, [interview?.is_completed, report?.is_created, fetchReport]);

    useEffect(() => {
        return () => {
            if (speechRecognition) {
                speechRecognition.stop();
                setSpeechRecognition(null);
                setIsInterviewCompleted(false);
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


    if (isInterviewStarting || !isInterviewStarted) {
        return (
            <PageLoading />
        );
    }

    return (
        <div className="flex flex-col justify-center gap-12 py-4">
            <div className="interview-container flex flex-col xl:flex-row items-center justify-center gap-4 mx-4 md:mx-8 flex-1">
                <div className="interview-container-conversation w-full xl:w-2/3 space-y-2 flex flex-col gap-2 max-h-[calc(100vh-18rem)] h-[calc(100vh-18rem)] xl:max-h-[calc(100vh-6rem)] xl:h-[calc(100vh-6rem)]">
                    <div className="flex items-center justify-between gap-2 h-4">
                        <ViewResume resumeUrl={interview?.resume_url} />
                        <Badge variant="secondary" className={`text-xs ${isRecording ? "bg-red-500" : ""}`}>
                            {isRecording ? "Recording..." : "Not recording"}
                        </Badge>
                    </div>
                    {/* Messages Container */}
                    <div ref={messagesContainerRef} className="chat-section bg-card rounded-2xl ring-1 ring-border shadow-sm overflow-y-auto hide-scrollbar p-4 space-y-4 h-full">
                        {!isInterviewStarted ? (
                            <InterviewLoading />
                        ) : (
                            <DisplayMessages />
                        )}
                    </div>
                </div>

                {/* Input Section */}
                <div className="xl:h-[-webkit-fill-available] flex flex-col gap-2 space-y-2 flex-1 w-full">
                    <div className="interview-user-info h-4 flex space-x-2">
                        <Badge variant="secondary" className="p-2.5 text-xs ">
                            {interview?.interview_type ? `${interview.interview_type.charAt(0).toUpperCase() + interview.interview_type.slice(1)} Interview` : "Interview"}
                        </Badge>
                        <Badge variant={interview?.is_completed || isInterviewCompleted ? "default" : "secondary"} className="p-2.5 text-xs">
                            {interview?.is_completed || isInterviewCompleted ? "Completed" : "In Progress"}
                        </Badge>
                        <Badge variant="secondary" className="p-2.5">
                            Created at: {interview?.created_at ? new Date(interview.created_at).toLocaleDateString() : "N/A"}
                        </Badge>
                    </div>
                    <div className="flex-1">
                        <UserInputArea />
                    </div>
                </div>
            </div>

            {interview?.is_completed || isInterviewCompleted ? (
                <Report />
            ) : null}
        </div>
    );
};

export default Interview;