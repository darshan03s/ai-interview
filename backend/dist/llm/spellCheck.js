"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.spellCheck = spellCheck;
const genai_1 = require("@google/genai");
const prompts_1 = require("./prompts");
const gemini = new genai_1.GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});
async function spellCheck(text) {
    const response = await gemini.models.generateContent({
        model: "gemini-2.0-flash",
        contents: text,
        config: {
            systemInstruction: prompts_1.spellCheckPrompt,
            maxOutputTokens: 1_000_000,
            temperature: 0.5,
        },
    });
    return response.text;
}
