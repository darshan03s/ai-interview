export type ApiResponseType = {
    success: boolean;
    message?: string;
    data?: any;
    error?: {
        code: string;
        message: string;
    };
};
