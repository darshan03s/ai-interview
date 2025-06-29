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
import { devLog } from "@/utils/devUtils";

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
            startInterviewWithAI();
        }
    }, [authLoading, interviewId, startInterviewWithAI]);

    useEffect(() => {
        if (isInterviewStarted && interviewId) {
            getMessages();
        }
    }, [isInterviewStarted, interviewId, getMessages]);

    useEffect(() => {
        if (interview?.is_completed) {
            fetchReport();
        }
    }, [interview?.is_completed, fetchReport]);

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