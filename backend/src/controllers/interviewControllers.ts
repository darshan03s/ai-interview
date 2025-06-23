import { Request, Response } from "express";
import { createInterview } from "../supabase/supabaseUtils";
import { GoogleGenAI } from "@google/genai";

export async function createInterviewController(req: Request, res: Response) {
    const { username } = req.body;
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

    const interview = await createInterview(user.id, username, file);

    if (!interview) {
        res.status(500).json({ message: "Error creating interview" });
        return;
    }

    res.status(200).json({ message: "Interview created successfully", interview: interview });
}

export async function prepareInterviewController(req: Request, res: Response) {
    const { interview } = req.body;
    if (!interview) {
        res.status(400).json({ message: "Interview is required" });
        return;
    }

    const user = req.user;
    if (!user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    const pdfResp = await fetch(interview.resume_url).then((response) => response.arrayBuffer());

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: "You are a Interview Prep AI, you are given a resume, you need to ask questions to user based on the resume. Keep the conversation as real as a real interview. Reply 'YES' if you understand",
                        },
                        {
                            inlineData: {
                                mimeType: "application/pdf",
                                data: Buffer.from(pdfResp).toString("base64"),
                            },
                        },
                    ],
                },
            ],
        });
        if (response.text) {
            res.status(200).json({
                message: "Interview prepared successfully",
            });
        } else {
            res.status(500).json({ message: "Error preparing interview" });
        }
    } catch (error) {
        console.error("Error preparing interview:", error);
        res.status(500).json({ message: "Error preparing interview" });
        return;
    }
}
