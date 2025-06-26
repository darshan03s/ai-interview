"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadReport = exports.updateReport = exports.createReport = exports.getReport = exports.getInterviews = exports.renameInterview = exports.deleteInterview = exports.getMessages = exports.createMessage = exports.updateInterview = exports.getInterview = exports.createInterview = exports.uploadFile = void 0;
const nanoid_1 = require("nanoid");
const supabase_1 = __importDefault(require("./supabase"));
const mdToPdf_1 = require("../utils/mdToPdf");
const uploadFile = async (file) => {
    const fileId = (0, nanoid_1.nanoid)();
    const fileExtension = file.originalname.split(".")[1];
    const fileName = `${file.originalname.split(".")[0]}-${fileId}.${fileExtension}`;
    const { data, error } = await supabase_1.default.storage.from("resumes").upload(fileName, file.buffer, {
        contentType: file.mimetype,
    });
    if (error) {
        console.error("Error uploading file:", error);
        return { error: error };
    }
    return { data: data };
};
exports.uploadFile = uploadFile;
const createInterview = async (user_id, username, file, interview_type, title) => {
    const { data: fileData, error: fileError } = await (0, exports.uploadFile)(file);
    if (fileError) {
        console.error("Error uploading file to supabase:", fileError);
        return null;
    }
    const expiresIn = 3600 * 24 * 30; // 30 days
    const { data: signedUrlData, error: signedUrlError } = await supabase_1.default.storage
        .from("resumes")
        .createSignedUrl(fileData.path, expiresIn);
    if (signedUrlError) {
        console.error("Error creating signed URL:", signedUrlError);
        return null;
    }
    const { data, error } = await supabase_1.default
        .from("interviews")
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
        console.error("Error creating interview:", error);
        return null;
    }
    return data;
};
exports.createInterview = createInterview;
const getInterview = async (user_id, interview_id) => {
    const { data, error } = await supabase_1.default
        .from("interviews")
        .select("*")
        .eq("user_id", user_id)
        .eq("interview_id", interview_id)
        .single();
    if (error) {
        console.error("Error getting interview:", error);
        return null;
    }
    return data;
};
exports.getInterview = getInterview;
const updateInterview = async (user_id, interview_id, is_completed) => {
    const { data, error } = await supabase_1.default
        .from("interviews")
        .update({ is_completed })
        .eq("user_id", user_id)
        .eq("interview_id", interview_id);
    if (error) {
        console.error("Error updating interview:", error);
        return null;
    }
    return data;
};
exports.updateInterview = updateInterview;
const createMessage = async (user_id, interview_id, message, role, parts) => {
    const { data, error } = await supabase_1.default
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
exports.createMessage = createMessage;
const getMessages = async (interview_id, user_id) => {
    const { data, error } = await supabase_1.default
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
exports.getMessages = getMessages;
const deleteInterview = async (interview_id) => {
    const { data, error } = await supabase_1.default
        .from("interviews")
        .delete()
        .eq("interview_id", interview_id);
    if (error) {
        console.error("Error deleting interview:", error);
        return null;
    }
    return data;
};
exports.deleteInterview = deleteInterview;
const renameInterview = async (interview_id, new_name) => {
    const { data, error } = await supabase_1.default
        .from("interviews")
        .update({ title: new_name })
        .eq("interview_id", interview_id);
    if (error) {
        console.error("Error renaming interview:", error);
        return null;
    }
    return data;
};
exports.renameInterview = renameInterview;
const getInterviews = async (user_id) => {
    const { data, error } = await supabase_1.default
        .from("interviews")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", { ascending: false });
    if (error) {
        console.error("Error getting interviews:", error);
        return null;
    }
    return data;
};
exports.getInterviews = getInterviews;
const getReport = async (user_id, interview_id) => {
    const { data, error } = await supabase_1.default
        .from("reports")
        .select("*")
        .eq("user_id", user_id)
        .eq("interview_id", interview_id)
        .single();
    if (error) {
        if (error.code === "PGRST116") {
            return null;
        }
        console.error("Error getting report:", error);
        return null;
    }
    return data;
};
exports.getReport = getReport;
const createReport = async (user_id, interview_id, report, report_url, is_created = false) => {
    const { data, error } = await supabase_1.default
        .from("reports")
        .insert({ user_id, interview_id, report, report_pdf: report_url, is_created: is_created })
        .select()
        .single();
    if (error) {
        console.error("Error creating report:", error);
        return null;
    }
    return data;
};
exports.createReport = createReport;
const updateReport = async (user_id, interview_id, report, report_url, is_created) => {
    const { data, error } = await supabase_1.default
        .from("reports")
        .update({ report, report_pdf: report_url, is_created: is_created })
        .eq("user_id", user_id)
        .eq("interview_id", interview_id)
        .select()
        .single();
    if (error) {
        console.error("Error updating report:", error);
        return null;
    }
    return data;
};
exports.updateReport = updateReport;
const uploadReport = async (interview_id, report) => {
    const pdf = await (0, mdToPdf_1.mdToPdf)(report);
    const pdfName = `${interview_id}-report.pdf`;
    const { data, error } = await supabase_1.default.storage.from("reports").upload(pdfName, pdf, {
        contentType: "application/pdf",
    });
    if (error) {
        console.error("Error uploading report:", error);
        return null;
    }
    const expiresIn = 3600 * 24 * 30; // 30 days
    const { data: signedUrlData, error: signedUrlError } = await supabase_1.default.storage
        .from("reports")
        .createSignedUrl(data.path, expiresIn);
    if (signedUrlError) {
        console.error("Error creating signed URL:", signedUrlError);
        return null;
    }
    return signedUrlData.signedUrl;
};
exports.uploadReport = uploadReport;
