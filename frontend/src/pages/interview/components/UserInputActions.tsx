import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { CirclePlay, Loader2, Mic, SendIcon, SpellCheck, X } from "lucide-react"
import { isDevMode } from "@/utils/devUtils"
import useSpellCheck from "../hooks/useSpellCheck";
import { useEffect } from "react";
import useInterviewStore from "../stores/interviewStore";
import useChatStore from "../stores/chatStore";
import useSpeechStore from "../stores/speechStore";
import useTextToSpeech from "../hooks/useTextToSpeech";

type UserInputActionsProps = {
    handleEndInterview: () => void;
    handleSendMessage: (e: React.KeyboardEvent | React.MouseEvent) => void;
    handleVoiceInput: () => void;
    userMessage: string;
    setUserMessage: (message: string) => void;
}

const UserInputActions = ({
    handleEndInterview,
    handleSendMessage,
    handleVoiceInput,
    userMessage,
    setUserMessage
}: UserInputActionsProps) => {

    const interview = useInterviewStore(state => state.interview);
    const isInterviewCompleted = useInterviewStore(state => state.isInterviewCompleted);
    const isRecording = useInterviewStore(state => state.isRecording);
    const isInterviewEnding = useInterviewStore(state => state.isInterviewEnding);
    const isResponseLoading = useChatStore(state => state.isResponseLoading);
    const autoPlayTextToSpeech = useSpeechStore(state => state.autoPlayTextToSpeech);
    const { toggleAutoPlayTextToSpeech } = useTextToSpeech();
    const { aiSpellCheck, isSpellChecking } = useSpellCheck();

    const handleSpellCheck = async () => {
        const spellCheckedMessage = await aiSpellCheck(userMessage);
        if (spellCheckedMessage) {
            setUserMessage(spellCheckedMessage);
        }
    }

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            if (e.shiftKey && e.key.toLowerCase() === "r") {
                e.preventDefault();
                handleVoiceInput();
            }

            if (e.shiftKey && e.key.toLowerCase() === "s") {
                e.preventDefault();
                handleSpellCheck();
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [handleVoiceInput, aiSpellCheck]);

    const tooltipSide = window.innerWidth > 1200 ? 'left' : 'top';

    return (
        <>
            {
                isDevMode ?
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={handleEndInterview}
                                disabled={isResponseLoading || interview?.is_completed || isRecording || isInterviewCompleted || isInterviewEnding}
                                className={`bg-destructive text-destructive-foreground p-2 rounded-full hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed! transition-all duration-200 hover:scale-105 active:scale-95`}
                            >
                                {isInterviewEnding ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <X className="h-4 w-4" />
                                )}
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side={tooltipSide}>
                            {isInterviewEnding ? 'Ending interview...' : 'End Interview'}
                        </TooltipContent>
                    </Tooltip>
                    : null
            }
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={handleVoiceInput}
                        disabled={isResponseLoading || interview?.is_completed || isInterviewCompleted}
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
                        onClick={handleSpellCheck}
                        disabled={userMessage!.trim().length === 0 || isSpellChecking || interview?.is_completed || isInterviewCompleted}
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
                        onClick={() => toggleAutoPlayTextToSpeech()}
                        disabled={interview?.is_completed || isInterviewCompleted}
                        className={`${autoPlayTextToSpeech ? 'bg-green-500' : 'bg-red-500'} text-primary-foreground p-2 rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed! transition-all duration-200 hover:scale-105 active:scale-95`}
                    >
                        <CirclePlay className="h-4 w-4" />
                    </button>
                </TooltipTrigger>
                <TooltipContent side={tooltipSide}>
                    {autoPlayTextToSpeech ? 'Disable Text-to-Speech' : 'Enable Text-to-Speech'}
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={handleSendMessage}
                        disabled={!userMessage?.trim() || isResponseLoading || interview?.is_completed || isInterviewCompleted}
                        className={`bg-primary text-primary-foreground p-2 rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed! transition-all duration-200 hover:scale-105 active:scale-95`}
                    >
                        {isResponseLoading ? (
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