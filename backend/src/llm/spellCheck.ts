import { GoogleGenAI } from "@google/genai";
import { spellCheckPrompt } from "./prompts";
const gemini = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export async function spellCheck(text: string): Promise<string | undefined> {
    const response = await gemini.models.generateContent({
        model: "gemini-2.0-flash",
        contents: text,
        config: {
            systemInstruction: spellCheckPrompt,
            maxOutputTokens: 1_000_000,
            temperature: 0.5,
        },
    });

    return response.text;
}
