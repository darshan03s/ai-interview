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
import { Message } from '@llm/types';
import type { ApiResponseType } from '@/types';
import { User } from '@supabase/supabase-js';

declare module 'express-serve-static-core' {
    interface Request {
        user: User;
    }
}

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
    await createReport(user.id, interview.interview_id, '', '');

    if (!interview) {
        res.status(500).json({
            success: false,
            error: { code: 'ERROR_CREATING_INTERVIEW', message: 'Error creating interview' },
        });
        return;
    }

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
        if (!messagesHistory) {
            res.status(500).json({
                success: false,
                error: { code: 'ERROR_GETTING_MESSAGES', message: 'Error getting messages' },
            });
            return;
        }
        if (messagesHistory.length === 0) {
            const pdfResp = await fetch(interview.resume_url).then((response) =>
                response.arrayBuffer()
            );
            await createMessage(
                user.id,
                interview_id,
                `Here is my resume. I have chosen to do a ${interview.interview_type} interview.`,
                'user',
                [
                    {
                        text: `Here is my resume. I have chosen to do a ${interview.interview_type} interview.`,
                    },
                    {
                        inlineData: {
                            mimeType: 'application/pdf',
                            data: Buffer.from(pdfResp).toString('base64'),
                        },
                    },
                ]
            );
        }

        res.status(200).json({
            success: true,
            message: 'Interview prepared successfully',
            data: interview,
        });
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
    if (!interview_id) {
        res.status(400).json({
            success: false,
            error: { code: 'INTERVIEW_ID_REQUIRED', message: 'Interview ID is required' },
        });
        return;
    }
    if (!message) {
        res.status(400).json({
            success: false,
            error: { code: 'MESSAGE_REQUIRED', message: 'Message is required' },
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
        const messagesHistory = await getMessages(interview_id, user.id);
        const messages: Message[] = [];
        if (!messagesHistory) {
            res.status(500).json({
                success: false,
                error: { code: 'ERROR_GETTING_MESSAGES', message: 'Error getting messages' },
            });
            return;
        }
        messagesHistory.forEach((message) => {
            messages.push({
                role: message.role,
                parts: message.parts,
            });
        });
        messages.push({
            role: 'user',
            parts: [
                {
                    text: message,
                },
            ],
        });
        await createMessage(user.id, interview_id, message, 'user', [
            {
                text: message,
            },
        ]);

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

        let modelReplyRaw = '';
        for await (const chunk of stream) {
            modelReplyRaw += chunk.text;
            res.write(chunk.text);
        }

        res.end();

        await createMessage(user.id, interview_id, modelReplyRaw, 'model', [
            { text: modelReplyRaw },
        ]);
        if (
            modelReplyRaw.includes(
                'Thank you for your time, we will get back to you with the results.'
            )
        ) {
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

        let messagesHistory: { role: string; message: string }[] = [];
        messages.forEach((message) => {
            messagesHistory.push({
                role: message.role,
                message: message.message,
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

        const messages: Message[] = [];
        messagesHistory.forEach((message) => {
            messages.push({
                role: message.role,
                parts: message.parts,
            });
        });

        const interview = await getInterview(user.id, interview_id);
        report = await generateReport(messages, new Date(interview.created_at).toLocaleString());
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
