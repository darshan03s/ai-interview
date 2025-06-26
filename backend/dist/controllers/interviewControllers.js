"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInterviewController = createInterviewController;
exports.startInterviewController = startInterviewController;
exports.continueInterviewController = continueInterviewController;
exports.getMessagesController = getMessagesController;
exports.getInterviewsController = getInterviewsController;
exports.deleteInterviewController = deleteInterviewController;
exports.renameInterviewController = renameInterviewController;
exports.getReportController = getReportController;
const supabaseUtils_1 = require("../supabase/supabaseUtils");
const gemini_1 = __importDefault(require("../llm/gemini"));
const prompts_1 = require("../llm/prompts");
const generateReport_1 = require("../llm/generateReport");
async function createInterviewController(req, res) {
    const { username, interview_type, date } = req.body;
    const file = req.file;
    if (!username) {
        res.status(400).json({ message: "Username is required" });
        return;
    }
    if (!file) {
        res.status(400).json({ message: "Resume is required" });
        return;
    }
    const user = req.user;
    if (!user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    const title = `${interview_type.charAt(0).toUpperCase() + interview_type.slice(1)} Interview - ${date}`;
    const interview = await (0, supabaseUtils_1.createInterview)(user.id, username, file, interview_type, title);
    await (0, supabaseUtils_1.createReport)(user.id, interview.interview_id, "", "");
    if (!interview) {
        res.status(500).json({ message: "Error creating interview" });
        return;
    }
    res.status(200).json({ message: "Interview created successfully", interview: interview });
}
async function startInterviewController(req, res) {
    const { interview_id } = req.body;
    if (!interview_id) {
        res.status(400).json({ message: "Interview ID is required" });
        return;
    }
    const user = req.user;
    if (!user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    const interview = await (0, supabaseUtils_1.getInterview)(user.id, interview_id);
    if (!interview) {
        res.status(404).json({ message: "Interview not found" });
        return;
    }
    try {
        const messagesHistory = await (0, supabaseUtils_1.getMessages)(interview_id, user.id);
        if (!messagesHistory) {
            res.status(500).json({ message: "Error getting messages" });
            return;
        }
        if (messagesHistory.length === 0) {
            const pdfResp = await fetch(interview.resume_url).then((response) => response.arrayBuffer());
            await (0, supabaseUtils_1.createMessage)(user.id, interview_id, `Here is my resume. I have chosen to do a ${interview.interview_type} interview.`, "user", [
                {
                    text: `Here is my resume. I have chosen to do a ${interview.interview_type} interview.`,
                },
                {
                    inlineData: {
                        mimeType: "application/pdf",
                        data: Buffer.from(pdfResp).toString("base64"),
                    },
                },
            ]);
        }
        res.status(200).json({ message: "Interview prepared successfully", interview: interview });
    }
    catch (error) {
        console.error("Error preparing interview:", error);
        res.status(500).json({ message: "Error preparing interview" });
        return;
    }
}
async function continueInterviewController(req, res) {
    const { interview_id, message } = req.body;
    if (!interview_id) {
        res.status(400).json({ errorMessage: "Interview ID is required" });
        return;
    }
    if (!message) {
        res.status(400).json({ errorMessage: "Message is required" });
        return;
    }
    const user = req.user;
    if (!user) {
        res.status(401).json({ errorMessage: "Unauthorized" });
        return;
    }
    const interview = await (0, supabaseUtils_1.getInterview)(user.id, interview_id);
    if (!interview) {
        res.status(404).json({ errorMessage: "Interview not found" });
        return;
    }
    if (interview.is_completed) {
        res.status(400).json({ errorMessage: "Interview is already completed" });
        return;
    }
    try {
        const messagesHistory = await (0, supabaseUtils_1.getMessages)(interview_id, user.id);
        const messages = [];
        if (!messagesHistory) {
            res.status(500).json({ errorMessage: "Error getting messages" });
            return;
        }
        messagesHistory.forEach((message) => {
            messages.push({
                role: message.role,
                parts: message.parts,
            });
        });
        messages.push({
            role: "user",
            parts: [
                {
                    text: message,
                },
            ],
        });
        await (0, supabaseUtils_1.createMessage)(user.id, interview_id, message, "user", [
            {
                text: message,
            },
        ]);
        const stream = await gemini_1.default.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents: messages,
            config: {
                systemInstruction: prompts_1.systemPrompt +
                    "Interview created at: " +
                    new Date(interview.created_at).toLocaleString(),
                maxOutputTokens: 1_000_000,
                temperature: 0.5,
                thinkingConfig: {
                    thinkingBudget: 1024,
                },
            },
        });
        let modelReplyRaw = "";
        for await (const chunk of stream) {
            modelReplyRaw += chunk.text;
            res.write(chunk.text);
        }
        res.end();
        await (0, supabaseUtils_1.createMessage)(user.id, interview_id, modelReplyRaw, "model", [
            { text: modelReplyRaw },
        ]);
        if (modelReplyRaw.includes("Thank you for your time, we will get back to you with the results.")) {
            await (0, supabaseUtils_1.updateInterview)(user.id, interview_id, true);
        }
    }
    catch (error) {
        console.error("Error preparing interview:", error);
        res.status(500).json({ message: "Error preparing interview" });
        return;
    }
}
async function getMessagesController(req, res) {
    const { interview_id } = req.body;
    if (!interview_id) {
        res.status(400).json({ message: "Interview ID is required" });
        return;
    }
    const user = req.user;
    if (!user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    try {
        const messages = await (0, supabaseUtils_1.getMessages)(interview_id, user.id);
        if (!messages) {
            res.status(500).json({ message: "Error getting messages" });
            return;
        }
        let messagesHistory = [];
        messages.forEach((message) => {
            messagesHistory.push({
                role: message.role,
                message: message.message,
            });
        });
        messagesHistory = messagesHistory.slice(1);
        res.status(200).json({
            message: "Messages fetched successfully",
            messagesHistory: messagesHistory,
        });
    }
    catch (error) {
        console.error("Error getting messages:", error);
        res.status(500).json({ message: "Error getting messages" });
        return;
    }
}
async function getInterviewsController(req, res) {
    const user = req.user;
    if (!user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    try {
        const interviews = await (0, supabaseUtils_1.getInterviews)(user.id);
        res.status(200).json({
            message: "Interviews fetched successfully",
            interviews: interviews,
        });
    }
    catch (error) {
        console.error("Error getting interviews:", error);
        res.status(500).json({ message: "Error getting interviews" });
    }
}
async function deleteInterviewController(req, res) {
    const { interview_id } = req.body;
    if (!interview_id) {
        res.status(400).json({ message: "Interview ID is required" });
        return;
    }
    const user = req.user;
    if (!user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    try {
        await (0, supabaseUtils_1.deleteInterview)(interview_id);
        res.status(200).json({ message: "Interview deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting interview:", error);
        res.status(500).json({ message: "Error deleting interview" });
        return;
    }
}
async function renameInterviewController(req, res) {
    const { interview_id, new_name } = req.body;
    if (!interview_id || !new_name) {
        res.status(400).json({ message: "Interview ID and new name are required" });
        return;
    }
    const user = req.user;
    if (!user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    try {
        await (0, supabaseUtils_1.renameInterview)(interview_id, new_name);
        res.status(200).json({ message: "Interview renamed successfully" });
    }
    catch (error) {
        console.error("Error renaming interview:", error);
        res.status(500).json({ message: "Error renaming interview" });
        return;
    }
}
async function getReportController(req, res) {
    const { interview_id } = req.body;
    if (!interview_id) {
        res.status(400).json({ message: "Interview ID is required" });
        return;
    }
    const user = req.user;
    if (!user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    let report;
    report = await (0, supabaseUtils_1.getReport)(user.id, interview_id);
    if (report && report.is_created) {
        res.status(200).json({ message: "Report fetched successfully", report: report });
        return;
    }
    else {
        const messagesHistory = await (0, supabaseUtils_1.getMessages)(interview_id, user.id);
        if (!messagesHistory) {
            res.status(500).json({ message: "Error getting messages" });
            return;
        }
        const messages = [];
        messagesHistory.forEach((message) => {
            messages.push({
                role: message.role,
                parts: message.parts,
            });
        });
        const interview = await (0, supabaseUtils_1.getInterview)(user.id, interview_id);
        report = await (0, generateReport_1.generateReport)(messages, new Date(interview.created_at).toLocaleString());
        if (!report) {
            res.status(500).json({ message: "Error generating report", report: "No report found" });
            return;
        }
        const reportUrl = await (0, supabaseUtils_1.uploadReport)(interview_id, report);
        if (!reportUrl) {
            res.status(500).json({ message: "Error uploading report" });
            return;
        }
        report = await (0, supabaseUtils_1.updateReport)(user.id, interview_id, report, reportUrl, true);
        if (!report) {
            res.status(500).json({ message: "Error updating report" });
            return;
        }
        res.status(200).json({ message: "Report generated successfully", report: report });
    }
}
