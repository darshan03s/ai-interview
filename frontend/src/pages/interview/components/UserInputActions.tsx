import type { UserInputAreaProps } from "./UserInputArea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { CirclePlay, Loader2, Mic, SendIcon, SpellCheck, X } from "lucide-react"
import { isDevMode } from "@/utils/devUtils"

type UserInputActionsProps = Partial<UserInputAreaProps> & {
    handleEndInterview: () => void;
    isEndingInterview: boolean;
}

const UserInputActions = ({
    isEndingInterview,
    handleEndInterview,
    isStreamingResponse,
    interview,
    isRecording,
    isInterviewCompleted,
    toggleAutoPlayTTS,
    autoPlayTTS,
    aiSpellCheck,
    isSpellChecking,
    handleVoiceInput,
    userMessage,
    sendMessage
}: UserInputActionsProps) => {

    const tooltipSide = window.innerWidth > 1200 ? 'left' : 'top';

    return (
        <>
            {
                isDevMode ?
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={handleEndInterview}
                                disabled={isStreamingResponse || interview?.is_completed || isRecording || isInterviewCompleted || isEndingInterview}
                                className={`bg-destructive text-destructive-foreground p-2 rounded-full hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed! transition-all duration-200 hover:scale-105 active:scale-95`}
                            >
                                {isEndingInterview ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <X className="h-4 w-4" />
                                )}
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side={tooltipSide}>
                            {isEndingInterview ? 'Ending interview...' : 'End Interview'}
                        </TooltipContent>
                    </Tooltip>
                    : null
            }
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
                <TooltipContent side={tooltipSide}>
                    {isRecording ? 'Stop recording (Shift+R)' : 'Start recording (Shift+R)'}
                </TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={aiSpellCheck}
                        disabled={!userMessage?.trim() || isSpellChecking || interview?.is_completed || isInterviewCompleted}
                        className={`bg-primary text-primary-foreground p-2 rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed! transition-all duration-200 hover:scale-105 active:scale-95`}
                    >
                        {isSpellChecking ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <SpellCheck className="h-4 w-4" />
                        )}
                    </button>
                </TooltipTrigger>
                <TooltipContent side={tooltipSide}>
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
                <TooltipContent side={tooltipSide}>
                    {autoPlayTTS ? 'Disable Text-to-Speech' : 'Enable Text-to-Speech'}
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={sendMessage}
                        disabled={!userMessage?.trim() || isStreamingResponse || interview?.is_completed || isInterviewCompleted}
                        className={`bg-primary text-primary-foreground p-2 rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed! transition-all duration-200 hover:scale-105 active:scale-95`}
                    >
                        {isStreamingResponse ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <SendIcon className="h-4 w-4" />
                        )}
                    </button>
                </TooltipTrigger>
                <TooltipContent side={tooltipSide}>
                    Send message
                </TooltipContent>
            </Tooltip>
        </>
    );
}

export default UserInputActions;