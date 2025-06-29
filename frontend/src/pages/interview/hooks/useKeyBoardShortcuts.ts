import { useParams } from "react-router-dom";
import useInterview from "./useInterview";
import { useEffect } from "react";
import useSpellCheck from "./useSpellCheck";

export default function useKeyBoardShortcuts() {
    const { interviewId } = useParams();
    const { handleVoiceInput } = useInterview();
    const { aiSpellCheck } = useSpellCheck();

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
                aiSpellCheck();
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [interviewId, handleVoiceInput, aiSpellCheck]);
}