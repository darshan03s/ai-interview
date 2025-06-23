import { nanoid } from "nanoid";
import supabase from "./supabase";
import { Part } from "@google/genai";

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
    file: Express.Multer.File,
    interview_type: string
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
        .insert({ user_id, username, resume_url: signedUrlData.signedUrl, interview_type })
        .select()
        .single();

    if (error) {
        console.error("Error creating interview:", error);
        return null;
    }
    return data;
};

export const getInterview = async (interview_id: string) => {
    const { data, error } = await supabase
        .from("interviews")
        .select("*")
        .eq("interview_id", interview_id)
        .single();
    if (error) {
        console.error("Error getting interview:", error);
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
        .from("messages")
        .insert({ user_id, interview_id, message, role, parts })
        .select()
        .single();
    if (error) {
        console.error("Error creating message:", error);
        return null;
    }
    return data;
};

export const getMessages = async (interview_id: string, user_id: string) => {
    const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("interview_id", interview_id)
        .eq("user_id", user_id)
        .order("created_at", { ascending: true });
    if (error) {
        console.error("Error getting messages:", error);
        return null;
    }
    return data;
};
