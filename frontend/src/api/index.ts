const BASE_URL = import.meta.env.VITE_API_URL;

export const createInterview = async (
    token: string,
    username: string,
    file: File,
    interviewType: string,
    date: string
) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('username', username);
    formData.append('interview_type', interviewType);
    formData.append('date', date);
    const response = await fetch(`${BASE_URL}/interview/create-interview`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });

    return response;
};

export const startInterview = async (token: string, interviewId: string) => {
    const response = await fetch(`${BASE_URL}/interview/start-interview`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            interview_id: interviewId,
        }),
    });

    return response;
};

export const continueInterview = async (token: string, interviewId: string, message: string) => {
    const response = await fetch(`${BASE_URL}/interview/continue-interview`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            interview_id: interviewId,
            message: message,
        }),
    });

    return response;
};

export const getMessagesHistory = async (token: string, interviewId: string) => {
    const response = await fetch(`${BASE_URL}/interview/get-messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            interview_id: interviewId,
        }),
    });

    return response;
};

export const getInterviews = async (token: string) => {
    const response = await fetch(`${BASE_URL}/interview/get-interviews`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });

    return response;
};

export const deleteInterview = async (token: string, interviewId: string) => {
    const response = await fetch(`${BASE_URL}/interview/delete-interview`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            interview_id: interviewId,
        }),
    });

    return response;
};

export const renameInterview = async (token: string, interviewId: string, newName: string) => {
    const response = await fetch(`${BASE_URL}/interview/rename-interview`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            interview_id: interviewId,
            new_name: newName,
        }),
    });

    return response;
};

export const spellCheck = async (token: string, text: string) => {
    const response = await fetch(`${BASE_URL}/spell-check`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            text: text,
        }),
    });

    return response;
};

export const getReport = async (token: string, interviewId: string) => {
    const response = await fetch(`${BASE_URL}/interview/get-report`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            interview_id: interviewId,
        }),
    });

    return response;
};

export const endInterview = async (token: string, interviewId: string) => {
    const response = await fetch(`${BASE_URL}/interview/end-interview`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            interview_id: interviewId,
        }),
    });

    return response;
};
