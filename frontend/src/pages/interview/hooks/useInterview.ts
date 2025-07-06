import { getMessagesHistory, getReport, startInterview } from '@/api';
import { useAuth } from '@/features/auth';
import { useCallback } from 'react';
import { toast } from 'sonner';
import useTextToSpeech from './useTextToSpeech';
import { devLog } from '@/utils/devUtils';
import useChatStore from '../stores/chatStore';
import useInterviewStore from '../stores/interviewStore';
import useSpeechStore from '../stores/speechStore';

export default function useInterview() {
    const { session, authLoading } = useAuth();
    const { playAudioMessage } = useTextToSpeech();

    const autoPlayTextToSpeech = useSpeechStore((state) => state.autoPlayTextToSpeech);
    const setIsResponseLoading = useChatStore((state) => state.setIsResponseLoading);
    const setCurrentStreamingMessage = useChatStore((state) => state.setCurrentStreamingMessage);
    const addMessage = useChatStore((state) => state.addMessage);
    const setMessagesHistory = useChatStore((state) => state.setMessagesHistory);
    const ws = useChatStore((state) => state.ws);
    const setIsInterviewStarting = useInterviewStore((state) => state.setIsInterviewStarting);
    const setInterview = useInterviewStore((state) => state.setInterview);
    const setIsInterviewStarted = useInterviewStore((state) => state.setIsInterviewStarted);
    const setIsInterviewCompleted = useInterviewStore((state) => state.setIsInterviewCompleted);
    const setIsFetchingMessages = useInterviewStore((state) => state.setIsFetchingMessages);
    const setIsFetchingReport = useInterviewStore((state) => state.setIsFetchingReport);
    const setReport = useInterviewStore((state) => state.setReport);
    const interview = useInterviewStore((state) => state.interview);
    const isInterviewCompleted = useInterviewStore((state) => state.isInterviewCompleted);
    const interviewId = useInterviewStore((state) => state.interviewId);

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
            devLog('Messages history', startInterviewResponse.data.messagesHistory.length);
        } catch (error) {
            toast.error('Failed to start interview, Unknown error');
            console.error('Failed to start interview, Unknown error:', error);
        } finally {
            setIsInterviewStarting(false);
            setIsInterviewStarted(true);
            setIsFetchingMessages(false);
        }
    }, [session?.access_token, interviewId]);

    const sendMessage = useCallback(
        async (message: string) => {
            if (interview?.is_completed || isInterviewCompleted) {
                toast.error('Interview already completed');
                return;
            }
            setIsResponseLoading(true);
            try {
                devLog('Setting isResponseLoading to true');
                devLog('Sending message to AI');


                if (!ws) {
                    console.error('No WebSocket connection available');
                    toast.error('No connection available.');
                    setIsResponseLoading(false);
                    return;
                }

                if (ws.readyState !== WebSocket.OPEN) {
                    console.error('WebSocket not in OPEN state:', ws.readyState);
                    toast.error('Connection closed.');
                    setIsResponseLoading(false);
                    return;
                }

                let responseText = '';

                const handleMessage = (event: MessageEvent) => {
                    const data = event.data;

                    if (data === '__END_OF_STREAM__') {
                        addMessage({ role: 'model', message: responseText });
                        setCurrentStreamingMessage('');
                        setIsResponseLoading(false);
                        ws.removeEventListener('message', handleMessage);
                        if (autoPlayTextToSpeech) {
                            playAudioMessage(responseText);
                        }
                        if (
                            responseText.includes(
                                'Thank you for your time, we will get back to you with the results.'
                            )
                        ) {
                            toast.info('Interview completed');
                            setIsInterviewCompleted(true);
                        }
                        return;
                    }

                    if (data === '__ERROR__') {
                        console.error('Stream error received');
                        setCurrentStreamingMessage('');
                        setIsResponseLoading(false);
                        ws.removeEventListener('message', handleMessage);
                        return;
                    }

                    setIsResponseLoading(false);
                    responseText += data;
                    setCurrentStreamingMessage(responseText);
                };

                ws.addEventListener('message', handleMessage);

                ws.send(message);

                // const response = await continueInterview(token, interviewId, message);

                // if (!response.ok) {
                //     if (response.status >= 400 && response.status < 500) {
                //         toast.error('Unable to send message. Client error');
                //         console.error(`Failed to send message: Client error (${response.status})`);
                //         return;
                //     } else if (response.status >= 500) {
                //         toast.error('Unable to send message. Server error');
                //         console.error(`Failed to send message: Server error (${response.status})`);
                //         return;
                //     }
                //     toast.error('Unable to send message. Unknown error');
                //     console.error(`Failed to send message: Unknown error (${response.status})`);
                //     return;
                // }

                // try {
                //     const reader = response.body?.getReader();
                //     if (!reader) {
                //         toast.error('ReadableStream not supported');
                //         console.error('ReadableStream not supported');
                //         return;
                //     }

                //     const decoder = new TextDecoder();
                //     let chunks = '';

                //     while (true) {
                //         const { done, value } = await reader.read();

                //         if (done) break;

                //         const chunk = decoder.decode(value, { stream: true });
                //         chunks += chunk;
                //         setCurrentStreamingMessage(chunks);
                //     }

                //     const newModelMessage: MessageType = { role: 'model', message: chunks };
                //     if (autoPlayTextToSpeech) {
                //         playAudioMessage(chunks);
                //     }
                //     addMessage(newModelMessage);
                //     if (chunks.includes('Thank you for your time. We will get back to you soon.')) {
                //         toast.info('Interview completed');
                //         setIsInterviewCompleted(true);
                //     }
                // } catch (error) {
                //     const resJson = await response.json();
                //     if (resJson.error) {
                //         toast.error(resJson.error.message);
                //         console.error(
                //             'Failed to send message, Error from server:',
                //             resJson.error,
                //             error
                //         );
                //     }

                //     if (resJson.message) {
                //         toast.info(resJson.message);
                //     }
                // } finally {
                //     setIsResponseLoading(false);
                //     setCurrentStreamingMessage('');
                // }
            } catch (error) {
                toast.error('Unknown error from server');
                console.error('Unknown error from server:', error);
                setIsResponseLoading(false);
            } finally {
                setCurrentStreamingMessage('');
            }
        },
        [
            ws,
            autoPlayTextToSpeech,
            addMessage,
            setCurrentStreamingMessage,
            setIsResponseLoading,
            setIsInterviewCompleted,
            playAudioMessage,
            interview?.is_completed,
            isInterviewCompleted,
        ]
    );

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
