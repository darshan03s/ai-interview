import { spellCheck } from "@llm/spellCheck";
import type { ApiResponseType } from "@/types";
import type { Request, Response } from "express";

export const spellCheckController = async (req: Request, res: Response<ApiResponseType>) => {
    const { text } = req.body;
    const result = await spellCheck(text);
    res.json({
        success: true,
        message: "Spell check completed",
        data: result,
    });
};
