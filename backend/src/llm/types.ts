import { Part } from '@google/genai';

export type AiMessageType = {
    role: string;
    parts: Part[];
};
