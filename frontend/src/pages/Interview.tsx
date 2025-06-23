import { useAuth } from "@/features/auth";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { continueInterview, startInterview, getMessagesHistory } from "@/api";
import type { Interview } from "@/types";
import { SendIcon } from "lucide-react";

interface Message {
    role: "user" | "model";
    message: string;
}

const Interview = () => {
    const [startedInterview, setStartedInterview] = useState<boolean>(false);
    const { session, authLoading } = useAuth();
    const { interviewId } = useParams();
    const [interview, setInterview] = useState<Interview | null>(null);
    const [userMessage, setUserMessage] = useState<string>("");
    const [messagesHistory, setMessagesHistory] = useState<Message[]>([]);

    const startInterviewWithAI = async () => {
        if (startedInterview) return;
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
        }
    };

    const sendMessage = async () => {
        if (!userMessage) return;
        const token = session?.access_token;
        if (!token) {
            console.error('User not signed in');
            return;
        }
        setUserMessage("");

        try {
            const response = await continueInterview(token, interviewId!, userMessage);

            if (!response.ok) {
                toast.error("Error sending prompt");
            }

            const reader = response.body?.getReader();
            if (!reader) {
                toast.error("ReadableStream not supported");
                return;
            }

            const decoder = new TextDecoder();

            let chunks = "";
            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                chunks += chunk;
            }

            console.log(chunks);
        } catch (error) {
            toast.error('Failed to send message, Error from server');
            console.error('Failed to send message, Error from server:', error);
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

    useEffect(() => {
        if (!authLoading) {
            startInterviewWithAI();
        }
    }, [authLoading]);

    useEffect(() => {
        if (startedInterview && messagesHistory.length === 0) {
            getMessages();
        }
    }, []);

    if (startedInterview) {
        return (
            <div className="max-w-4xl mx-auto h-[600px] flex flex-col gap-4">
                <h1 className="text-4xl font-bold py-4 text-center w-full">Welcome {interview?.username} to your {interview?.interview_type.toLocaleUpperCase()} interview</h1>
                <a href={interview?.resume_url} target="_blank" className="text-sm text-blue-500 hover:text-blue-600 underline text-center w-full">See your resume</a>
                <div
                    className="interview-messages flex-1 rounded-2xl h-full p-3 border border-border overflow-y-auto hide-scrollbar">

                </div>

                <div className="flex flex-col gap-2 border border-border rounded-2xl">
                    <textarea
                        value={userMessage}
                        onChange={(e) => setUserMessage(e.target.value)}
                        id="user-message" className="w-full rounded-2xl p-3 resize-none flex-1 focus:outline-none focus:border-none"></textarea>
                    <div className="actions w-full h-[50px] flex items-center justify-between px-2">
                        <div className="actions-left"></div>
                        <div className="actions-right">
                            <button
                                id="send-message"
                                onClick={sendMessage}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        sendMessage();
                                    }
                                }}
                                className="bg-primary text-primary-foreground p-2 w-8 h-8 flex items-center justify-center rounded-full">
                                <SendIcon className="w-full h-full" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

}
export default Interview