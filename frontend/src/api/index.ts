import type { Interview } from "@/types";
import { devLog } from "@/utils/devUtils";

const BASE_URL = import.meta.env.VITE_API_URL;

export const createInterview = async (token: string, username: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("username", username);
    const response = await fetch(`${BASE_URL}/interview/create-interview`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });

    return response;
};

export const prepareInterview = async (token: string, interview: Interview) => {
    devLog("Preparing interview", interview);
    const response = await fetch(`${BASE_URL}/interview/prepare-interview`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            interview: interview,
        }),
    });

    return response;
};
