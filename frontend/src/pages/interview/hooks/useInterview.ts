import { continueInterview, getMessagesHistory, getReport, startInterview } from '@/api';
import { useAuth } from '@/features/auth';
import type { InterviewType, MessageType, ReportType } from '@/types';
import { useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import useTTS from './useTTS';
import { useParams } from 'react-router-dom';
import { devLog } from '@/utils/devUtils';

export default function useInterview() {
    const { interviewId } = useParams();
    const { session, authLoading } = useAuth();
    const [isInterviewStarting, setIsInterviewStarting] = useState<boolean>(false);
    const [isInterviewStarted, setIsInterviewStarted] = useState<boolean>(false);
    const [interview, setInterview] = useState<InterviewType | null>(null);
    const [isStreamingResponse, setIsStreamingResponse] = useState<boolean>(false);
    const [isFetchingMessages, setIsFetchingMessages] = useState<boolean>(false);
    const [currentStreamingMessage, setCurrentStreamingMessage] = useState<string>('');
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [messagesHistory, setMessagesHistory] = useState<MessageType[]>([]);
    const [userMessage, setUserMessage] = useState<string>('');
    const finalTranscriptRef = useRef<string>('');
    const [report, setReport] = useState<ReportType | undefined>();
    const [fetchingReport, setFetchingReport] = useState(false);
    const [isInterviewCompleted, setIsInterviewCompleted] = useState(false);

    const { playAudioMessage, autoPlayTTS, recognitionRef } = useTTS();

    const startInterviewWithAI = useCallback(async () => {
        const token = session?.access_token;
        if (!token) {
            toast.error('User not signed in');
            console.error('User not signed in');
            return;
        }
        try {
            devLog('Starting interview with AI');
            setIsInterviewStarting(true);
            const response = await startInterview(token, interviewId!);
            if (!response.ok) {
                if (response.status >= 400 && response.status < 500) {
                    toast.error('Unable to start interview. Client error');
                    console.error(`Failed to start interview: Client error (${response.status})`);
                    return;
                } else if (response.status >= 500) {
                    toast.error('Unable to start interview. Server error');
                    console.error(`Failed to start interview: Server error (${response.status})`);
                    return;
                }
                toast.error('Unable to start interview. Unknown error');
                console.error(`Failed to start interview: Unknown error (${response.status})`);
                return;
            }

            const startInterviewResponse = await response.json();

            if (startInterviewResponse.error) {
                toast.error(startInterviewResponse.error.message);
                console.error(
                    'Failed to start interview, Error from server:',
                    startInterviewResponse.error
                );
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
            setIsInterviewStarting(false);
            setIsInterviewStarted(true);
        }
    }, [session?.access_token, interviewId]);

    const sendMessage = useCallback(async () => {
        if (!userMessage.trim()) return;
        if (interview?.is_completed) {
            toast.info('Interview is already completed');
            return;
        }
        const token = session?.access_token;
        if (!token) {
            toast.error('User not signed in');
            console.error('User not signed in');
            return;
        }

        // Add user message to history immediately
        const newUserMessage: MessageType = { role: 'user', message: userMessage };
        setMessagesHistory((prev) => [...prev, newUserMessage]);
        const currentMessage = userMessage;
        setUserMessage('');
        setCurrentStreamingMessage('');

        try {
            devLog('Sending message to AI');
            setIsStreamingResponse(true);
            const response = await continueInterview(token, interviewId!, currentMessage);

            if (!response.ok) {
                if (response.status >= 400 && response.status < 500) {
                    toast.error('Unable to send message. Client error');
                    console.error(`Failed to send message: Client error (${response.status})`);
                    return;
                } else if (response.status >= 500) {
                    toast.error('Unable to send message. Server error');
                    console.error(`Failed to send message: Server error (${response.status})`);
                    return;
                }
                toast.error('Unable to send message. Unknown error');
                console.error(`Failed to send message: Unknown error (${response.status})`);
                return;
            }

            try {
                const reader = response.body?.getReader();
                if (!reader) {
                    toast.error('ReadableStream not supported');
                    console.error('ReadableStream not supported');
                    return;
                }

                const decoder = new TextDecoder();
                let chunks = '';

                while (true) {
                    const { done, value } = await reader.read();

                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    chunks += chunk;
                    setCurrentStreamingMessage(chunks);
                }

                // Add the complete AI response to messages history
                const newModelMessage: MessageType = { role: 'model', message: chunks };
                if (autoPlayTTS) {
                    playAudioMessage(chunks);
                }
                setMessagesHistory((prev) => [...prev, newModelMessage]);
                if (chunks.includes('Thank you for your time. We will get back to you soon.')) {
                    toast.info('Interview completed');
                    setIsInterviewCompleted(true);
                }
            } catch (error) {
                const resJson = await response.json();
                if (resJson.error) {
                    toast.error(resJson.error.message);
                    console.error(
                        'Failed to send message, Error from server:',
                        resJson.error,
                        error
                    );
                }

                if (resJson.message) {
                    toast.info(resJson.message);
                }
            } finally {
                setIsStreamingResponse(false);
                setCurrentStreamingMessage('');
            }
        } catch (error) {
            toast.error('Unknown error from server');
            console.error('Unknown error from server:', error);
        } finally {
            setIsStreamingResponse(false);
            setCurrentStreamingMessage('');
        }
    }, [
        userMessage,
        interview?.is_completed,
        session?.access_token,
        interviewId,
        autoPlayTTS,
        playAudioMessage,
    ]);

    const getMessages = useCallback(async () => {
        const token = session?.access_token;
        if (!token) {
            toast.error('User not signed in');
            console.error('User not signed in');
            return;
        }

        try {
            devLog('Fetching messages');
            setIsFetchingMessages(true);
            const response = await getMessagesHistory(token, interviewId!);
            if (!response.ok) {
                if (response.status >= 400 && response.status < 500) {
                    toast.error('Unable to fetch messages. Client error');
                    console.error(`Failed to fetch messages: Client error (${response.status})`);
                    return;
                } else if (response.status >= 500) {
                    toast.error('Unable to fetch messages. Server error');
                    console.error(`Failed to fetch messages: Server error (${response.status})`);
                    return;
                }
                toast.error('Unable to fetch messages. Unknown error');
                console.error(`Failed to fetch messages: Unknown error (${response.status})`);
                return;
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
            setIsFetchingMessages(false);
        }
    }, [session?.access_token, interviewId]);

    const handleSendMessage = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleVoiceInput = async () => {
        if (interview?.is_completed) {
            toast.info('Interview is already completed');
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
                recognitionRef.current = null;

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
    };

    const fetchReport = useCallback(async () => {
        if (authLoading) return;
        if (!session?.access_token) return;

        try {
            devLog('Fetching report');
            setFetchingReport(true);
            const response = await getReport(session.access_token, interviewId!);
            if (!response.ok) {
                if (response.status >= 400 && response.status < 500) {
                    toast.error('Unable to fetch report. Client error');
                    console.error(`Failed to fetch report: Client error (${response.status})`);
                    return;
                } else if (response.status >= 500) {
                    toast.error('Unable to fetch report. Server error');
                    console.error(`Failed to fetch report: Server error (${response.status})`);
                    return;
                }
                toast.error('Unable to fetch report. Unknown error');
                console.error(`Failed to fetch report: Unknown error (${response.status})`);
                return;
            }

            const res = await response.json();

            if (!res) {
                toast.error('Failed to fetch report, No data received from server');
                console.error('Failed to fetch report, No data received from server');
                return;
            }
            if (res.error) {
                toast.error(res.error.message);
                console.error(res.error.message);
                return;
            }
            setReport(res.data);
        } catch (error) {
            toast.error('Failed to fetch report');
            console.error(error);
        } finally {
            setFetchingReport(false);
        }
    }, [authLoading, session?.access_token, interviewId]);

    return {
        startInterviewWithAI,
        isInterviewStarting,
        isInterviewStarted,
        interview,
        sendMessage,
        isStreamingResponse,
        currentStreamingMessage,
        messagesHistory,
        userMessage,
        setUserMessage,
        setMessagesHistory,
        isFetchingMessages,
        setIsFetchingMessages,
        getMessages,
        handleSendMessage,
        handleVoiceInput,
        isRecording,
        fetchReport,
        fetchingReport,
        report,
        setInterview,
        isInterviewCompleted,
        setIsInterviewCompleted,
    };
}
