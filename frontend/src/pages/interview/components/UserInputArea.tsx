import useInterview from "../hooks/useInterview"
import { memo, useEffect, useRef, useState } from "react";
import { toast } from "sonner"
import { useAuth } from "@/features/auth";
import UserInputActions from "./UserInputActions";
import { endInterview } from "@/api";
import useChatStore from "../stores/chatStore";
import useInterviewStore from "../stores/interviewStore";
import useSpeechStore from "../stores/speechStore";

const UserInputArea = () => {
    const { session } = useAuth();
    const [userMessage, setUserMessage] = useState<string>("");
    const { addMessage, isResponseStreaming } = useChatStore();
    const { speechRecognition, setSpeechRecognition, isAiResponsePlaying } = useSpeechStore();
    const { interviewId, interview, isRecording, setIsInterviewCompleted, setIsRecording, setIsInterviewEnding, isInterviewStarted, isInterviewCompleted } = useInterviewStore();
    const finalTranscriptRef = useRef<string>('');
    const { sendMessage } = useInterview();

    const handleEndInterview = async () => {
        if (!interview) {
            toast.error('Interview not found. Bad request');
            return;
        }
        const token = session?.access_token;
        if (!token) {
            toast.error('User not signed in');
            return;
        }
        try {
            setIsInterviewEnding(true);
            await endInterview(token, interview.interview_id!);
            setIsInterviewCompleted(true);
        } catch (error) {
            toast.error('Failed to end interview');
            console.error('Failed to end interview', error);
        } finally {
            setIsInterviewEnding(false);
        }
    }

    const executeSendMessage = () => {
        const token = session?.access_token;
        if (!token) {
            toast.error('User not signed in');
            console.error('User not signed in');
            return;
        }

        if (userMessage.trim().length === 0) return;
        if (interview?.is_completed) {
            toast.info('Interview is already completed');
            return;
        }

        addMessage({ role: "user", message: userMessage });
        sendMessage(userMessage, token, interviewId!);
        setUserMessage('');
    };

    // Handle keyboard events (only Enter key)
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            executeSendMessage();
        }
    };

    // Handle button click
    const handleSendButtonClick = () => {
        executeSendMessage();
    };

    const handleVoiceInput = async () => {
        if (interview?.is_completed) {
            toast.info('Interview is already completed');
            return;
        }
        try {
            if (isRecording && speechRecognition) {
                speechRecognition.stop();
                return;
            }

            const SpeechRecognition =
                window.SpeechRecognition || window.webkitSpeechRecognition;

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
            setSpeechRecognition(recognition);
            finalTranscriptRef.current = '';

            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            toast.info('Listening... Press Shift+R or click mic to stop', {
                duration: 3000,
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
                setIsRecording(false);
                setSpeechRecognition(null);

                switch (event.error) {
                    case 'audio-capture':
                        toast.error('Microphone not accessible. Please check permissions.');
                        break;
                    case 'not-allowed':
                        toast.error('Microphone permission denied.');
                        break;
                }
            };

            recognition.onend = () => {
                setIsRecording(false);
                setSpeechRecognition(null);

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
            setSpeechRecognition(null);
        }
    };

    useEffect(() => {
        if (!isInterviewStarted) return;
        if (interview?.is_completed || isInterviewCompleted) return;
        if (!isAiResponsePlaying) {
            handleVoiceInput();
        }
    }, [isInterviewStarted, interview?.is_completed, isInterviewCompleted, isAiResponsePlaying]);

    return (
        <div className="bg-card rounded-2xl ring-1 ring-border shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-3 pb-0 xl:pb-3 flex-1">
                <div className="hidden xl:flex xl:gap-2 w-full h-full">
                    <textarea
                        value={userMessage}
                        onChange={(e) => setUserMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your answer here..."
                        className="w-full text-xs xl:text-base hide-scrollbar bg-transparent resize-none outline-none placeholder:text-muted-foreground h-25 xl:h-full leading-relaxed"
                        disabled={isResponseStreaming}
                    />
                    <div className="user-input-actions-xl flex flex-col gap-2">
                        <UserInputActions
                            handleEndInterview={handleEndInterview}
                            handleVoiceInput={handleVoiceInput}
                            handleSendMessage={handleSendButtonClick}
                            userMessage={userMessage}
                            setUserMessage={setUserMessage}
                        />
                    </div>
                </div>
                <textarea
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your answer here..."
                    className="xl:hidden w-full text-xs xl:text-base hide-scrollbar bg-transparent resize-none outline-none placeholder:text-muted-foreground h-25 xl:h-full leading-relaxed"
                    disabled={isResponseStreaming}
                />
            </div>
            <div className="px-3 py-3 flex flex-col xl:flex-row items-center justify-between">
                <div className="text-xs text-muted-foreground hidden xl:flex items-center gap-2">
                    <span>Enter to send • Shift+Enter for new line</span>
                </div>
                <div className="flex items-center gap-2 xl:hidden">
                    <UserInputActions
                        handleEndInterview={handleEndInterview}
                        handleVoiceInput={handleVoiceInput}
                        handleSendMessage={handleSendButtonClick}
                        userMessage={userMessage}
                        setUserMessage={setUserMessage}
                    />
                </div>
            </div>
        </div>
    )
}

export default memo(UserInputArea);