import type { InterviewType, ReportType } from '@/types';
import { create } from 'zustand';

interface InterviewStore {
    interview: InterviewType | null;
    setInterview: (interview: InterviewType) => void;
    isRecording: boolean;
    setIsRecording: (isRecording: boolean) => void;
    isInterviewCompleted: boolean;
    setIsInterviewCompleted: (isInterviewCompleted: boolean) => void;
    isInterviewStarting: boolean;
    setIsInterviewStarting: (isInterviewStarting: boolean) => void;
    isInterviewStarted: boolean;
    setIsInterviewStarted: (isInterviewStarted: boolean) => void;
    isFetchingMessages: boolean;
    setIsFetchingMessages: (isFetchingMessages: boolean) => void;
    isFetchingReport: boolean;
    setIsFetchingReport: (isFetchingReport: boolean) => void;
    report: ReportType | null;
    setReport: (report: ReportType) => void;
    isInterviewEnding: boolean;
    setIsInterviewEnding: (isInterviewEnding: boolean) => void;
}

const useInterviewStore = create<InterviewStore>((set) => ({
    interview: null,
    setInterview: (interview: InterviewType) => set({ interview }),
    isRecording: false,
    setIsRecording: (isRecording: boolean) => set({ isRecording }),
    isInterviewCompleted: false,
    setIsInterviewCompleted: (isInterviewCompleted: boolean) => set({ isInterviewCompleted }),
    isInterviewStarting: false,
    setIsInterviewStarting: (isInterviewStarting: boolean) => set({ isInterviewStarting }),
    isInterviewStarted: false,
    setIsInterviewStarted: (isInterviewStarted: boolean) => set({ isInterviewStarted }),
    isFetchingMessages: false,
    setIsFetchingMessages: (isFetchingMessages: boolean) => set({ isFetchingMessages }),
    isFetchingReport: false,
    setIsFetchingReport: (isFetchingReport: boolean) => set({ isFetchingReport }),
    report: null,
    setReport: (report: ReportType) => set({ report }),
    isInterviewEnding: false,
    setIsInterviewEnding: (isInterviewEnding: boolean) => set({ isInterviewEnding }),
}));

export default useInterviewStore;
