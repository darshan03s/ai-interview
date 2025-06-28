import { spellCheck } from "@/api";
import { toast } from "sonner";
import useInterview from "./useInterview";
import { useAuth } from "@/features/auth";
import { useState } from "react";

export default function useSpellCheck() {
    const { interview, userMessage, setUserMessage } = useInterview();
    const { session } = useAuth();
    const [isSpellChecking, setIsSpellChecking] = useState(false);

    const aiSpellCheck = async () => {
        if (interview?.is_completed) {
            toast.info("Interview is already completed");
            return;
        }
        const token = session?.access_token;
        if (!token) {
            toast.error("User not signed in");
            console.error("User not signed in");
            return;
        }

        if (!userMessage.trim()) {
            toast.error("Please enter a message to spell check");
            return;
        }

        try {
            setIsSpellChecking(true);
            const response = await spellCheck(token, userMessage);
            if (!response.ok) {
                if (response.status >= 400 && response.status < 500) {
                    toast.error("Unable to spell check. Client error");
                    console.error(`Failed to spell check: Client error (${response.status})`);
                    return;
                } else if (response.status >= 500) {
                    toast.error("Unable to spell check. Server error");
                    console.error(`Failed to spell check: Server error (${response.status})`);
                    return;
                }
                toast.error("Unable to spell check. Unknown error");
                console.error(`Failed to spell check: Unknown error (${response.status})`);
                return;
            }

            const spellCheckResponse = await response.json();

            if (!spellCheckResponse) {
                toast.error("Failed to spell check");
                console.error("Failed to spell check");
                return;
            }

            if (spellCheckResponse.error) {
                toast.error(spellCheckResponse.error.message);
                console.error(
                    "Failed to spell check, Error from server:",
                    spellCheckResponse.error
                );
                return;
            }

            setUserMessage(spellCheckResponse.data);
        } catch (error) {
            toast.error("Failed to spell check, Unknown error");
            console.error("Failed to spell check, Unknown error:", error);
        } finally {
            setIsSpellChecking(false);
        }
    };

    return {
        aiSpellCheck,
        isSpellChecking,
    };
}