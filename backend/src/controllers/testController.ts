import puppeteer from "puppeteer";
import { Request, Response } from "express";
import { ApiResponseType } from "@/types";

export const testPuppeteerController = async (req: Request, res: Response<ApiResponseType>) => {
    try {
        const browser = await puppeteer.launch();
        await browser.close();
        res.json({ success: true, message: "Puppeteer is working correctly!" });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Puppeteer failed to initialize",
            error: {
                code: "PUPPETEER_INIT_ERROR",
                message: error instanceof Error ? error.message : "Unknown error",
            },
        });
    }
};
