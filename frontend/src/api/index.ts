const BASE_URL = import.meta.env.VITE_API_URL;

export const createInterview = async (token: string) => {
    const response = await fetch(`${BASE_URL}/interview/create-interview`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    return response;
};
