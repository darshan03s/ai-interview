import { AiMessageType } from './types';
import { generateReportPrompt } from './prompts';
import { GeminiClient } from './geminiClient';

export async function generateReport(
  messages: AiMessageType[],
  createdAt: string
): Promise<string | null> {
  console.log('Generating report..., messages:', messages.length);
  try {
    const geminiClient = new GeminiClient(
      'flash',
      messages,
      generateReportPrompt + 'Interview created at: ' + createdAt
    );

    const response = await geminiClient!.chatWithGemini('Now generate report.');

    if (!response) {
      console.error('No response from AI - response.text is:', response);
      return 'No response from AI';
    }

    return response;
  } catch (error: any) {
    console.error('Error generating report:', error);

    if (error?.error?.code === 429 || error?.error?.status === 'RESOURCE_EXHAUSTED') {
      return 'Rate limit exceeded. Please try again in a few minutes.';
    }

    if (error?.message?.includes('quota') || error?.message?.includes('exceeded')) {
      return 'API quota exceeded. Please check your plan and billing details or try again later.';
    }

    return 'An unknown error occurred while generating the report with LLM.';
  }
}
