import { Part } from "@google/genai";

export type Message = {
    role: string;
    parts: Part[];
};
