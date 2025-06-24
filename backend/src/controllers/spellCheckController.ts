import { Request, Response } from "express";
import { spellCheck } from "../llm/spellCheck";

export const spellCheckController = async (req: Request, res: Response) => {
    const { text } = req.body;
    const result = await spellCheck(text);
    res.json({
        text: result,
    });
};
