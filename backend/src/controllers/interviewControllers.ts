import { Request, Response } from "express";
import {
    createInterview,
    createMessage,
    getInterview,
    getMessages,
    getInterviews,
    deleteInterview,
    renameInterview,
    getReport,
    createReport,
    updateReport,
    uploadReport,
} from "../supabase/supabaseUtils";
import gemini from "../llm/gemini";
import { systemPrompt } from "../llm/prompts";
import { generateReport } from "../llm/generateReport";
import { Message } from "../llm/types";

export async function createInterviewController(req: Request, res: Response) {
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

    const interview = await createInterview(user.id, username, file, interview_type, title);
    await createReport(user.id, interview.interview_id, "", "");

    if (!interview) {
        res.status(500).json({ message: "Error creating interview" });
        return;
    }

    res.status(200).json({ message: "Interview created successfully", interview: interview });
}

export async function startInterviewController(req: Request, res: Response) {
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

    const interview = await getInterview(user.id, interview_id);
    if (!interview) {
        res.status(404).json({ message: "Interview not found" });
        return;
    }

    try {
        const messagesHistory = await getMessages(interview_id, user.id);
        if (!messagesHistory) {
            res.status(500).json({ message: "Error getting messages" });
            return;
        }
        if (messagesHistory.length === 0) {
            const pdfResp = await fetch(interview.resume_url).then((response) =>
                response.arrayBuffer()
            );
            await createMessage(
                user.id,
                interview_id,
                `Here is my resume. I have chosen to do a ${interview.interview_type} interview.`,
                "user",
                [
                    {
                        text: `Here is my resume. I have chosen to do a ${interview.interview_type} interview.`,
                    },
                    {
                        inlineData: {
                            mimeType: "application/pdf",
                            data: Buffer.from(pdfResp).toString("base64"),
                        },
                    },
                ]
            );
        }

        res.status(200).json({ message: "Interview prepared successfully", interview: interview });
    } catch (error) {
        console.error("Error preparing interview:", error);
        res.status(500).json({ message: "Error preparing interview" });
        return;
    }
}

export async function continueInterviewController(req: Request, res: Response) {
    const { interview_id, message } = req.body;
    if (!interview_id) {
        res.status(400).json({ message: "Interview ID is required" });
        return;
    }
    if (!message) {
        res.status(400).json({ message: "Message is required" });
        return;
    }

    const user = req.user;
    if (!user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    const interview = await getInterview(user.id, interview_id);
    if (!interview) {
        res.status(404).json({ message: "Interview not found" });
        return;
    }

    try {
        const messagesHistory = await getMessages(interview_id, user.id);
        const messages: Message[] = [];
        if (!messagesHistory) {
            res.status(500).json({ message: "Error getting messages" });
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
        await createMessage(user.id, interview_id, message, "user", [
            {
                text: message,
            },
        ]);

        const stream = await gemini.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents: messages,
            config: {
                systemInstruction:
                    systemPrompt +
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

        await createMessage(user.id, interview_id, modelReplyRaw, "model", [
            { text: modelReplyRaw },
        ]);
    } catch (error) {
        console.error("Error preparing interview:", error);
        res.status(500).json({ message: "Error preparing interview" });
        return;
    }
}

export async function getMessagesController(req: Request, res: Response) {
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
        const messages = await getMessages(interview_id, user.id);
        if (!messages) {
            res.status(500).json({ message: "Error getting messages" });
            return;
        }

        let messagesHistory: { role: string; message: string }[] = [];
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
    } catch (error) {
        console.error("Error getting messages:", error);
        res.status(500).json({ message: "Error getting messages" });
        return;
    }
}

export async function getInterviewsController(req: Request, res: Response) {
    const user = req.user;
    if (!user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    try {
        const interviews = await getInterviews(user.id);
        res.status(200).json({
            message: "Interviews fetched successfully",
            interviews: interviews,
        });
    } catch (error) {
        console.error("Error getting interviews:", error);
        res.status(500).json({ message: "Error getting interviews" });
    }
}

export async function deleteInterviewController(req: Request, res: Response) {
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
        await deleteInterview(interview_id);
        res.status(200).json({ message: "Interview deleted successfully" });
    } catch (error) {
        console.error("Error deleting interview:", error);
        res.status(500).json({ message: "Error deleting interview" });
        return;
    }
}

export async function renameInterviewController(req: Request, res: Response) {
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
        await renameInterview(interview_id, new_name);
        res.status(200).json({ message: "Interview renamed successfully" });
    } catch (error) {
        console.error("Error renaming interview:", error);
        res.status(500).json({ message: "Error renaming interview" });
        return;
    }
}

export async function getReportController(req: Request, res: Response) {
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

    let report: string | null = null;

    report = await getReport(user.id, interview_id);
    if (report) {
        res.status(200).json({ message: "Report fetched successfully", report: report });
        return;
    } else {
        const messagesHistory = await getMessages(interview_id, user.id);
        if (!messagesHistory) {
            res.status(500).json({ message: "Error getting messages" });
            return;
        }

        const messages: Message[] = [];
        messagesHistory.forEach((message) => {
            messages.push({
                role: message.role,
                parts: message.parts,
            });
        });

        const interview = await getInterview(user.id, interview_id);
        report = await generateReport(messages, new Date(interview.created_at).toLocaleString());
        if (!report) {
            res.status(500).json({ message: "Error generating report", report: "No report found" });
            return;
        }
        const reportUrl = await uploadReport(interview_id, report);
        if (!reportUrl) {
            res.status(500).json({ message: "Error uploading report" });
            return;
        }
        await updateReport(user.id, interview_id, report, reportUrl, true);
        res.status(200).json({ message: "Report generated successfully", report: report });
    }
}
