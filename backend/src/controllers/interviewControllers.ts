import { Request, Response } from "express";
import { createInterview } from "../supabase/supabaseUtils.js";

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
