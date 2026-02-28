import dotenv from 'dotenv';
dotenv.config({ override: true });
import express, { Request, Response } from 'express';
import cors from 'cors';
import interviewRoutes from '@routes/interviewRoutes';
import spellCheckRoutes from '@routes/spellCheckRoutes';
import testRoutes from '@routes/testRoutes';
import pingRoutes from '@routes/pingRoutes';
import authenticate from '@middlewares/authenticate';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { messagesCache } from './controllers/interviewControllers';
import { GeminiClient } from './llm/geminiClient';
import { systemPrompt } from './llm/prompts';
import { createMessage, updateInterview } from './db/supabaseUtils';

const app = express();
const expressServer = createServer(app);
export const wss = new WebSocketServer({ server: expressServer });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

if (!process.env.GEMINI_API_KEY) {
    console.error('FATAL ERROR: GEMINI_API_KEY environment variable is not set.');
    console.log('Please ensure it is present in your .env file.');
    process.exit(1);
}

console.log('Current working directory:', process.cwd());
console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
console.log('SUPABASE_KEY exists:', !!process.env.SUPABASE_KEY);

// Add these debugging event listeners
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

process.on('exit', (code) => {
    console.log(`Process exiting with code: ${code}`);
});

process.on('SIGTERM', () => {
    console.log('Received SIGTERM signal');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('Received SIGINT signal');
    process.exit(0);
});

app.get('/', (req: Request, res: Response) => {
    res.send('Express + TypeScript Server');
});

app.use('/interview', authenticate, interviewRoutes);
app.use('/spell-check', authenticate, spellCheckRoutes);
app.use('/test', testRoutes);
app.use('/ping', pingRoutes);

const PORT = process.env.PORT || 3000;
const server = expressServer.listen(PORT, () => {
    console.log(`Server running at ${PORT}`);
});

wss.on('connection', (ws) => {
    console.log('[WS] New client connected');
    let geminiClient: GeminiClient | null = null;
    let user_id: string | null = null;
    let interview_id: string | null = null;

    ws.onmessage = async (event) => {
        console.log('[WS] Received message:', event.data.toString());

        if (event.data.toString().includes('START_INTERVIEW')) {
            console.log('[WS] Processing START_INTERVIEW message');
            user_id = event.data.toString().split(' ')[1];
            interview_id = event.data.toString().split(' ')[2];
            if (!user_id || !interview_id) {
                console.error('[WS] Invalid message format');
                return;
            }
            console.log('[WS] Interview ID:', interview_id);

            const messagesHistory = messagesCache.get(interview_id);

            try {
                geminiClient = new GeminiClient('flash', messagesHistory || [], systemPrompt);
                console.log('[WS] Gemini client initialized for interview_id:', interview_id);
            } catch (error) {
                console.error('[WS] Error initializing Gemini client:', error);
            }
        } else if (event.data.toString().includes('END_INTERVIEW')) {
            console.log(
                '[WS] Ending interview and closing connection for interview_id:',
                interview_id
            );
            geminiClient = null;
            ws.close();
            return;
        } else {
            const newMessage = event.data.toString();
            await createMessage(user_id!, interview_id!, newMessage, 'user', [
                {
                    text: newMessage,
                },
            ]);
            try {
                const streamGenerator = await geminiClient!.chatWithGeminiStream(newMessage);

                let modelReplyRaw = '';
                for await (const chunk of streamGenerator) {
                    if (chunk.text) {
                        modelReplyRaw += chunk.text;
                        ws.send(chunk.text);
                    } else {
                        ws.send('No response from AI');
                    }
                }
                ws.send('__END_OF_STREAM__');
                await createMessage(user_id!, interview_id!, modelReplyRaw, 'model', [
                    { text: modelReplyRaw },
                ]);
                if (
                    modelReplyRaw.includes(
                        'Thank you for your time, we will get back to you with the results.'
                    )
                ) {
                    updateInterview(user_id!, interview_id!, true);
                    geminiClient = null;
                    ws.close();
                    console.log(
                        '[WS] Ending interview and closing connection for interview_id:',
                        interview_id
                    );
                }
            } catch (error) {
                console.error('Streaming error:', error);
                ws.send('__ERROR__');
            }
        }
    };

    ws.onclose = () => {
        console.log('[WS] Client disconnected');
        geminiClient = null;
    };

    ws.onerror = (error) => {
        console.error('[WS] WebSocket error:', error);
    };
});

wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
});

wss.on('close', () => {
    console.log('WebSocket server closed');
});

type ServerError = Error & {
    code?: string;
};

server.on('error', (error: ServerError) => {
    if (error.code === 'EADDRINUSE') {
        console.log('Port is already in use');
        process.exit(1);
    } else {
        console.error('An error occurred while starting the server.', error);
        process.exit(1);
    }
});
