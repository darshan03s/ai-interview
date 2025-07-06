import { continueInterview, getMessagesHistory, getReport, startInterview } from '@/api';
import { useAuth } from '@/features/auth';
import type { MessageType } from '@/types';
import { useCallback } from 'react';
import { toast } from 'sonner';
import useTextToSpeech from './useTextToSpeech';
import { useParams } from 'react-router-dom';
import { devLog } from '@/utils/devUtils';
import useChatStore from '../stores/chatStore';
import useInterviewStore from '../stores/interviewStore';
import useSpeechStore from '../stores/speechStore';

export default function useInterview() {
    const { interviewId } = useParams();
    const { session, authLoading } = useAuth();
    const { playAudioMessage } = useTextToSpeech();
    const { autoPlayTextToSpeech } = useSpeechStore();

    const { setIsResponseStreaming, setCurrentStreamingMessage, addMessage, setMessagesHistory } =
        useChatStore();

    const {
        setIsInterviewStarting,
        setInterview,
        setIsInterviewStarted,
        setIsInterviewCompleted,
        setIsFetchingMessages,
        setReport,
        setIsFetchingReport,
    } = useInterviewStore();

    const startInterviewWithAI = useCallback(async () => {
        const token = session?.access_token;
        if (!token) {
            toast.error('User not signed in');
            console.error('User not signed in');
            return;
        }
        try {
            devLog('Starting interview with AI');
            setIsFetchingMessages(true);
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

            setInterview(startInterviewResponse.data.interview);
            setMessagesHistory(startInterviewResponse.data.messagesHistory);
        } catch (error) {
            toast.error('Failed to start interview, Unknown error');
            console.error('Failed to start interview, Unknown error:', error);
        } finally {
            setIsInterviewStarting(false);
            setIsInterviewStarted(true);
            setIsFetchingMessages(false);
        }
    }, [session?.access_token, interviewId]);

    const sendMessage = useCallback(async (message: string, token: string, interviewId: string) => {
        try {
            devLog('Sending message to AI');
            setIsResponseStreaming(true);
            const response = await continueInterview(token, interviewId, message);

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

                const newModelMessage: MessageType = { role: 'model', message: chunks };
                if (autoPlayTextToSpeech) {
                    playAudioMessage(chunks);
                }
                addMessage(newModelMessage);
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
                setIsResponseStreaming(false);
                setCurrentStreamingMessage('');
            }
        } catch (error) {
            toast.error('Unknown error from server');
            console.error('Unknown error from server:', error);
        } finally {
            setIsResponseStreaming(false);
            setCurrentStreamingMessage('');
        }
    }, [autoPlayTextToSpeech]);

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

    const fetchReport = useCallback(async () => {
        if (authLoading) return;
        if (!session?.access_token) return;

        try {
            devLog('Fetching report');
            setIsFetchingReport(true);
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
            setIsFetchingReport(false);
        }
    }, [authLoading, session?.access_token, interviewId]);

    return {
        startInterviewWithAI,
        sendMessage,
        getMessages,
        fetchReport,
    };
}
