import { PlayIcon } from "lucide-react";
import useInterview from "../hooks/useInterview";
import useTTS from "../hooks/useTTS";
import { memo } from "react";
import { Badge } from "@/components/ui/badge";

type DisplayMessagesProps = Pick<ReturnType<typeof useInterview>,
    'isFetchingMessages' | 'messagesHistory' | 'isStreamingResponse' | 'currentStreamingMessage' | 'interview'
> & Pick<ReturnType<typeof useTTS>, 'playAudioMessage'>;

const DisplayMessages = (
    {
        isFetchingMessages,
        messagesHistory,
        isStreamingResponse,
        currentStreamingMessage,
        interview,
        playAudioMessage
    }: DisplayMessagesProps) => {

    return (
        <>
            {
                isFetchingMessages ?
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center text-muted-foreground">
                            <p className="text-lg font-medium">Loading...</p>
                        </div>
                    </div>
                    :
                    !isFetchingMessages && messagesHistory.length === 0
                        ?
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center text-muted-foreground">
                                <p className="text-lg font-medium">Type 'Let's Start' to start the interview</p>
                            </div>
                        </div>
                        :
                        messagesHistory.map((message, index) => (
                            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} text-xs xl:text-base`}>
                                {/* display model response */}
                                {message.role === 'model' && (
                                    <div className="flex items-start gap-3 p-3">
                                        <div className="w-4 h-4 xl:w-6 xl:h-6 p-3 xl:p-4 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs xl:text-sm shrink-0">
                                            AI
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
                                )}
                                {/* display user message */}
                                {message.role === 'user' && (
                                    <div className="flex items-start gap-3 max-w-[80%]">
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
    )
}

export default memo(DisplayMessages);