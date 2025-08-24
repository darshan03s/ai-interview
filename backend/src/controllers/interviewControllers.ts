import { Request, Response } from 'express';
import {
    createInterview,
    createMessage,
    getInterview,
    getMessages,
    getInterviews,
    deleteInterview,
    renameInterview,
    getReport,
    createReport,
    updateReport,
    // uploadReport,
    updateInterview,
    endInterview,
} from '@db/supabaseUtils';
import gemini from '@llm/gemini';
import { systemPrompt } from '@llm/prompts';
import { generateReport } from '@llm/generateReport';
import { AiMessageType } from '@llm/types';
import type { ApiResponseType, ConversationMessageType } from '@/types';
import { LRUCache } from 'lru-cache';
import { Part } from '@google/genai';

export const messagesCache = new LRUCache<string, AiMessageType[]>({
    max: 500,
    ttl: 1000 * 60 * 60,
    allowStale: false,
    updateAgeOnGet: false,
});

export async function createInterviewController(req: Request, res: Response<ApiResponseType>) {
    const { username, interview_type, date } = req.body;
    const file = req.file;
    if (!username) {
        res.status(400).json({
            success: false,
            error: { code: 'USERNAME_REQUIRED', message: 'Username is required' },
        });
        return;
    }

    if (!file) {
        res.status(400).json({
            success: false,
            error: { code: 'RESUME_REQUIRED', message: 'Resume is required' },
        });
        return;
    }

    const user = req.user;

    if (!user) {
        res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
        });
        return;
    }

    console.log('Creating interview for user:', user.id);

    const title = `${interview_type.charAt(0).toUpperCase() + interview_type.slice(1)} Interview - ${date}`;

    const interview = await createInterview(user.id, username, file, interview_type, title);
    if (!interview) {
        res.status(500).json({
            success: false,
            error: { code: 'ERROR_CREATING_INTERVIEW', message: 'Error creating interview' },
        });
        return;
    }
    await createReport(user.id, interview.interview_id, '', '');

    res.status(200).json({
        success: true,
        message: 'Interview created successfully',
        data: interview,
    });
}

export async function startInterviewController(req: Request, res: Response<ApiResponseType>) {
    const { interview_id } = req.body;
    if (!interview_id) {
        res.status(400).json({
            success: false,
            error: { code: 'INTERVIEW_ID_REQUIRED', message: 'Interview ID is required' },
        });
        return;
    }

    const user = req.user;
    if (!user) {
        res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
        });
        return;
    }

    const interview = await getInterview(user.id, interview_id);
    if (!interview) {
        res.status(404).json({
            success: false,
            error: { code: 'INTERVIEW_NOT_FOUND', message: 'Interview not found' },
        });
        return;
    }

    console.log('Starting interview for user:', user.id, interview_id);

    try {
        const messagesHistory = await getMessages(interview_id, user.id);
        let messagesHistoryForConversation: ConversationMessageType[] = [];
        const messagesHistoryForAi: AiMessageType[] = [];

        if (!messagesHistory) {
            res.status(500).json({
                success: false,
                error: { code: 'ERROR_GETTING_MESSAGES', message: 'Error getting messages' },
            });
            return;
        }
        if (messagesHistory.length === 0) {
            const pdfResp = await fetch(interview.resume_url!).then((response) =>
                response.arrayBuffer()
            );
            const partArray: Part[] = [
                {
                    text: `Here is my resume. I have chosen to do a ${interview.interview_type} interview.`,
                },
                {
                    inlineData: {
                        mimeType: 'application/pdf',
                        data: Buffer.from(pdfResp).toString('base64'),
                    },
                },
            ];
            await createMessage(
                user.id,
                interview_id,
                `Here is my resume. I have chosen to do a ${interview.interview_type} interview.`,
                'user',
                partArray
            );
            messagesHistoryForAi.push({
                role: 'user',
                parts: partArray,
            });
        }

        messagesHistory.forEach((message) => {
            messagesHistoryForAi.push({
                role: message.role as 'user' | 'model',
                parts: message.parts as Part[],
            });
        });

        messagesCache.set(interview_id, messagesHistoryForAi as AiMessageType[]);

        if (messagesHistory.length > 0) {
            messagesHistory.forEach((message) => {
                messagesHistoryForConversation.push({
                    role: message.role as 'user' | 'model',
                    message: message.message!,
                });
            });
        }

        messagesHistoryForConversation = messagesHistoryForConversation.slice(1);

        res.status(200).json({
            success: true,
            message: 'Interview prepared successfully',
            data: {
                interview,
                messagesHistory: messagesHistoryForConversation,
            },
        });
        return;
    } catch (error) {
        console.error('Error preparing interview:', error);
        res.status(500).json({
            success: false,
            error: { code: 'ERROR_PREPARING_INTERVIEW', message: 'Error preparing interview' },
        });
        return;
    }
}

export async function continueInterviewController(req: Request, res: Response<ApiResponseType>) {
    const { interview_id, message } = req.body;
    // 1. Check if interview_id and message are provided
    if (!interview_id) {
        res.status(400).json({
            success: false,
            error: { code: 'INTERVIEW_ID_REQUIRED', message: 'Interview ID is required' },
        });
        return;
    }

    // 2. Check if message is provided
    if (!message) {
        res.status(400).json({
            success: false,
            error: { code: 'MESSAGE_REQUIRED', message: 'Message is required' },
        });
        return;
    }

    // 3. Check if user is authenticated
    const user = req.user;
    if (!user) {
        res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
        });
        return;
    }

    // 4. Check if interview exists
    const interview = await getInterview(user.id, interview_id);
    if (!interview) {
        res.status(404).json({
            success: false,
            error: { code: 'INTERVIEW_NOT_FOUND', message: 'Interview not found' },
        });
        return;
    }

    // 5. Check if interview is completed
    if (interview.is_completed) {
        res.status(200).json({
            success: true,
            message: 'Interview is already completed',
            data: interview,
        });
        return;
    }

    console.log('Continuing interview for user:', user.id, interview_id);

    try {
        // 6. Get messages history
        const messagesHistory = await getMessages(interview_id, user.id);
        const messages: AiMessageType[] = [];

        // 7. Check if messages history is found
        if (!messagesHistory) {
            res.status(500).json({
                success: false,
                error: { code: 'ERROR_GETTING_MESSAGES', message: 'Error getting messages' },
            });
            return;
        }

        // 8. Transform messages history to for AI
        messagesHistory.forEach((message) => {
            messages.push({
                role: message.role as 'user' | 'model',
                parts: message.parts as Part[],
            });
        });

        // 9. Add new message to messages history for AI
        messages.push({
            role: 'user',
            parts: [
                {
                    text: message,
                },
            ],
        });

        // 10. Create new message in database for user
        await createMessage(user.id, interview_id, message, 'user', [
            {
                text: message,
            },
        ]);

        // 11. Generate response from AI
        const stream = await gemini.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: messages,
            config: {
                systemInstruction:
                    systemPrompt +
                    'Interview created at: ' +
                    new Date(interview.created_at).toLocaleString(),
                maxOutputTokens: 1_000_000,
                temperature: 0.5,
                thinkingConfig: {
                    thinkingBudget: 1024,
                },
            },
        });

        // 12. Send response stream, combine chunks to a single string
        let modelReplyRaw = '';
        for await (const chunk of stream) {
            modelReplyRaw += chunk.text;
            res.write(chunk.text);
        }

        res.end();

        // 13. Create new message in database from response
        await createMessage(user.id, interview_id, modelReplyRaw, 'model', [
            { text: modelReplyRaw },
        ]);

        // 14. Check if response contains end of interview message
        if (
            modelReplyRaw.includes(
                'Thank you for your time, we will get back to you with the results.'
            )
        ) {
            // 15. Update interview as completed
            await updateInterview(user.id, interview_id, true);
        }
    } catch (error) {
        console.error('Error preparing interview:', error);
        res.status(500).json({
            success: false,
            error: { code: 'ERROR_PREPARING_INTERVIEW', message: 'Error preparing interview' },
        });
        return;
    }
}

export async function getMessagesController(req: Request, res: Response<ApiResponseType>) {
    const { interview_id } = req.body;
    if (!interview_id) {
        res.status(400).json({
            success: false,
            error: { code: 'INTERVIEW_ID_REQUIRED', message: 'Interview ID is required' },
        });
        return;
    }

    const user = req.user;
    if (!user) {
        res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
        });
        return;
    }

    console.log('Getting messages for user:', user.id, interview_id);

    try {
        const messages = await getMessages(interview_id, user.id);
        if (!messages) {
            res.status(500).json({
                success: false,
                error: { code: 'ERROR_GETTING_MESSAGES', message: 'Error getting messages' },
            });
            return;
        }

        let messagesHistory: ConversationMessageType[] = [];
        messages.forEach((message) => {
            messagesHistory.push({
                role: message.role as 'user' | 'model',
                message: message.message!,
            });
        });

        messagesHistory = messagesHistory.slice(1);

        res.status(200).json({
            success: true,
            message: 'Messages fetched successfully',
            data: messagesHistory,
        });
    } catch (error) {
        console.error('Error getting messages:', error);
        res.status(500).json({
            success: false,
            error: { code: 'ERROR_GETTING_MESSAGES', message: 'Error getting messages' },
        });
        return;
    }
}

export async function getInterviewsController(req: Request, res: Response<ApiResponseType>) {
    const user = req.user;
    if (!user) {
        res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
        });
        return;
    }

    console.log('Getting interviews for user:', user.id);

    try {
        const interviews = await getInterviews(user.id);
        res.status(200).json({
            success: true,
            message: 'Interviews fetched successfully',
            data: interviews,
        });
    } catch (error) {
        console.error('Error getting interviews:', error);
        res.status(500).json({
            success: false,
            error: { code: 'ERROR_GETTING_INTERVIEWS', message: 'Error getting interviews' },
        });
        return;
    }
}

export async function deleteInterviewController(req: Request, res: Response<ApiResponseType>) {
    const { interview_id } = req.body;
    if (!interview_id) {
        res.status(400).json({
            success: false,
            error: { code: 'INTERVIEW_ID_REQUIRED', message: 'Interview ID is required' },
        });
        return;
    }

    const user = req.user;
    if (!user) {
        res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
        });
        return;
    }

    try {
        await deleteInterview(interview_id);
        res.status(200).json({
            success: true,
            message: 'Interview deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting interview:', error);
        res.status(500).json({
            success: false,
            error: { code: 'ERROR_DELETING_INTERVIEW', message: 'Error deleting interview' },
        });
        return;
    }
}

export async function renameInterviewController(req: Request, res: Response<ApiResponseType>) {
    const { interview_id, new_name } = req.body;
    if (!interview_id) {
        res.status(400).json({
            success: false,
            error: {
                code: 'INTERVIEW_ID_REQUIRED',
                message: 'Interview ID is required',
            },
        });
        return;
    }

    if (!new_name) {
        res.status(400).json({
            success: false,
            error: { code: 'NEW_NAME_REQUIRED', message: 'New name is required' },
        });
        return;
    }

    const user = req.user;
    if (!user) {
        res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
        });
        return;
    }

    try {
        await renameInterview(interview_id, new_name);
        res.status(200).json({
            success: true,
            message: 'Interview renamed successfully',
        });
    } catch (error) {
        console.error('Error renaming interview:', error);
        res.status(500).json({
            success: false,
            error: { code: 'ERROR_RENAME_INTERVIEW', message: 'Error renaming interview' },
        });
        return;
    }
}

export async function getReportController(req: Request, res: Response<ApiResponseType>) {
    const { interview_id } = req.body;
    if (!interview_id) {
        res.status(400).json({
            success: false,
            error: { code: 'INTERVIEW_ID_REQUIRED', message: 'Interview ID is required' },
        });
        return;
    }

    const user = req.user;
    if (!user) {
        res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
        });
        return;
    }

    let report;

    console.log('Getting report for user:', user.id, interview_id);

    report = await getReport(user.id, interview_id);
    if (report && report.is_created) {
        res.status(200).json({
            success: true,
            message: 'Report fetched successfully',
            data: report,
        });
        return;
    } else {
        const messagesHistory = await getMessages(interview_id, user.id);
        if (!messagesHistory) {
            res.status(500).json({
                success: false,
                error: { code: 'ERROR_GETTING_MESSAGES', message: 'Error getting messages' },
            });
            return;
        }

        const messages: AiMessageType[] = [];
        messagesHistory.forEach((message) => {
            messages.push({
                role: message.role as 'user' | 'model',
                parts: message.parts as Part[],
            });
        });

        const interview = await getInterview(user.id, interview_id);
        report = await generateReport(messages, new Date(interview!.created_at).toLocaleString());
        if (!report) {
            res.status(500).json({
                success: false,
                error: { code: 'ERROR_GENERATING_REPORT', message: 'Error generating report' },
            });
            return;
        }
        // const reportUrl = await uploadReport(interview_id, report);
        // if (!reportUrl) {
        //     res.status(500).json({
        //         success: false,
        //         error: { code: "ERROR_UPLOADING_REPORT", message: "Error uploading report" },
        //     });
        //     return;
        // }
        // report = await updateReport(user.id, interview_id, report, reportUrl, true);
        report = await updateReport(user.id, interview_id, report, '', true);
        if (!report) {
            res.status(500).json({
                success: false,
                error: { code: 'ERROR_UPDATING_REPORT', message: 'Error updating report' },
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Report generated successfully',
            data: report,
        });
    }
}

export async function endInterviewController(req: Request, res: Response<ApiResponseType>) {
    const { interview_id } = req.body;
    if (!interview_id) {
        res.status(400).json({
            success: false,
            error: { code: 'INTERVIEW_ID_REQUIRED', message: 'Interview ID is required' },
        });
        return;
    }

    const user = req.user;
    if (!user) {
        res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
        });
        return;
    }

    try {
        await endInterview(interview_id, user.id);
        res.status(200).json({
            success: true,
            message: 'Interview ended successfully',
        });
    } catch (error) {
        console.error('Error ending interview:', error);
        res.status(500).json({
            success: false,
            error: { code: 'ERROR_ENDING_INTERVIEW', message: 'Error ending interview' },
        });
    }
}
