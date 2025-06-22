import { Router, Request, Response } from "express";
import { createInterview } from "../supabase/supabaseUtils";

const router = Router();

router.get("/", (req, res) => {
    res.send("Interview route");
});

router.post("/create-interview", async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    const interview = await createInterview(user.id);

    if (!interview) {
        res.status(500).json({ message: "Error creating interview" });
        return;
    }

    res.status(200).json({ message: "Interview created successfully", interview: interview });
});

export default router;
