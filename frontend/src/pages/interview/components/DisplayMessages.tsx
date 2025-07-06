import { PlayIcon } from "lucide-react";
import useTextToSpeech from "../hooks/useTextToSpeech";
import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import useInterviewStore from "../stores/interviewStore";
import useChatStore from "../stores/chatStore";
import useSpeechStore from "../stores/speechStore";
import type { InterviewType, MessageType } from "@/types";

const LoadingIndicator = memo(() => {
    return (
        <div className="ellipsis-loader w-full flex justify-start">
            <div className="max-w-[80%] p-2 rounded-lg ai-message flex items-center gap-2">
                {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index}
                        style={{
                            animationDelay: `${index * 0.1}s`,
                            animationDuration: '0.5s',
                            animationTimingFunction: 'ease-in-out',
                            animationIterationCount: 'infinite',
                        }}
                        className="w-2 h-2 bg-black/50 dark:bg-white/50 rounded-full animate-bounce" />
                ))}
            </div>
        </div>
    );
});

const StreamingMessage = memo(({ message }: { message: string }) => {
    return <div className="flex justify-start">
        <div className="flex items-start gap-3 max-w-[80%]">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                AI
            </div>
            <div className="flex flex-col gap-2">
                <div className="bg-muted rounded-2xl rounded-tl-md p-4 shadow-sm">
                    <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                        {message}
                    </p>
                </div>
            </div>
        </div>
    </div>
});

const AiMessageItem = memo(({ message }: { message: MessageType }) => {

    const { playAudioMessage } = useTextToSpeech();
    const currentlyPlayingMessage = useSpeechStore(state => state.currentlyPlayingMessage);

    return <div className="flex items-start gap-3 p-3">
        <div className="w-4 h-4 xl:w-6 xl:h-6 p-3 xl:p-4 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs xl:text-sm shrink-0 relative">
            AI
            {currentlyPlayingMessage === message.message && (
                <div className="absolute -inset-2 bg-primary/50 rounded-full animate-ping animation-duration-1000"></div>
            )}
        </div>
        <div className="flex flex-col gap-2">
            <div className="bg-accent/10 p-3 rounded-2xl rounded-tl-md shadow-sm">
                <p className="text-foreground leading-relaxed">
                    {message.message}
                    <Badge className="ml-2 opacity-70 hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => playAudioMessage(message.message)}
                            className="inline-flex items-center gap-1 text-xs text-white"
                        >
                            <PlayIcon className="h-3 w-3" />
                            <span className="text-xs hidden md:block">Play Audio</span>
                        </button>
                    </Badge>
                </p>
            </div>
        </div>
    </div>
}, (prevProps, nextProps) => {
    return prevProps.message.message === nextProps.message.message;
})

const UserMessageItem = memo(({ message, interview }: { message: MessageType, interview: InterviewType }) => {
    return <div className="flex items-start gap-3 max-w-[80%]">
        <div className="flex flex-col gap-2">
            <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-md p-3 shadow-sm">
                <p className="whitespace-pre-wrap leading-relaxed">
                    {message.message}
                </p>
            </div>
        </div>
        <div className="w-4 h-4 xl:w-6 xl:h-6 p-3 xl:p-4 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs xl:text-sm shrink-0">
            {interview?.username?.[0]?.toUpperCase() || 'U'}
        </div>
    </div>
}, (prevProps, nextProps) => {
    return prevProps.message.message === nextProps.message.message;
})

const DisplayMessages = () => {

    const isFetchingMessages = useInterviewStore(state => state.isFetchingMessages);
    const interview = useInterviewStore(state => state.interview);
    const messagesHistory = useChatStore(state => state.messagesHistory);
    const isResponseLoading = useChatStore(state => state.isResponseLoading);
    const currentStreamingMessage = useChatStore(state => state.currentStreamingMessage);

    if (isFetchingMessages) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                    <p className="text-lg font-medium">Loading...</p>
                </div>
            </div>
        )
    }

    if (!isFetchingMessages && messagesHistory.length === 0) {
        return <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
                <p className="text-lg font-medium">Type 'Let's Start' to start the interview</p>
            </div>
        </div>
    }

    return (
        <>
            {messagesHistory.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} text-xs xl:text-base`}>
                    {message.role === 'model' && (
                        <AiMessageItem message={message} />
                    )}
                    {message.role === 'user' && (
                        <UserMessageItem message={message} interview={interview!} />
                    )}
                </div>
            ))}
            {isResponseLoading ? (
                <LoadingIndicator />
            ) : null}

            {currentStreamingMessage ? (
                <StreamingMessage message={currentStreamingMessage} />
            ) : null}
        </>
    )
}

export default memo(DisplayMessages);