import dotenv from 'dotenv';
dotenv.config({ override: true });
import express, { Request, Response } from 'express';
import cors from 'cors';
import interviewRoutes from '@routes/interviewRoutes';
import spellCheckRoutes from '@routes/spellCheckRoutes';
import testRoutes from '@routes/testRoutes';
import authenticate from '@middlewares/authenticate';
import { exec } from 'child_process';

const app = express();

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
});

process.on('SIGINT', () => {
    console.log('Received SIGINT signal');
});

app.get('/', (req: Request, res: Response) => {
    res.send('Express + TypeScript Server');
});

app.use('/interview', authenticate, interviewRoutes);
app.use('/spell-check', authenticate, spellCheckRoutes);
app.use('/test', testRoutes);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Server running at ${PORT}`);
});

type ServerError = Error & {
    code?: string;
};

server.on('error', (error: ServerError) => {
    if (error.code === 'EADDRINUSE') {
        console.log('Port is already in use. Killing process...');
        if (process.platform === 'win32') {
            exec(`netstat -ano | findstr ${PORT}`, (err, stdout, stderr) => {
                if (err) {
                    console.error('Error executing netstat command:', err);
                    return;
                }
                if (stderr) {
                    console.error('Command stderr:', stderr);
                    return;
                }
                const pid = stdout.split('\n')[0].trim().split(/\s+/)[4];
                console.log('Process using port:', pid);
                exec(`taskkill /PID ${pid} /F`, (killErr, killStdout) => {
                    if (killErr) {
                        console.error('Error killing process:', killErr);
                        return;
                    }
                    console.log(killStdout);
                });
            });
        } else {
            // Mac and Linux
            exec(`lsof -i :${PORT} | grep LISTEN`, (err, stdout, stderr) => {
                if (err) {
                    console.error('Error finding process:', err);
                    process.exit(1);
                }
                if (stderr) {
                    console.error('Command stderr:', stderr);
                    process.exit(1);
                }
                const pid = stdout.trim().split(/\s+/)[1];
                console.log('Process using port:', pid);
                exec(`kill -9 ${pid}`, (killErr, killStdout) => {
                    if (killErr) {
                        console.error('Error killing process:', killErr);
                        process.exit(1);
                    }
                    if (killStdout) {
                        console.log(killStdout);
                    }
                });
            });
        }
    } else {
        console.error('An error occurred while starting the server.', error);
    }
});
