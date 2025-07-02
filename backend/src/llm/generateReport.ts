import gemini from './gemini';

import { Message } from './types';
import { generateReportPrompt } from './prompts';

export async function generateReport(
    messages: Message[],
    createdAt: string
): Promise<string | null> {
    try {
        if (!gemini) {
            return 'All API keys are currently rate limited. Please try again in a few minutes.';
        }

        const response = await gemini.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: messages,
            config: {
                systemInstruction: generateReportPrompt + 'Interview created at: ' + createdAt,
                maxOutputTokens: 1_000_000,
                temperature: 0.5,
            },
        });

        if (!response.text) {
            console.error('No response from AI - response.text is:', response.text);
            return 'No response from AI';
        }

        return response.text;
    } catch (error: any) {
        console.error('Error generating report:', error);

        if (error?.error?.code === 429 || error?.error?.status === 'RESOURCE_EXHAUSTED') {
            return 'Rate limit exceeded. Please try again in a few minutes.';
        }

        if (error?.message?.includes('quota') || error?.message?.includes('exceeded')) {
            return 'API quota exceeded. Please check your plan and billing details or try again later.';
        }

        return 'An unknown error occurred while generating the report with LLM. Please try again.';
    }
}
