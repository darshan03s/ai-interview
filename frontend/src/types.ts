export type PdfFile = {
    file: File;
    url: string;
};

export type Interview = {
    interview_id: string;
    created_at: string;
    user_id: string;
    title: string;
    resume_url: string;
    username: string;
    interview_type: InterviewType;
};

export type InterviewType = "technical" | "techno-managerial";
