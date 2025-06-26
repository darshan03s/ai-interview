"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReport = generateReport;
const gemini_1 = __importDefault(require("./gemini"));
const prompts_1 = require("./prompts");
async function generateReport(messages, createdAt) {
    try {
        if (!gemini_1.default) {
            return "All API keys are currently rate limited. Please try again in a few minutes.";
        }
        const response = await gemini_1.default.models.generateContent({
            model: "gemini-2.5-flash",
            contents: messages,
            config: {
                systemInstruction: prompts_1.generateReportPrompt + "Interview created at: " + createdAt,
                maxOutputTokens: 1_000_000,
                temperature: 0.5,
            },
        });
        if (!response.text) {
            console.error("No response from AI - response.text is:", response.text);
            return "No response from AI";
        }
        return response.text;
    }
    catch (error) {
        console.error("Error generating report:", error);
        if (error?.error?.code === 429 || error?.error?.status === "RESOURCE_EXHAUSTED") {
            return "Rate limit exceeded. Please try again in a few minutes.";
        }
        if (error?.message?.includes("quota") || error?.message?.includes("exceeded")) {
            return "API quota exceeded. Please check your plan and billing details or try again later.";
        }
        return "An error occurred while generating the report. Please try again.";
    }
}
