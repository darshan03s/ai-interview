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
