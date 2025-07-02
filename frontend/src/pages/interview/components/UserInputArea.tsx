import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { CirclePlay, Loader2, Mic, SendIcon, SpellCheck, X } from "lucide-react"
import useInterview from "../hooks/useInterview"
import useTTS from "../hooks/useTTS"
import useSpellCheck from "../hooks/useSpellCheck"
import { memo } from "react";
import { isDevMode } from "@/utils/devUtils"

type UserInputAreaProps = Pick<ReturnType<typeof useInterview>,
    'userMessage' | 'setUserMessage' | 'handleSendMessage' | 'isStreamingResponse' | 'handleVoiceInput' | 'isRecording' | 'sendMessage' | 'interview' | 'isInterviewCompleted' | 'setIsInterviewCompleted'
> & Pick<ReturnType<typeof useTTS>, 'autoPlayTTS' | 'toggleAutoPlayTTS'> & Pick<ReturnType<typeof useSpellCheck>, 'aiSpellCheck' | 'isSpellChecking'>;

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
        aiSpellCheck,
        isSpellChecking,
        isInterviewCompleted,
        setIsInterviewCompleted
    }: UserInputAreaProps
) => {

    const handleEndInterview = () => {
        setIsInterviewCompleted(true);
    }
    return (
        <div className="bg-card rounded-2xl ring-1 ring-border shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-3 pb-0 xl:pb-3 flex-1">
                <textarea
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    onKeyDown={handleSendMessage}
                    placeholder="Type your answer here..."
                    className="w-full text-xs xl:text-base hide-scrollbar bg-transparent resize-none outline-none placeholder:text-muted-foreground h-25 xl:h-full leading-relaxed"
                    disabled={isStreamingResponse}
                />
            </div>
            <div className="px-3 py-3 flex items-center justify-between">
                <div className="text-xs text-muted-foreground hidden xl:flex items-center gap-2">
                    <span>Enter to send • Shift+Enter for new line</span>
                </div>
                <div className="flex items-center gap-2">
                    {isDevMode ?
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={handleEndInterview}
                                    disabled={isStreamingResponse || interview?.is_completed || isRecording || isInterviewCompleted}
                                    className={`bg-primary text-primary-foreground p-2 rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed! transition-all duration-200 hover:scale-105 active:scale-95`}
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                End Interview
                            </TooltipContent>
                        </Tooltip>
                        : null}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={handleVoiceInput}
                                disabled={isStreamingResponse || interview?.is_completed || isInterviewCompleted}
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
                                disabled={!userMessage.trim() || isSpellChecking || interview?.is_completed || isInterviewCompleted}
                                className={`bg-primary text-primary-foreground p-2 rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed! transition-all duration-200 hover:scale-105 active:scale-95`}
                            >
                                {isSpellChecking ? (
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
                                disabled={interview?.is_completed || isInterviewCompleted}
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
                                disabled={!userMessage.trim() || isStreamingResponse || interview?.is_completed || isInterviewCompleted}
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
    )
}

export default memo(UserInputArea);