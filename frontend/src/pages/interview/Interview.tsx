import { useEffect, useRef } from "react";
import Report from "./components/Report";
import useInterview from "./hooks/useInterview";
import ViewResume from "./components/ViewResume";
import PageLoading from "./components/PageLoading";
import InterviewLoading from "./components/InterviewLoading";
import DisplayMessages from "./components/DisplayMessages";
import UserInputArea from "./components/UserInputArea";
import useTTS from "./hooks/useTTS";
import useSpellCheck from "./hooks/useSpellCheck";
import { useParams } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { devLog, isDevMode } from "@/utils/devUtils";
import { Badge } from "@/components/ui/badge";

const Interview = () => {
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const { interviewId } = useParams();
    const { authLoading } = useAuth();

    const {
        interview,
        isInterviewStarted,
        isInterviewStarting,
        messagesHistory,
        isFetchingMessages,
        isStreamingResponse,
        currentStreamingMessage,
        userMessage,
        handleSendMessage,
        handleVoiceInput,
        isRecording,
        sendMessage,
        setUserMessage,
        report,
        fetchingReport,
        fetchReport,
        startInterviewWithAI,
        getMessages,
        isInterviewCompleted,
        setIsInterviewCompleted,
    } = useInterview();

    const {
        playAudioMessage,
        autoPlayTTS,
        toggleAutoPlayTTS
    } = useTTS();

    const {
        aiSpellCheck,
        isSpellChecking
    } = useSpellCheck();

    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [messagesHistory]);

    useEffect(() => {
        if (!authLoading && interviewId) {
            if (isDevMode) {
                if (isInterviewStarted) return;
            }
            startInterviewWithAI();
        }
    }, [authLoading, interviewId, startInterviewWithAI]);

    useEffect(() => {
        if (isDevMode) {
            if (messagesHistory.length > 0) return;
        }
        if (isInterviewStarted && interviewId) {
            getMessages();
        }
    }, [isInterviewStarted, interviewId, getMessages]);

    useEffect(() => {
        if (interview?.is_completed) {
            fetchReport();
        }
    }, [interview?.is_completed, report?.is_created, fetchReport]);

    if (isInterviewStarting || !isInterviewStarted) {
        return (
            <PageLoading />
        );
    }

    devLog(interview?.is_completed, isInterviewCompleted);

    return (
        <div className="flex flex-col justify-center gap-12 py-4">
            <div className="interview-container flex flex-col xl:flex-row items-center justify-center gap-4 mx-4 md:mx-8 flex-1">
                <div className="interview-container-conversation w-full xl:w-2/3 space-y-2 flex flex-col gap-2 max-h-[calc(100vh-18rem)] h-[calc(100vh-18rem)] xl:max-h-[calc(100vh-6rem)] xl:h-[calc(100vh-6rem)]">
                    <ViewResume resumeUrl={interview?.resume_url} />
                    {/* Messages Container */}
                    <div ref={messagesContainerRef} className="chat-section bg-card rounded-2xl ring-1 ring-border shadow-sm overflow-y-auto hide-scrollbar p-4 space-y-4 h-full">
                        {!isInterviewStarted ? (
                            <InterviewLoading />
                        ) : (
                            <DisplayMessages
                                isFetchingMessages={isFetchingMessages}
                                messagesHistory={messagesHistory}
                                isStreamingResponse={isStreamingResponse}
                                currentStreamingMessage={currentStreamingMessage}
                                interview={interview}
                                playAudioMessage={playAudioMessage}
                            />
                        )}
                    </div>
                </div>

                {/* Input Section */}
                <div className="xl:h-[-webkit-fill-available] flex flex-col gap-2 space-y-2">
                    <div className="interview-user-info h-4 flex space-x-2">
                        <Badge variant="secondary" className="p-2.5 text-xs ">
                            {interview?.interview_type ? `${interview.interview_type.charAt(0).toUpperCase() + interview.interview_type.slice(1)} Interview` : "Interview"}
                        </Badge>
                        <Badge variant={interview?.is_completed ? "default" : "secondary"} className="p-2.5 text-xs">
                            {interview?.is_completed ? "Completed" : "In Progress"}
                        </Badge>
                        <Badge variant="secondary" className="p-2.5">
                            Created at: {interview?.created_at ? new Date(interview.created_at).toLocaleDateString() : "N/A"}
                        </Badge>
                    </div>
                    <div className="flex-1">
                        <UserInputArea
                            userMessage={userMessage}
                            setUserMessage={setUserMessage}
                            handleSendMessage={handleSendMessage}
                            isStreamingResponse={isStreamingResponse}
                            handleVoiceInput={handleVoiceInput}
                            interview={interview}
                            isRecording={isRecording}
                            sendMessage={sendMessage}
                            autoPlayTTS={autoPlayTTS}
                            toggleAutoPlayTTS={toggleAutoPlayTTS}
                            aiSpellCheck={aiSpellCheck}
                            isSpellChecking={isSpellChecking}
                            setIsInterviewCompleted={setIsInterviewCompleted}
                            isInterviewCompleted={isInterviewCompleted}
                        />
                    </div>
                </div>
            </div>

            {interview?.is_completed || isInterviewCompleted ? (
                <Report
                    report={report}
                    fetchingReport={fetchingReport}
                    fetchReport={fetchReport}
                />
            ) : null}
        </div>
    );
};

export default Interview;