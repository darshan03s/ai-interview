import { Chat, GenerateContentResponse, GoogleGenAI } from '@google/genai';
import { AiMessageType } from './types';

export type Message = {
    role: 'user' | 'model';
    content: string;
};

const GEMINI_MODELS = {
    flash: 'gemini-2.5-flash',
    pro: 'gemini-2.5-pro',
    'flash-lite': 'gemini-2.5-flash-lite-preview-06-17',
};

type GeminiModel = keyof typeof GEMINI_MODELS;

export class GeminiClient {
    private ai!: GoogleGenAI;
    private chat!: Chat;
    private model: GeminiModel;

    constructor(
        model: GeminiModel = 'flash',
        messagesHistory: AiMessageType[],
        systemInstruction: string
    ) {
        this.model = model;
        try {
            this.ai = new GoogleGenAI({
                apiKey: process.env.GEMINI_API_KEY || '',
            });
            if (!this.chat) {
                this.initializeChat(messagesHistory, this.model, systemInstruction);
            }
        } catch (error) {
            console.error(error);
        }
    }

    private initializeChat(
        history: AiMessageType[],
        model: GeminiModel,
        systemInstruction: string
    ) {
        if (!this.ai) {
            throw new Error('AI not initialized');
        }

        this.chat = this.ai.chats.create({
            model: GEMINI_MODELS[model],
            history: history,
            config: {
                systemInstruction: systemInstruction,
            },
        });
    }

    async chatWithGemini(newMessage: string): Promise<string> {
        if (!this.ai) {
            throw new Error('AI not initialized');
        }

        if (!this.chat) {
            throw new Error('Chat not initialized');
        }

        const response = await this.chat.sendMessage({
            message: newMessage,
        });
        if (response.text) {
            return response.text;
        } else {
            return 'No response from AI';
        }
    }

    async chatWithGeminiStream(
        newMessage: string
    ): Promise<AsyncGenerator<GenerateContentResponse, any, any>> {
        if (!this.ai) {
            throw new Error('AI not initialized');
        }

        if (!this.chat) {
            throw new Error('Chat not initialized');
        }

        const response = await this.chat.sendMessageStream({
            message: newMessage,
        });

        return response;
    }
}
