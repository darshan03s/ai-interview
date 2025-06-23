import { Request, Response } from "express";
import {
    createInterview,
    createMessage,
    getInterview,
    getMessages,
} from "../supabase/supabaseUtils";
import { GoogleGenAI } from "@google/genai";
import { systemPrompt } from "../llm/prompts";

export async function createInterviewController(req: Request, res: Response) {
    const { username, interview_type } = req.body;
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

    const interview = await createInterview(user.id, username, file, interview_type);

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

    const interview = await getInterview(interview_id);
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

const gemini = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

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

    const interview = await getInterview(interview_id);
    if (!interview) {
        res.status(404).json({ message: "Interview not found" });
        return;
    }

    try {
        const messagesHistory = await getMessages(interview_id, user.id);
        const messages = [];
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

        console.log(messages);

        const stream = await gemini.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents: messages,
            config: {
                systemInstruction: systemPrompt,
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
