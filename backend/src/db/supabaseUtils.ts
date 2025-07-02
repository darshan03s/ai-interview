import supabase from './supabase';
import { Part } from '@google/genai';
// import { mdToPdf } from "@utils/mdToPdf";

export const uploadFile = async (file: Express.Multer.File) => {
    const { nanoid: generateNanoid } = await import('nanoid');
    const fileId = generateNanoid();
    const fileExtension = file.originalname.split('.')[1];
    const fileName = `${file.originalname.split('.')[0]}-${fileId}.${fileExtension}`;
    const { data, error } = await supabase.storage.from('resumes').upload(fileName, file.buffer, {
        contentType: file.mimetype,
    });
    if (error) {
        console.error('Error uploading file:', error);
        return { error: error };
    }
    return { data: data };
};

export const createInterview = async (
    user_id: string,
    username: string,
    file: Express.Multer.File,
    interview_type: string,
    title: string
) => {
    const { data: fileData, error: fileError } = await uploadFile(file);
    if (fileError) {
        console.error('Error uploading file to supabase:', fileError);
        return null;
    }

    const expiresIn = 3600 * 24 * 30; // 30 days

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('resumes')
        .createSignedUrl(fileData.path, expiresIn);

    if (signedUrlError) {
        console.error('Error creating signed URL:', signedUrlError);
        return null;
    }

    const { data, error } = await supabase
        .from('interviews')
        .insert({
            user_id,
            username,
            resume_url: signedUrlData.signedUrl,
            interview_type,
            title,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating interview:', error);
        return null;
    }
    return data;
};

export const getInterview = async (user_id: string, interview_id: string) => {
    const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('user_id', user_id)
        .eq('interview_id', interview_id)
        .single();
    if (error) {
        console.error('Error getting interview:', error);
        return null;
    }
    return data;
};

export const updateInterview = async (
    user_id: string,
    interview_id: string,
    is_completed: boolean
) => {
    const { data, error } = await supabase
        .from('interviews')
        .update({ is_completed })
        .eq('user_id', user_id)
        .eq('interview_id', interview_id);
    if (error) {
        console.error('Error updating interview:', error);
        return null;
    }
    return data;
};

export const createMessage = async (
    user_id: string,
    interview_id: string,
    message: string,
    role: string,
    parts: Part[]
) => {
    const { data, error } = await supabase
        .from('messages')
        .insert({ user_id, interview_id, message, role, parts })
        .select()
        .single();
    if (error) {
        console.error('Error creating message:', error);
        return null;
    }
    return data;
};

export const getMessages = async (interview_id: string, user_id: string) => {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('interview_id', interview_id)
        .eq('user_id', user_id)
        .order('created_at', { ascending: true });
    if (error) {
        console.error('Error getting messages:', error);
        return null;
    }
    return data;
};

const extractFilePathFromSignedUrl = (signedUrl: string): string | null => {
    try {
        const url = new URL(signedUrl);
        const pathSegments = url.pathname.split('/');
        const objectIndex = pathSegments.findIndex((segment) => segment === 'object');

        if (objectIndex !== -1 && pathSegments[objectIndex + 1] === 'sign') {
            const filePath = pathSegments.slice(objectIndex + 2).join('/');
            return decodeURIComponent(filePath);
        }

        return null;
    } catch (error) {
        console.error('Error extracting file path from signed URL:', error);
        return null;
    }
};

export const deleteInterview = async (interview_id: string) => {
    const { data: interviewData, error: getError } = await supabase
        .from('interviews')
        .select('resume_url')
        .eq('interview_id', interview_id)
        .single();

    if (getError) {
        console.error('Error getting interview for deletion:', getError);
        return null;
    }

    if (interviewData?.resume_url) {
        const filePath = extractFilePathFromSignedUrl(interviewData.resume_url);
        if (filePath) {
            const { error: deleteFileError } = await supabase.storage
                .from('resumes')
                .remove([filePath]);

            if (deleteFileError) {
                console.error('Error deleting resume file:', deleteFileError);
            } else {
                console.log('Successfully deleted resume file:', filePath);
            }
        }
    }

    const { data, error } = await supabase
        .from('interviews')
        .delete()
        .eq('interview_id', interview_id);

    if (error) {
        console.error('Error deleting interview:', error);
        return null;
    }
    return data;
};

export const renameInterview = async (interview_id: string, new_name: string) => {
    const { data, error } = await supabase
        .from('interviews')
        .update({ title: new_name })
        .eq('interview_id', interview_id);
    if (error) {
        console.error('Error renaming interview:', error);
        return null;
    }
    return data;
};

export const getInterviews = async (user_id: string) => {
    const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false });
    if (error) {
        console.error('Error getting interviews:', error);
        return null;
    }
    return data;
};

export const getReport = async (user_id: string, interview_id: string) => {
    const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user_id)
        .eq('interview_id', interview_id)
        .single();
    if (error) {
        if (error.code === 'PGRST116') {
            return null;
        }
        console.error('Error getting report:', error);
        return null;
    }
    return data;
};

export const createReport = async (
    user_id: string,
    interview_id: string,
    report: string,
    report_url: string,
    is_created: boolean = false
) => {
    const { data, error } = await supabase
        .from('reports')
        .insert({ user_id, interview_id, report, report_pdf: report_url, is_created: is_created })
        .select()
        .single();
    if (error) {
        console.error('Error creating report:', error);
        return null;
    }
    return data;
};

export const updateReport = async (
    user_id: string,
    interview_id: string,
    report: string,
    report_url: string,
    is_created: boolean
) => {
    const { data, error } = await supabase
        .from('reports')
        .update({ report, report_pdf: report_url, is_created: is_created })
        .eq('user_id', user_id)
        .eq('interview_id', interview_id)
        .select()
        .single();

    if (error) {
        console.error('Error updating report:', error);
        return null;
    }
    return data;
};

// export const uploadReport = async (interview_id: string, report: string) => {
//     const pdf = await mdToPdf(report);
//     const pdfName = `${interview_id}-report.pdf`;
//     const { data, error } = await supabase.storage.from("reports").upload(pdfName, pdf, {
//         contentType: "application/pdf",
//     });
//     if (error) {
//         console.error("Error uploading report:", error);
//         return null;
//     }
//     const expiresIn = 3600 * 24 * 30; // 30 days
//     const { data: signedUrlData, error: signedUrlError } = await supabase.storage
//         .from("reports")
//         .createSignedUrl(data.path, expiresIn);
//     if (signedUrlError) {
//         console.error("Error creating signed URL:", signedUrlError);
//         return null;
//     }

//     return signedUrlData.signedUrl;
// };

export const endInterview = async (interview_id: string, user_id: string) => {
    const { data, error } = await supabase
        .from('interviews')
        .update({ is_completed: true })
        .eq('interview_id', interview_id)
        .eq('user_id', user_id);
    if (error) {
        console.error('Error ending interview:', error);
        return null;
    }
    return data;
};
