export type PdfFileType = {
    file: File;
    url: string;
};

export type InterviewType = {
    interview_id: string;
    created_at: string;
    user_id: string;
    title: string;
    resume_url: string;
    username: string;
    interview_type: SelectedInterviewType;
    is_completed: boolean;
};

export type SelectedInterviewType = "technical" | "techno-managerial";

export type ReportType = {
    report_url: string;
    is_created: boolean;
    created_at: string;
    report: string;
    report_pdf: string;
    user_id: string;
    interview_id: string;
};

export type MessageType = {
    role: "user" | "model";
    message: string;
};
