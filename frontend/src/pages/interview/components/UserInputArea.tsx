
import useInterview from "../hooks/useInterview"
import useTTS from "../hooks/useTTS"
import { memo, useState } from "react";
import { toast } from "sonner"
import { useAuth } from "@/features/auth";
import UserInputActions from "./UserInputActions";
import { endInterview } from "@/api";

export type UserInputAreaProps = Pick<ReturnType<typeof useInterview>,
    'userMessage' | 'setUserMessage' | 'handleSendMessage' | 'isStreamingResponse' | 'handleVoiceInput' | 'isRecording' | 'sendMessage' | 'interview' | 'isInterviewCompleted' | 'setIsInterviewCompleted'
> & Pick<ReturnType<typeof useTTS>, 'autoPlayTTS' | 'toggleAutoPlayTTS'>;

const UserInputArea = (
    {
        userMessage,
        setUserMessage,
        handleSendMessage,
        isStreamingResponse,
        handleVoiceInput,
        interview,
        isRecording,
        sendMessage,
        autoPlayTTS,
        toggleAutoPlayTTS,
        isInterviewCompleted,
        setIsInterviewCompleted,
    }: UserInputAreaProps
) => {
    const { session } = useAuth();
    const [isEndingInterview, setIsEndingInterview] = useState(false);

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
            setIsEndingInterview(true);
            await endInterview(token, interview.interview_id!);
            setIsInterviewCompleted(true);
        } catch (error) {
            toast.error('Failed to end interview');
            console.error('Failed to end interview', error);
        } finally {
            setIsEndingInterview(false);
        }
    }
    return (
        <div className="bg-card rounded-2xl ring-1 ring-border shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-3 pb-0 xl:pb-3 flex-1">
                <div className="hidden xl:flex xl:gap-2 w-full h-full">
                    <textarea
                        value={userMessage}
                        onChange={(e) => setUserMessage(e.target.value)}
                        onKeyDown={handleSendMessage}
                        placeholder="Type your answer here..."
                        className="w-full text-xs xl:text-base hide-scrollbar bg-transparent resize-none outline-none placeholder:text-muted-foreground h-25 xl:h-full leading-relaxed"
                        disabled={isStreamingResponse}
                    />
                    <div className="user-input-actions-xl flex flex-col gap-2">
                        <UserInputActions
                            handleEndInterview={handleEndInterview}
                            isStreamingResponse={isStreamingResponse}
                            interview={interview}
                            isRecording={isRecording}
                            isInterviewCompleted={isInterviewCompleted}
                            toggleAutoPlayTTS={toggleAutoPlayTTS}
                            autoPlayTTS={autoPlayTTS}
                            handleVoiceInput={handleVoiceInput}
                            userMessage={userMessage}
                            sendMessage={sendMessage}
                            isEndingInterview={isEndingInterview}
                        />
                    </div>
                </div>
                <textarea
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    onKeyDown={handleSendMessage}
                    placeholder="Type your answer here..."
                    className="xl:hidden w-full text-xs xl:text-base hide-scrollbar bg-transparent resize-none outline-none placeholder:text-muted-foreground h-25 xl:h-full leading-relaxed"
                    disabled={isStreamingResponse}
                />
            </div>
            <div className="px-3 py-3 flex flex-col xl:flex-row items-center justify-between">
                <div className="text-xs text-muted-foreground hidden xl:flex items-center gap-2">
                    <span>Enter to send • Shift+Enter for new line</span>
                </div>
                <div className="flex items-center gap-2 xl:hidden">
                    <UserInputActions
                        handleEndInterview={handleEndInterview}
                        isStreamingResponse={isStreamingResponse}
                        interview={interview}
                        isRecording={isRecording}
                        isInterviewCompleted={isInterviewCompleted}
                        toggleAutoPlayTTS={toggleAutoPlayTTS}
                        autoPlayTTS={autoPlayTTS}
                        handleVoiceInput={handleVoiceInput}
                        userMessage={userMessage}
                        sendMessage={sendMessage}
                        isEndingInterview={isEndingInterview}
                    />
                </div>
            </div>
        </div>
    )
}

export default memo(UserInputArea);