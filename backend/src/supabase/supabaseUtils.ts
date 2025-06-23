import { nanoid } from "nanoid";
import supabase from "./supabase";

export const uploadFile = async (file: Express.Multer.File) => {
    const fileId = nanoid();
    const fileExtension = file.originalname.split(".")[1];
    const fileName = `${file.originalname.split(".")[0]}-${fileId}.${fileExtension}`;
    const { data, error } = await supabase.storage.from("resumes").upload(fileName, file.buffer, {
        contentType: file.mimetype,
    });
    if (error) {
        console.error("Error uploading file:", error);
        return { error: error };
    }
    return { data: data };
};
export const createInterview = async (
    user_id: string,
    username: string,
    file: Express.Multer.File
) => {
    const { data: fileData, error: fileError } = await uploadFile(file);
    if (fileError) {
        console.error("Error uploading file to supabase:", fileError);
        return null;
    }

    const expiresIn = 3600 * 24 * 30; // 30 days

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from("resumes")
        .createSignedUrl(fileData.path, expiresIn);

    if (signedUrlError) {
        console.error("Error creating signed URL:", signedUrlError);
        return null;
    }

    const { data, error } = await supabase
        .from("interviews")
        .insert({ user_id, username, resume_url: signedUrlData.signedUrl })
        .select()
        .single();

    if (error) {
        console.error("Error creating interview:", error);
        return null;
    }
    return data;
};
